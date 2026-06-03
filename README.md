# Audio Transcript

Record or transcribe audio files directly in Obsidian with speaker diarization and AI-powered summaries. Know who said what — and what it means.

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Quick start

1. Install from **Community Plugins** → search "Audio Transcript"
2. Enable it in Settings → Community Plugins
3. Open Settings → Audio Transcript, pick a provider, paste your API key
4. Open the dashboard (📊 ribbon icon) or click the 🎙️ ribbon to record

The plugin auto-detects your Obsidian language. No manual language setting needed.

## Dashboard & AI (v0.6.0)

Open the dashboard via the 📊 ribbon icon or `Ctrl+P` → "Abrir dashboard de transcripciones".

- **Transcription history** — all your past transcriptions indexed automatically
- **AI Chat** — chat with your transcriptions as context, powered by 8 LLM providers
- **One-click summaries** — summarize any transcription with AI, inserted directly into the note
- **Prompt templates** — create, edit, and reuse your own prompts
- **Flash / Advanced modes** — choose different models for fast vs deep analysis
- **Status bar** — live spob credits display

### LLM Providers

Configure your LLM in Settings → Audio Transcript → IA (Proveedores LLM):

| Provider | Requires API key |
|----------|-----------------|
| OpenAI (GPT-5.x) | Yes |
| Anthropic Claude | Yes |
| DeepSeek | Yes |
| Google Gemini | Yes |
| OpenRouter | Yes |
| Grok (xAI) | Yes |
| GLM (Z.ai) | Yes |
| Smart Plugins Obsidian (spob) | Yes — [get one here](https://spob-backend.fly.dev) |

## Transcription Providers

| Provider | Diarization | Free tier | Get API key |
|----------|-------------|-----------|-------------|
| Gladia | Yes | Free credits | [app.gladia.io](https://app.gladia.io) |
| Deepgram | Yes | $200 credits | [console.deepgram.com](https://console.deepgram.com) |
| AssemblyAI | Yes | Free hours | [assemblyai.com](https://assemblyai.com) |
| OpenAI Whisper | No | Pay-as-you-go | [platform.openai.com](https://platform.openai.com) |
| Groq (Whisper) | No | Free tier | [console.groq.com](https://console.groq.com) |
| Whisper (local) | No | Self-hosted | [whisper.cpp](https://github.com/ggerganov/whisper.cpp) |
| **Smart Plugins Obsidian (spob)** | **Yes** | **Pay as you go** | **[spob-backend.fly.dev](https://spob-backend.fly.dev)** |

> **spob** es el proveedor por defecto. [Obtené tu API key](https://spob-backend.fly.dev) y empezá a transcribir con AssemblyAI al instante — sin configurar nada más.

> Providers without diarization produce a single text block. Use Gladia, Deepgram, or AssemblyAI for speaker separation.

## Features

- **Record or upload** — record from your mic or pick audio files (MP3, WAV, WebM, etc.)
- **Speaker diarization** — automatically labels who spoke when (Gladia, Deepgram, AssemblyAI)
- **Batch transcription** — queue multiple files at once
- **Configurable output** — custom templates with `{speaker}`, `{time}`, `{text}` placeholders
- **Timestamps with audio links** — click a timestamp to jump to that moment in the saved audio
- **Callout wrapping** — output inside a foldable `> [!transcription]` block
- **Auto language detection** — matches your Obsidian UI language (Spanish or English)
- **Provider fallback** — if one API fails, the plugin tries the next configured provider automatically
- **Audio preservation** — recordings are saved before transcription, never lost on API failure
- **Dashboard & AI** — transcription history, AI chat, summaries, and prompt templates (see above)

## How it works

1. Audio is sent to your chosen provider's API
2. The provider transcribes and detects speakers
3. Speaker labels are replaced with the names you provide
4. The transcription is inserted into your active note

Example output:

```
**Jesús** `0:05`
Buen día, ¿cómo estás?

**María** `0:08`
Muy bien, gracias.
```

## Support

Audio Transcript is free and open source. If it saves you hours of manual transcription, consider buying me a coffee:

[![PayPal](https://img.shields.io/badge/PayPal-Donate-blue?logo=paypal)](https://paypal.me/jesusgarciapsi)

## Credits

Created by **Jesús García** & **DeepSeek V4-Pro** · [GitHub](https://github.com/jaliriogbarrios19/Audio_Transcript)
