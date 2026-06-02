export interface LocaleStrings {
  openNoteFirst: string;
  micAccessFailed: string;
  recorderUnsupported: string;
  recordingError: string;
  recording: string;
  paused: string;
  pause: string;
  resume: string;
  stop: string;
  transcribing: string;
  transcriptionReady: string;
  transcriptionFailed: string;
  noSpeech: string;
  noApiKey: string;
  diarizationWarning: string;
  testConnection: string;
  testing: string;
  connected: string;
  failed: string;
  chooseAction: string;
  recordAudio: string;
  chooseFile: string;
  speakerConfig: string;
  speakerCount: string;
  startTranscription: string;
  providerLabel: string;
  languageLabel: string;
  languageDetectionLabel: string;
  autoDetection: string;
  manualDetection: string;
  outputTemplateLabel: string;
  outputTemplateDesc: string;
  insertAsCalloutLabel: string;
  insertAsCalloutDesc: string;
  audioFolderLabel: string;
  audioFolderDesc: string;
  modelLabel: string;
  allApiKeys: string;
  apiKeysDesc: string;
  showKey: string;
  hideKey: string;
  apiKeyPlaceholder: string;
  whisperLocalUrlLabel: string;
  whisperLocalUrlDesc: string;
  recordingQualityLabel: string;
  recordingQualityDesc: string;
  sampleRate16kHz: string;
  sampleRate22kHz: string;
  sampleRate44kHz: string;
  saveAudioLabel: string;
  saveAudioDesc: string;
  dashboardTitle: string;
  noLLMConfig: string;
  noLLMConfigHint: string;
  credit: string;
  transcriptions: string;
  templates: string;
  aiProvider: string;
  newChat: string;
  refreshBtn: string;
  history: string;
  historyEmpty: string;
  summarize: string;
  generatingSummary: string;
  summaryDone: string;
  summaryInserted: string;
  nothingToSummarize: string;
  configLLM: string;
  chatTitle: string;
  chatNoConfig: string;
  contextSection: string;
  noTranscriptions: string;
  templateSection: string;
  freePrompt: string;
  yourMessage: string;
  send: string;
  sending: string;
  close: string;
  thinking: string;
  writeMessage: string;
  previewNoText: string;
}

const es: LocaleStrings = {
  openNoteFirst: "Abre una nota primero",
  micAccessFailed: "No se pudo acceder al micrófono. Verifica los permisos.",
  recorderUnsupported:
    "No se pudo iniciar la grabación. El formato no es compatible con este navegador.",
  recordingError: "Error durante la grabación.",
  recording: "Grabando",
  paused: "En pausa",
  pause: "Pausar",
  resume: "Reanudar",
  stop: "Detener",
  transcribing: "Transcribiendo",
  transcriptionReady: "Transcripción lista",
  transcriptionFailed: "Falló la transcripción",
  noSpeech: "(No se detectó voz)",
  noApiKey: "No API key configurada para",
  diarizationWarning:
    "Este proveedor no tiene diarización de hablantes. La transcripción será un solo bloque de texto.",
  testConnection: "Probar",
  testing: "Probando...",
  connected: "✓ Conectado",
  failed: "✗ Falló",
  chooseAction: "¿Qué querés hacer?",
  recordAudio: "Grabar audio",
  chooseFile: "Elegir archivo",
  speakerConfig: "Configuración de hablantes",
  speakerCount: "Número de hablantes",
  startTranscription: "Iniciar transcripción",
  providerLabel: "Proveedor",
  languageLabel: "Idioma predeterminado",
  languageDetectionLabel: "Detección de idioma",
  autoDetection: "Automática",
  manualDetection: "Manual",
  outputTemplateLabel: "Plantilla de salida",
  outputTemplateDesc:
    "Variables: {speaker}, {time}, {text}. Cada bloque de hablante se separa con un salto de línea doble.",
  insertAsCalloutLabel: "Insertar en callout",
  insertAsCalloutDesc:
    "Envuelve la transcripción en un bloque >[!transcription] plegable",
  audioFolderLabel: "Carpeta de grabaciones",
  audioFolderDesc:
    "Ruta relativa al vault donde guardar los audios. Vacío = misma carpeta que la nota activa.",
  modelLabel: "Modelo",
  allApiKeys: "Todas las API Keys",
  apiKeysDesc: "Las claves se almacenan localmente en los datos del plugin.",
  showKey: "Mostrar",
  hideKey: "Ocultar",
  apiKeyPlaceholder: "Ingresa tu API key",
  whisperLocalUrlLabel: "URL del servidor",
  whisperLocalUrlDesc:
    "URL del servidor whisper.cpp (ej: http://localhost:8080)",
  recordingQualityLabel: "Calidad de grabación",
  recordingQualityDesc:
    "Define la frecuencia de muestreo del audio. 16 kHz es el mínimo para diarización de hablantes.",
  sampleRate16kHz: "16 kHz (recomendado, buena diarización, ~1.9 MB/min)",
  sampleRate22kHz: "22.05 kHz (mejor calidad, ~2.6 MB/min)",
  sampleRate44kHz: "44.1 kHz (máxima calidad, ~5.3 MB/min)",
  saveAudioLabel: "Guardar audio después de transcribir",
  saveAudioDesc:
    "Desmarcalo para audios largos. El audio se descarta después de la transcripción.",
  dashboardTitle: "Audio Transcript — Dashboard",
  noLLMConfig:
    "Activá un proveedor LLM en Settings para desbloquear resúmenes y chat con IA.",
  noLLMConfigHint: "Settings → Audio Transcript → IA (Proveedor LLM)",
  credit: "Crédito",
  transcriptions: "Transcripciones",
  templates: "Templates",
  aiProvider: "Proveedor IA",
  newChat: "Nuevo chat",
  refreshBtn: "Refrescar",
  history: "Historial de transcripciones",
  historyEmpty: "No hay transcripciones todavía. Grabá o transcribí un audio para empezar.",
  summarize: "Resumir",
  generatingSummary: "Generando resumen...",
  summaryDone: "Resumen listo",
  summaryInserted: "Resumen listo e insertado en la nota",
  nothingToSummarize: "Nada para resumir",
  configLLM: "Configurá un proveedor LLM en Settings.",
  chatTitle: "Chat con IA",
  chatNoConfig: "Configurá un proveedor LLM en Settings para usar el chat.",
  contextSection: "Contexto (transcripciones)",
  noTranscriptions: "No hay transcripciones. El chat funciona sin contexto.",
  templateSection: "Template de prompt",
  freePrompt: "Prompt libre",
  yourMessage: "Tu mensaje",
  send: "Enviar",
  sending: "Enviando...",
  close: "Cerrar",
  thinking: "Pensando...",
  writeMessage: "Escribí tu pregunta...",
  previewNoText: "(sin texto)",
};

const en: LocaleStrings = {
  openNoteFirst: "Open a note first",
  micAccessFailed: "Could not access microphone. Check permissions.",
  recorderUnsupported:
    "Could not start recording. The format is not supported by this browser.",
  recordingError: "Recording error.",
  recording: "Recording",
  paused: "Paused",
  pause: "Pause",
  resume: "Resume",
  stop: "Stop",
  transcribing: "Transcribing",
  transcriptionReady: "Transcription ready",
  transcriptionFailed: "Transcription failed",
  noSpeech: "(No speech detected)",
  noApiKey: "No API key set for",
  diarizationWarning:
    "This provider does not support speaker diarization. The transcription will be a single text block.",
  testConnection: "Test",
  testing: "Testing...",
  connected: "✓ Connected",
  failed: "✗ Failed",
  chooseAction: "What do you want to do?",
  recordAudio: "Record audio",
  chooseFile: "Choose file",
  speakerConfig: "Speaker configuration",
  speakerCount: "Number of speakers",
  startTranscription: "Start transcription",
  providerLabel: "Provider",
  languageLabel: "Default language",
  languageDetectionLabel: "Language detection",
  autoDetection: "Automatic",
  manualDetection: "Manual",
  outputTemplateLabel: "Output template",
  outputTemplateDesc:
    "Variables: {speaker}, {time}, {text}. Each speaker block is separated by a double line break.",
  insertAsCalloutLabel: "Insert as callout",
  insertAsCalloutDesc:
    "Wrap the transcription in a foldable >[!transcription] block",
  audioFolderLabel: "Recordings folder",
  audioFolderDesc:
    "Vault-relative path for saving audio. Empty = same folder as active note.",
  modelLabel: "Model",
  allApiKeys: "All API Keys",
  apiKeysDesc: "Keys are stored locally in the plugin data.",
  showKey: "Show",
  hideKey: "Hide",
  apiKeyPlaceholder: "Enter your API key",
  whisperLocalUrlLabel: "Server URL",
  whisperLocalUrlDesc: "whisper.cpp server URL (e.g. http://localhost:8080)",
  recordingQualityLabel: "Recording quality",
  recordingQualityDesc:
    "Sets the audio sample rate. 16 kHz is the minimum for speaker diarization.",
  sampleRate16kHz: "16 kHz (recommended, good diarization, ~1.9 MB/min)",
  sampleRate22kHz: "22.05 kHz (better quality, ~2.6 MB/min)",
  sampleRate44kHz: "44.1 kHz (max quality, ~5.3 MB/min)",
  saveAudioLabel: "Save audio after transcription",
  saveAudioDesc:
    "Uncheck for long recordings. Audio is discarded after transcription.",
  dashboardTitle: "Audio Transcript — Dashboard",
  noLLMConfig:
    "Enable an LLM provider in Settings to unlock summaries and AI chat.",
  noLLMConfigHint: "Settings → Audio Transcript → AI (LLM Provider)",
  credit: "Credit",
  transcriptions: "Transcriptions",
  templates: "Templates",
  aiProvider: "AI Provider",
  newChat: "New chat",
  refreshBtn: "Refresh",
  history: "Transcription history",
  historyEmpty: "No transcriptions yet. Record or transcribe audio to get started.",
  summarize: "Summarize",
  generatingSummary: "Generating summary...",
  summaryDone: "Summary ready",
  summaryInserted: "Summary ready and inserted into note",
  nothingToSummarize: "Nothing to summarize",
  configLLM: "Configure an LLM provider in Settings.",
  chatTitle: "AI Chat",
  chatNoConfig: "Configure an LLM provider in Settings to use the chat.",
  contextSection: "Context (transcriptions)",
  noTranscriptions: "No transcriptions found. Chat works without context.",
  templateSection: "Prompt template",
  freePrompt: "Free prompt",
  yourMessage: "Your message",
  send: "Send",
  sending: "Sending...",
  close: "Close",
  thinking: "Thinking...",
  writeMessage: "Type your question...",
  previewNoText: "(no text)",
};

export const LOCALES: Record<string, LocaleStrings> = { es, en };

export function t(
  key: keyof LocaleStrings,
  locale?: string
): string {
  return LOCALES[locale ?? "es"]?.[key] ?? LOCALES.es[key] ?? key;
}
