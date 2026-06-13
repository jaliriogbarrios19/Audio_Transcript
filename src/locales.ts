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
  transcribe: string;
  dateHeader: string;
  noteHeader: string;
  speakersHeader: string;
  previewHeader: string;
  deepseekDirect: string;
  summaryHeading: string;
  summarySystemPrompt: string;
  summaryError: string;
  unknownError: string;
  spobBanner: string;
  searchTranscriptions: string;
  newTemplate: string;
  backToChat: string;
  editTemplate: string;
  searchNotePlaceholder: string;
  noChatsYet: string;
  chatHistory: string;
  chatHistoryEmpty: string;
  clearHistory: string;
  historyCleared: string;
  modeNotConfigured: string;
  notConfigured: string;
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
  transcribe: "Transcribir",
  dateHeader: "Fecha",
  noteHeader: "Nota",
  speakersHeader: "Hab.",
  previewHeader: "Vista previa",
  deepseekDirect: "DeepSeek directo",
  summaryHeading: "Resumen",
  summarySystemPrompt: "Resumí esta transcripción en bullet points concisos.",
  summaryError: "Error al resumir",
  unknownError: "desconocido",
  spobBanner: "Hola, soy Jesús García, un psicólogo que se ha interesado en el desarrollo web para optimizar sus flujos de trabajo. Si deseas apoyar nuestro trabajo, puedes hacer una donación o utilizar nuestros servicios a un costo razonable.",
  searchTranscriptions: "Buscar transcripciones",
  newTemplate: "+ Nuevo template",
  backToChat: "← Volver al chat",
  editTemplate: "Editar template",
  searchNotePlaceholder: "Buscar nota por nombre...",
  noChatsYet: "No hay chats anteriores",
  chatHistory: "Historial de chats",
  chatHistoryEmpty: "Historial vacío",
  clearHistory: "Limpiar historial",
  historyCleared: "Historial limpiado",
  modeNotConfigured: "no configurado. Revisa Settings → IA.",
  notConfigured: "Sin configurar",
};

import en from "./locale-en";

export const LOCALES: Record<string, LocaleStrings> = { es, en };

export function t(
  key: keyof LocaleStrings,
  locale?: string
): string {
  return LOCALES[locale ?? "es"]?.[key] ?? LOCALES.es[key] ?? key;
}
