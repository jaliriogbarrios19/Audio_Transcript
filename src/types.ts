import type { Transcriber } from "./transcriber";

export interface Utterance {
  speaker: number;
  text: string;
  start: number;
  end: number;
}

export interface TranscriptionOptions {
  speakerNames: string[];
  language?: string;
  signal?: AbortSignal;
  model?: string;
  onProgress?: (pct: number) => void;
}

export interface SpeakerMapping {
  count: number;
  names: string[];
}

export type RecordingSampleRate = 16000 | 22050 | 44100;

export type RecordingMode = "desktop" | "mobile";

export type TranscriptionProvider =
  | "gladia"
  | "deepgram"
  | "assemblyai"
  | "whisper"
  | "groq"
  | "whisper-local"
  | "spob";

export interface ProviderMeta {
  id: TranscriptionProvider;
  label: string;
  transcriber: Transcriber;
  apiKeyField: keyof import("./settings").PluginSettings;
  modelField?: keyof import("./settings").PluginSettings;
  supportsDiarization: boolean;
  requiresApiKey: boolean;
  testEndpoint?: string;
  testMethod?: "GET" | "POST";
}

export const PROVIDERS: {
  value: TranscriptionProvider;
  label: string;
}[] = [
  { value: "gladia", label: "Gladia" },
  { value: "deepgram", label: "Deepgram" },
  { value: "assemblyai", label: "AssemblyAI" },
  { value: "whisper", label: "OpenAI Whisper" },
  { value: "groq", label: "Groq (Whisper)" },
  { value: "whisper-local", label: "Whisper (local)" },
  { value: "spob", label: "Smart Plugins Obsidian (AssemblyAI)" },
];

export const DIARIZATION_WARNING: Record<TranscriptionProvider, string | null> =
  {
    gladia: null,
    deepgram: null,
    assemblyai: null,
    whisper:
      "OpenAI Whisper no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    groq: "Groq (Whisper) no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    "whisper-local":
      "Whisper local no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
    spob: null,
  };

export type LLMProvider =
  | "openai" | "anthropic" | "deepseek" | "gemini"
  | "openrouter" | "grok" | "glm" | "spob";

export interface LLMModel {
  modelId: string;
  label: string;
  description: string;
}

export const LLM_PROVIDERS: { value: LLMProvider; label: string }[] = [
  { value: "openai", label: "OpenAI" },
  { value: "anthropic", label: "Anthropic Claude" },
  { value: "deepseek", label: "DeepSeek" },
  { value: "gemini", label: "Google Gemini" },
  { value: "openrouter", label: "OpenRouter" },
  { value: "grok", label: "Grok (xAI)" },
  { value: "glm", label: "GLM (Z.ai)" },
  { value: "spob", label: "Smart Plugins Obsidian (DeepSeek)" },
];

export const LLM_MODELS: Record<LLMProvider, LLMModel[]> = {
  openai: [
    { modelId: "gpt-5.5", label: "GPT-5.5", description: "Flagship. 1M ctx." },
    { modelId: "gpt-5.4", label: "GPT-5.4", description: "Professional. 1M ctx." },
    { modelId: "gpt-5.4-mini", label: "GPT-5.4 Mini", description: "Fast, cheap. 400k ctx." },
    { modelId: "gpt-5.4-nano", label: "GPT-5.4 Nano", description: "Ultra-low-cost." },
    { modelId: "gpt-5.2", label: "GPT-5.2", description: "Previous frontier." },
  ],
  anthropic: [
    { modelId: "claude-opus-4-7", label: "Claude Opus 4.7", description: "Most capable. 1M ctx." },
    { modelId: "claude-sonnet-4-6", label: "Claude Sonnet 4.6", description: "Speed/iq balance." },
    { modelId: "claude-haiku-4-5", label: "Claude Haiku 4.5", description: "Fast, near-frontier." },
  ],
  deepseek: [
    { modelId: "deepseek-v4-pro", label: "DeepSeek V4 Pro", description: "Top-tier. 1M ctx." },
    { modelId: "deepseek-v4-flash", label: "DeepSeek V4 Flash", description: "Fast, cheap. 1M ctx." },
  ],
  gemini: [
    { modelId: "gemini-2.5-pro", label: "Gemini 2.5 Pro", description: "Flagship. 1M+ ctx." },
    { modelId: "gemini-2.5-flash", label: "Gemini 2.5 Flash", description: "Fast, high-volume." },
    { modelId: "gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite", description: "Most affordable." },
  ],
  openrouter: [
    { modelId: "openai/gpt-5.5", label: "GPT-5.5 (via OR)", description: "Via OpenRouter" },
    { modelId: "anthropic/claude-opus-4-7", label: "Claude Opus 4.7 (via OR)", description: "Via OpenRouter" },
    { modelId: "deepseek/deepseek-v4-pro", label: "DeepSeek V4 Pro (via OR)", description: "Via OpenRouter" },
  ],
  grok: [
    { modelId: "grok-4.3", label: "Grok 4.3", description: "Flagship. 1M ctx." },
    { modelId: "grok-4.20-0309-non-reasoning", label: "Grok 4.20 Non-Reasoning", description: "Razonamiento off." },
  ],
  glm: [
    { modelId: "glm-4-plus", label: "GLM-4 Plus", description: "Top-tier. 128k ctx." },
    { modelId: "glm-4-flash", label: "GLM-4 Flash", description: "Fast, low-cost." },
  ],
  spob: [
    { modelId: "deepseek-v4-pro", label: "DeepSeek V4 Pro (spob)", description: "Vía spob." },
    { modelId: "deepseek-v4-flash", label: "DeepSeek V4 Flash (spob)", description: "Vía spob." },
  ],
};

export const API_KEY_FIELDS: Record<LLMProvider, string> = {
  openai: "openaiApiKey", anthropic: "anthropicApiKey",
  deepseek: "deepseekApiKey", gemini: "geminiApiKey",
  openrouter: "openrouterApiKey", grok: "grokApiKey",
  glm: "glmApiKey", spob: "spobApiKey",
};

export interface TranscriptionEntry {
  path: string;
  noteName: string;
  date: string;
  speakerCount: number;
  preview: string;
  calloutContent: string;
}

export interface PromptTemplate {
  name: string;
  prompt: string;
}

export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatSession {
  id: string;
  timestamp: number;
  title: string;
  mode: "flash" | "advanced";
  messages: ChatMessage[];
}

export const CHAT_HISTORY_LIMIT = 20;

export const DEFAULT_TEMPLATES: PromptTemplate[] = [
  {
    name: "Resumir",
    prompt: `Redactá un resumen profesional con esta estructura:

## Resumen Ejecutivo
[Sintesis de 2-3 oraciones del contenido]

## Puntos Clave
- Punto principal 1
- Punto principal 2

## Temas Tratados
1. **Tema**: descripcion breve
2. **Tema**: descripcion breve

## Conclusiones
- Conclusion principal

Usa lenguaje formal y objetivo.`,
  },
  { name: "Decisiones", prompt: "Extrae las decisiones y acuerdos principales en formato de lista con viñetas. Agrupalas por tema si aplica." },
  {
    name: "Tareas",
    prompt: `Identifica las tareas pendientes mencionadas. Usa este formato:

## Tareas Pendientes
- [ ] **Tarea**: responsable (si se menciona), plazo (si se menciona)

## Seguimiento
- Notas adicionales sobre cada tarea si las hay`,
  },
  {
    name: "Minuta",
    prompt: `Redacta una minuta de reunion formal con esta estructura:

## Minuta de Reunion
**Fecha**: [fecha si se menciona]
**Participantes**: [nombres si se mencionan]

## Agenda
1. Tema tratado
2. Tema tratado

## Desarrollo
### Tema 1
[Resumen de la discusion]

### Tema 2
[Resumen de la discusion]

## Decisiones
- Decision 1
- Decision 2

## Tareas y Responsables
| Tarea | Responsable | Plazo |
|-------|-------------|-------|
| | | |

Usa lenguaje formal. Si falta algun dato, indica "No especificado".`,
  },
];
