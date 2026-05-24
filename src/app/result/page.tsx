"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import StackCard from "@/components/StackCard";

interface Breakdown {
  contextFit: number
  popularity: number
  maintenance: number
  teamFit: number
}

interface StackResult {
  stackKey: string
  name: string
  description: string
  usedBy: string[]
  score: number
  rank: number
  breakdown: Breakdown
}

interface Results {
  analysisId: string
  signals: Record<string, boolean>
  results: StackResult[]
}

export default function ResultsPage() {
  const router = useRouter()
  const [data, setData] = useState<Results | null>(null)

  useEffect(() => {
    const stored = sessionStorage.getItem('result')
    if (!stored) {
      router.push('/')
      return
    }
    setData(JSON.parse(stored))
  }, [])

  if (!data) return (
    <main className="min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm">Cargando resultados...</p>
    </main>
  )

  return (
    <main className="min-h-screen px-4 py-16 max-w-2xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold mb-2">Resultados</h1>
        {data.signals?.reasoning && (
          <p className="text-sm text-gray-400 italic mt-1">
            "{data.signals.reasoning}"
          </p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {data.results.map((stack) => (
          <StackCard key={stack.stackKey} stack={stack} />
        ))}
      </div>

      <button onClick={() => {
        sessionStorage.removeItem('result')
        router.push('/')
      }}
        className="mt-10 text-sm text-gray-400 hover:text-black transition-colors">
        ← Hacer otro análisis
      </button>
    </main>
  )
}