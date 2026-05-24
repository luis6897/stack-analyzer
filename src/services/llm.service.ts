import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API });

export interface UserInput {
    projectType: string;
    teamSize: string;
    scale: string;
    languages: string[];
    priorities: string[];
    description?: string;
}

export interface Signals {
    realtimeNeeded: boolean;
    latencyCritical: boolean;
    heavyCompute: boolean;
    authNeeded: boolean;
    fileStorage: boolean;
    multiTenant: boolean;
    mobileFirst: boolean;
    preferSimplicity: boolean;
    projectType: string;
    reasoning: string;
}

export async function extractSignals(input: UserInput): Promise<Signals> {
    const response = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [
            {
                role: "system",
                content: `Eres un arquitecto de software experto. Analizas descripciones de proyectos y extraes señales técnicas clave. 
Responde SOLO con JSON válido, sin explicaciones ni texto adicional.`,
            },
            {
                role: "user",
                content: `Analiza este proyecto y extrae sus señales técnicas.

Descripción del usuario: "${input.description ?? "No proporcionada"}"
Tipo base: ${input.projectType}
Equipo: ${input.teamSize}
Escala: ${input.scale}
Lenguajes preferidos: ${input.languages.join(", ") || "ninguno"}
Prioridades: ${input.priorities.join(", ") || "ninguna"}

Basándote PRINCIPALMENTE en la descripción, determina:
- ¿Necesita datos en tiempo real? (chat, notificaciones, mapas en vivo)
- ¿La latencia es crítica? (pagos, trading, videollamadas)
- ¿Requiere cómputo pesado? (ML, procesamiento de video, análisis masivo)
- ¿Necesita autenticación de usuarios?
- ¿Necesita almacenamiento de archivos? (imágenes, documentos, videos)
- ¿Tiene múltiples organizaciones o clientes separados?
- ¿Es principalmente para móvil?
- ¿El equipo prefiere simplicidad sobre control?
- ¿Qué tipo de proyecto es realmente? (landing, web, api, mobile, ecommerce, saas, ml, devops)

Responde con este JSON exacto:
{
  "realtimeNeeded": boolean,
  "latencyCritical": boolean,
  "heavyCompute": boolean,
  "authNeeded": boolean,
  "fileStorage": boolean,
  "multiTenant": boolean,
  "mobileFirst": boolean,
  "preferSimplicity": boolean,
  "projectType": "landing|web|api|mobile|ecommerce|saas|ml|devops",
  "reasoning": "Una sola oración explicando por qué elegiste este stack"
}`,
            },
        ],
        temperature: 0.2,
        max_tokens: 300,
    });

    const text = response.choices[0].message.content ?? "{}";

    try {
        return JSON.parse(text);
    } catch {
        const match = text.match(/\{[\s\S]*\}/);
        return match ? JSON.parse(match[0]) : getDefaultSignals(input);
    }
}

function getDefaultSignals(input: UserInput): Signals {
    return {
        realtimeNeeded: false,
        latencyCritical: false,
        heavyCompute: false,
        authNeeded: true,
        fileStorage: false,
        multiTenant: false,
        mobileFirst: false,
        preferSimplicity: true,
        projectType: input.projectType,
        reasoning: "No se pudo analizar la descripción, usando valores por defecto.",
    };
}