# AGENTS.md — Audio Transcript Plugin

## Reglas de desarrollo

### Límite de 300 líneas por archivo

- Todos los archivos fuente (`.ts`, `.css`) deben tener un máximo de **300 líneas**.
- Si un archivo excede este límite, **el agente debe informar al usuario** mostrando el nombre del archivo y su línea actual.
- **El agente NO debe dividir archivos de manera autónoma.** Cualquier refactorización o split debe ser consultada y aprobada por el usuario.
- La medición es sobre el archivo físico real (no sobre el diff ni el contenido lógico).
- Archivos de configuración, tipos, o utilidades muy pequeñas están exentos de esta regla (mínimo práctico).

### Prácticas del proyecto

- TypeScript estricto, con tipos explícitos en `JSON.parse()` y `requestUrl().json`.
- UI construida con `createEl()`, `createDiv()`, `createSpan()` — nunca `innerHTML`.
- Headings usan `new Setting(containerEl).setName("...").setHeading()`.
- Peticiones HTTP usan `requestUrl()` de Obsidian, nunca `fetch()`.
- Operaciones async en callbacks síncronos: wrappear en `void (async () => { ... })()`.
- `setTimeout()` con prefijo `window.`.
- Operaciones de vault siempre en try-catch por race conditions del índice asíncrono.
