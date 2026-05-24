import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "../../../../generated/prisma/client";
import { extractSignals, Signals } from "@/services/llm.service";
import { filterCandidates, enrich, rank, RankedStack } from "@/services/scorer.service";

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { projectType, teamSize, scale, languages, priorities, description } = body

    if (!projectType || !teamSize || !scale) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    // 1. LLM extrae signals
    const signals: Signals = await extractSignals({
      projectType,
      teamSize,
      scale,
      languages:  languages ?? [],
      priorities: priorities ?? [],
      description,
    })

    // Cast correcto para Prisma
    const signalsJson = signals as unknown as Prisma.JsonObject

    // 2. Filtra candidatos
    const candidates = filterCandidates({ ...signals, projectType: signals.projectType })

    if (candidates.length === 0) {
      return NextResponse.json(
        { error: 'No se encontraron stacks compatibles' },
        { status: 404 }
      )
    }

    // 3. Enriquece con APIs
    const enriched = await enrich(candidates)

    // 4. Rankea — se pasa el contexto completo con teamSize y scale
    const results = rank(enriched, { ...signals, teamSize, scale })

    // 5. Guarda en DB
    const analysis = await prisma.analyzer.create({
      data: {
        projectType,
        teamSize,
        scale,
        languages:  languages ?? [],
        priorities: priorities ?? [],
        description,
        signals: signalsJson,
        stackResults: {
          create: results.map((r: RankedStack) => ({
            stackKey:   r.stackKey,
            score:      r.score,
            rank:       r.rank,
            githubData: r.githubData as unknown as Prisma.JsonObject,
            npmData:    r.npmData    as unknown as Prisma.JsonObject,
          })),
        },
      },
      include: {
        stackResults: true,
      },
    })

    // 6. Combina datos de DB con breakdown en memoria
    const enrichedResults = analysis.stackResults
      .sort((a, b) => a.rank - b.rank)
      .map((r) => {
        const original = results.find((res: RankedStack) => res.stackKey === r.stackKey)
        return {
          ...r,
          name:        original?.name,
          description: original?.description,
          usedBy:      original?.usedBy,
          breakdown:   original?.breakdown,
        }
      })

    return NextResponse.json({
      analysisId: analysis.id,
      signals,
      results: enrichedResults,
    })

  } catch (error) {
    console.error('[analyze] Error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}