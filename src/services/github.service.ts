import { prisma } from "@/lib/prisma";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const BASE_URL = "https://api.github.com";

async function fetchWithCache(key: string, url: string, ttlHours = 24) {
    const cached = await prisma.apiCache.findUnique({
        where: { key },
    });

    if (cached && cached.expiresAt > new Date()) {
        return cached.data;
    }

    const res = await fetch(url, {
        headers: {
            Accept: "application/vnd.github+json",
            ...(GITHUB_TOKEN && { Authorization: `Bearer ${GITHUB_TOKEN}` }),
        },
    });

    const data = await res.json();

    await prisma.apiCache.upsert({
        where: { key },
        update: { data, expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000) },
        create: { key, data, expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000) },
    });

    return data;
}

export async function getRepoData(repo: string) {
    const repoData = await fetchWithCache(
        `github_repo_${repo}`,
        `${BASE_URL}/repos/${repo}`
    );

    const contributorsData = await fetchWithCache(
        `github_contributors_${repo}`,
        `${BASE_URL}/repos/${repo}/contributors?per_page=1&anon=true`
    );

    const contributors = Array.isArray(contributorsData)
        ? contributorsData.length
        : 0;

    return {
        stars: repoData.stargazers_count ?? 0,
        forks: repoData.forks_count ?? 0,
        openIssues: repoData.open_issues_count ?? 0,
        lastPush: repoData.pushed_at ?? null,
        contributors,
    };
}