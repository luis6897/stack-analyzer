"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AnalyzerForm from "@/components/AnalyzerForm";

interface FormData {
    description: string
    projectType: string
    teamSize: string
    scale: string
    languages: string[]
    priorities: string[]
}

export default function Home() {
    const router = useRouter()
    const [started, setStarted] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    async function handleSubmit(data: FormData) {
        try {
            setLoading(true)
            setError(null)

            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            })

            const json = await res.json()

            if (!res.ok) {
                setError(json.error ?? 'Error al analizar el proyecto')
                return
            }

            sessionStorage.setItem('result', JSON.stringify(json))
            router.push('/result')

        } catch {
            setError('Error de conexión, intenta de nuevo')
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="min-h-screen max-w-4xl mx-auto flex flex-col items-center justify-center px-4">
            {!started ? (
                <div className="text-center">
                    <h1 className="text-5xl font-semibold mb-4">Stack Analyzer</h1>
                    <p className="text-gray-400 mb-8">
                        Una herramienta orientada a desarrolladores, equipos técnicos y estudiantes seleccionar stack tecnológico más adecuado para sus proyectos de software.
                    </p>
                    <button
                        onClick={() => setStarted(true)}
                        className="bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-300 hover:text-black transition-colors duration-200 ease-in-out">
                        Iniciar
                    </button>
                </div>
            ) : (
                <div className="">
                    {error && (
                        <p className="bg-red-500 text-white px-6 py-3 rounded-lg mb-4 text-sm font-semibold text-center">{error}</p>
                    )}
                    <AnalyzerForm onSubmit={handleSubmit} loading={loading} />
                </div>
            )}
        </main>
    )
}