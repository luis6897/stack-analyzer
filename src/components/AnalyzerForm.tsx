"use client";
import { useState } from "react";

interface FormData {
  description: string
  projectType: string
  teamSize: string
  scale: string
  languages: string[]
  priorities: string[]
}

interface AnalyzeFormProps {
  onSubmit: (data: FormData) => void
  loading: boolean
}

const PROJECT_TYPES = [
  { value: 'landing', label: 'Landing Page' },
  { value: 'web', label: 'Aplicación Web' },
  { value: 'mobile', label: 'Aplicación Móvil' },
  { value: 'api', label: 'API / Backend' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'saas', label: 'SaaS' },
  { value: 'ml', label: 'Machine Learning' },
  { value: 'devops', label: 'DevOps / Infraestructura' },
]


const TEAM_SIZES = [
  { value: 'solo', label: 'Solo (1 persona)' },
  { value: 'small', label: 'Pequeño (2-5 personas)' },
  { value: 'medium', label: 'Mediano (6-15 personas)' },
  { value: 'large', label: 'Grande (15+ personas)' },
]

const SCALES = [
  { value: 'low', label: 'Baja (uso personal o interno)' },
  { value: 'medium', label: 'Media (cientos de usuarios)' },
  { value: 'high', label: 'Alta (miles de usuarios)' },
]

const LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Go',
  'Rust',
  'Java',
]

const PRIORITIES = [
  'Performance',
  'Escalabilidad',
  'Velocidad de desarrollo',
  'Simplicidad',
  'Seguridad',
  'Costo',
]

export default function AnalyzeForm({ onSubmit, loading }: AnalyzeFormProps) {
  const [form, setForm] = useState<FormData>({
    description: '',
    projectType: '',
    teamSize: '',
    scale: '',
    languages: [],
    priorities: [],
  })

  function handleCheckbox(field: 'languages' | 'priorities', value: string) {
    setForm((prev) => {
      const current = prev[field]
      return {
        ...prev,
        [field]: current.includes(value)
          ? current.filter((v) => v !== value)
          : [...current, value],
      }
    })
  }

  function handleSubmit() {
    onSubmit(form)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-black">Descripción del proyecto</label>
        <textarea
          rows={4}
          placeholder="Ej: Quiero hacer una app de delivery con pagos en línea y seguimiento en tiempo real..."
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          className="border border-gray-200 rounded-lg px-4 py-3 text-sm resize-none focus:outline-none focus:ring-1 focus:ring-black"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-black">Tipo de proyecto</label>
        <select value={form.projectType} onChange={(e) => setForm({ ...form, projectType: e.target.value })}
          className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black">
          <option value="">Selecciona una opción</option>
          {PROJECT_TYPES.map((t) => (
            <option key={t.value} value={t.value} className="rounded-lg">{t.label}</option>

          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-gray-700">Tamaño del equipo</label>
        <select value={form.teamSize} onChange={(e) => setForm({ ...form, teamSize: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black">
          <option value="">Selecciona una opción</option>
          {TEAM_SIZES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-gray-700">Escala esperada</label>
        <select value={form.scale} onChange={(e) => setForm({ ...form, scale: e.target.value })} className="border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-black">
          <option value="">Selecciona una opción</option>
          {SCALES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-gray-700">Lenguajes preferidos (beta)</label>
        <div className="flex flex-wrap gap-2 justify-center">
          {LANGUAGES.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => handleCheckbox('languages', lang)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                form.languages.includes(lang)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-lg font-medium text-gray-700">Prioridades del proyecto</label>
        <div className="flex flex-wrap gap-2">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handleCheckbox('priorities', p)}
              className={`px-3 py-1 rounded-full text-sm border transition-colors ${
                form.priorities.includes(p)
                  ? 'bg-black text-white border-black'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="bg-black text-white px-6 py-3 rounded-lg hover:bg-gray-300 hover:text-black disabled:opacity-50 transition-colors duration-200 ease-in text-sm font-medium">
        {loading ? 'Analizando...' : 'Analizar'}
      </button>

    </div>
  )
}