import { prisma } from "@/lib/prisma";

async function fetchWithCache(key: string, url: string, ttlHours = 24) {
    const cached = await prisma.apiCache.findUnique({
        where: { key },
    });

    if (cached && cached.expiresAt > new Date()) {
        return cached.data;
    }

    const res = await fetch(url);
    const data = await res.json();

    await prisma.apiCache.upsert({
        where: { key },
        update: { data, expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000) },
        create: { key, data, expiresAt: new Date(Date.now() + ttlHours * 3600 * 1000) },
    });

    return data;
}

export async function getPackageData(pkg: string) {
    // Info del paquete
    const info = await fetchWithCache(
        `npm_package_${pkg}`,
        `https://registry.npmjs.org/${pkg}`
    );

    // Descargas del último mes
    const downloads = await fetchWithCache(
        `npm_downloads_${pkg}`,
        `https://api.npmjs.org/downloads/point/last-month/${pkg}`
    );

    // Calcular días desde la última actualización
    const lastPublish = info.time?.modified ?? null;
    const daysSinceLastUpdate = lastPublish
        ? Math.floor(
            (Date.now() - new Date(lastPublish).getTime()) / (1000 * 60 * 60 * 24)
        )
        : 999;

    return {
        weeklyDownloads: downloads.downloads ?? 0,
        lastPublish,
        daysSinceLastUpdate,
        version: info["dist-tags"]?.latest ?? null,
    };
}