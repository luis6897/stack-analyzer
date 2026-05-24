import stacksData from "@/data/stacks.json";
import { getRepoData } from "@/services/github.service";
import { getPackageData } from "@/services/npm.service";
import { Signals } from "@/services/llm.service";
import { UserInput } from "@/services/llm.service";

// Tipo combinado: signals del LLM + contexto del formulario
type FullContext = Signals & Pick<UserInput, "teamSize" | "scale" | "languages" | "priorities">;

// Tipos internos
interface Stack {
    key: string;
    name: string;
    description: string;
    difficulty: "beginner" | "intermediate" | "advanced";
    projectType: string[];  // ← agregar esto
    usedBy: string[];
    languages: string[];
    tags: {
        realtimeNeeded: boolean;
        latencyCritical: boolean;
        heavyCompute: boolean;
        authNeeded: boolean;
        fileStorage: boolean;
        multiTenant: boolean;
        mobileFirst: boolean;
        preferSimplicity: boolean;
    };
    github: string[];
    npm: string[];
}

interface GithubStackData {
    stars: number;
    forks: number;
    contributors: number;
}

interface NpmStackData {
    downloads: number;
    daysSinceLastUpdate: number;
}

export interface EnrichedStack extends Stack {
    githubData: GithubStackData;
    npmData: NpmStackData;
}

export interface RankedStack {
    stackKey: string;
    name: string;
    description: string;
    usedBy: string[];
    score: number;
    rank: number;
    breakdown: {
        contextFit: number;
        popularity: number;
        maintenance: number;
        teamFit: number;
    };
    githubData: GithubStackData;
    npmData: NpmStackData;
}

// Filtra stacks que no cumplen requisitos mínimos del proyecto
export function filterCandidates(signals: Signals & { projectType: string }): Stack[] {
    const stacks = stacksData.stacks as Stack[];

    return stacks.filter((stack) => {
        // Filtro por tipo de proyecto
        if (!stack.projectType.includes(signals.projectType)) return false;
        // Filtro duro: mobile
        if (signals.mobileFirst && !stack.tags.mobileFirst) return false;
        return true;
    });
}

// Consulta GitHub y NPM para cada stack candidato
export async function enrich(candidates: Stack[]): Promise<EnrichedStack[]> {
    return Promise.all(
        candidates.map(async (stack) => {
            const githubResults = await Promise.all(
                stack.github.map((repo) => getRepoData(repo))
            );
            const npmResults = await Promise.all(
                stack.npm.map((pkg) => getPackageData(pkg))
            );

            const githubData: GithubStackData = {
                stars: avg(githubResults.map((r) => r.stars)),
                forks: avg(githubResults.map((r) => r.forks)),
                contributors: avg(githubResults.map((r) => r.contributors)),
            };

            const npmData: NpmStackData = {
                downloads: avg(npmResults.map((r) => r.weeklyDownloads)),
                daysSinceLastUpdate: avg(npmResults.map((r) => r.daysSinceLastUpdate)),
            };

            return { ...stack, githubData, npmData };
        })
    );
}

// Calcula scores y retorna el ranking ordenado
export function rank(enriched: EnrichedStack[], signals: FullContext): RankedStack[] {
    return enriched
        .map((stack) => {
            const contextFit = calculateContextFit(stack, signals);
            const popularity = calculatePopularity(stack.githubData);
            const maintenance = calculateMaintenance(stack.npmData);
            const teamFit = calculateTeamFit(stack, signals);

            const score = Math.round(
                contextFit * 0.4 +
                popularity * 0.25 +
                maintenance * 0.2 +
                teamFit * 0.15
            );

            return {
                stackKey: stack.key,
                name: stack.name,
                description: stack.description,
                usedBy: stack.usedBy,
                score,
                breakdown: {
                    contextFit: Math.round(contextFit),
                    popularity: Math.round(popularity),
                    maintenance: Math.round(maintenance),
                    teamFit: Math.round(teamFit),
                },
                githubData: stack.githubData,
                npmData: stack.npmData,
            };
        })
        .sort((a, b) => b.score - a.score)
        .map((r, index) => ({ ...r, rank: index + 1 }));
}

function calculateContextFit(stack: Stack, signals: FullContext): number {
    let score = 0;
    let maxScore = 0;

    const tagWeights: { key: keyof Stack["tags"]; weight: number }[] = [
        { key: "realtimeNeeded", weight: 20 },
        { key: "latencyCritical", weight: 15 },
        { key: "heavyCompute", weight: 15 },
        { key: "authNeeded", weight: 10 },
        { key: "fileStorage", weight: 10 },
        { key: "multiTenant", weight: 10 },
        { key: "mobileFirst", weight: 10 },
        { key: "preferSimplicity", weight: 10 },
    ];
    const priorityTagMap: Record<string, keyof Stack["tags"]> = {
        "performance": "latencyCritical",
        "escalabilidad": "multiTenant",
        "simplicidad": "preferSimplicity",
        "tiempo real": "realtimeNeeded",
        "almacenamiento": "fileStorage",
        "mobile": "mobileFirst",
    };

    if (signals.priorities?.length > 0) {
        for (const priority of signals.priorities) {
            const tag = priorityTagMap[priority.toLowerCase()];
            if (tag && stack.tags[tag] === true) {
                score += 10;
            }
            maxScore += 10;
        }
    }

    for (const { key, weight } of tagWeights) {
        maxScore += weight;
        if (stack.tags[key] === signals[key]) {
            score += weight;
        }
    }

    // Bonus por lenguaje preferido
    if (signals.languages?.length > 0) {
        const matchingLangs = signals.languages.filter((l: string) =>
            stack.languages.includes(l)
        );
        if (matchingLangs.length > 0) {
            score += 20;
        }
        maxScore += 20;
    }

    return (score / maxScore) * 100;
}

function calculatePopularity(data: GithubStackData): number {
    if (!data) return 0;

    const stars = Math.min(data.stars / 50000, 1) * 50;
    const forks = Math.min(data.forks / 10000, 1) * 30;
    const contributors = Math.min(data.contributors / 500, 1) * 20;

    return stars + forks + contributors;
}

function calculateMaintenance(data: NpmStackData): number {
    if (!data) return 0;

    const weeklyDownloads = Math.min(data.downloads / 1000000, 1) * 50;

    const daysSinceUpdate = data.daysSinceLastUpdate;
    let freshnessScore = 0;

    if (daysSinceUpdate < 7) freshnessScore = 50;
    else if (daysSinceUpdate < 30) freshnessScore = 40;
    else if (daysSinceUpdate < 90) freshnessScore = 25;
    else if (daysSinceUpdate < 180) freshnessScore = 10;
    else freshnessScore = 0;

    return weeklyDownloads + freshnessScore;
}

function calculateTeamFit(stack: Stack, signals: FullContext): number {
    let score = 100;

    if (
        stack.difficulty === "advanced" &&
        (signals.teamSize === "solo" || signals.teamSize === "small")
    ) {
        score -= 40;
    }

    if (
        stack.difficulty === "intermediate" &&
        signals.teamSize === "solo" &&
        signals.preferSimplicity
    ) {
        score -= 20;
    }

    if (stack.difficulty === "beginner" && signals.preferSimplicity) {
        score += 10;
    }

    if (signals.scale === "high" && stack.difficulty === "beginner") {
        score -= 20;
    }

    return Math.max(0, Math.min(100, score));
}

function avg(numbers: number[]): number {
    if (numbers.length === 0) return 0;
    return Math.round(numbers.reduce((a, b) => a + b, 0) / numbers.length);
}