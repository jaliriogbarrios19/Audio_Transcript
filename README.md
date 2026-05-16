# Transcripción Obsidian

Grabá o transcribí audios directamente desde Obsidian con identificación de hablantes. Usa Gladia, Deepgram o AssemblyAI como motor de transcripción.

## Instalación

### Opción A — BRAT (recomendada)

1. Instalá [BRAT](https://github.com/TfTHacker/obsidian42-brat) desde Community Plugins
2. En BRAT, agregá este repositorio: `jaliriogbarrios19/Transcripcion-Obsidian`
3. Activá el plugin en Settings → Community Plugins

### Opción B — Manual

1. Descargá la [última release](https://github.com/jaliriogbarrios19/Transcripcion-Obsidian/releases)
2. Extraé en `.obsidian/plugins/transcripcion-obsidian/`
3. Activá el plugin en Settings → Community Plugins

## Configuración

1. Andá a Settings → Transcripción Obsidian
2. Elegí un proveedor (Gladia, Deepgram o AssemblyAI)
3. Pegá tu API key
4. El idioma por defecto es español — podés cambiarlo si querés

### ¿Dónde consigo una API key?

| Proveedor | Registro | Precios |
|-----------|----------|---------|
| [Gladia](https://app.gladia.io) | Créditos gratis al registrarte | [Ver precios](https://www.gladia.io/pricing) |
| [Deepgram](https://console.deepgram.com) | $200 en créditos gratis | [Ver precios](https://deepgram.com/pricing) |
| [AssemblyAI](https://assemblyai.com) | Horas gratis al registrarte | [Ver precios](https://www.assemblyai.com/pricing) |

## Cómo se usa

1. Abrí una nota en Obsidian
2. Hacé click en el ícono 🎙️ de la barra lateral
3. Elegí **Grabar audio** o **Elegir archivo**
4. Si grabás: hablá y después click en **Detener**
5. Poné cuántas personas hablan y sus nombres
6. Click en **Transcribir**
7. La transcripción aparece en tu nota con timestamps

También podés usar `Ctrl+P` y buscar **Grabar y transcribir** o **Transcribir archivo**.

## ¿Cómo funciona?

1. El audio se graba o se selecciona desde tu computadora
2. Se envía al proveedor que elegiste (Gladia, Deepgram o AssemblyAI)
3. El proveedor transcribe el audio y detecta quién habló cada parte
4. El plugin reemplaza "Speaker 1", "Speaker 2" con los nombres que pusiste
5. La transcripción se inserta en tu nota con el formato:

```
**Jesús** `0:05`
Buen día, ¿cómo estás?

**María** `0:08`
Muy bien, gracias.
```

Si grabaste, el audio se guarda automáticamente en la misma carpeta de tu nota.

## Créditos

Plugin creado por **Jesús García** & **DeepSeek V4-Pro**.
