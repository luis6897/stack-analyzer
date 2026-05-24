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
  
  interface StackCardProps {
    stack: StackResult
  }
  
  const DIMENSION_LABELS: Record<keyof Breakdown, string> = {
    contextFit: 'Contexto',
    popularity: 'Popularidad',
    maintenance: 'Mantenimiento',
    teamFit: 'Equipo',
  }
  
  export default function StackCard({ stack }: StackCardProps) {
    return (
      <div className="border border-gray-200 rounded-xl p-6 flex flex-col gap-4">

        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 font-medium">
                #{stack.rank}
              </span>
              <h2 className="text-lg font-semibold">{stack.name}</h2>
            </div>
            <p className="text-sm text-gray-500">{stack.description}</p>
          </div>
          <div className="text-right shrink-0 ml-4">
            <p className="text-3xl font-bold">{stack.score}</p>
            <p className="text-xs text-gray-400">/ 100</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {(Object.keys(stack.breakdown) as (keyof Breakdown)[]).map((key) => (
            <div key={key} className="flex flex-col gap-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>{DIMENSION_LABELS[key]}</span>
                <span>{stack.breakdown[key]}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="bg-black h-1.5 rounded-full transition-all"
                  style={{ width: `${stack.breakdown[key]}%` }}
                />
              </div>
            </div>
          ))}
        </div>
  
        {stack.usedBy.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {stack.usedBy.map((company) => (
              <span key={company} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                {company}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }