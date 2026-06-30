export interface ChangelogEntry {
    version: string;
    date: string;
    changes: {
        type: "feature" | "fix" | "improvement";
        text: string;
    }[];
}

export const CHANGELOG: ChangelogEntry[] = [
    {
        version: "1.1.1",
        date: "2026-06-30",
        changes: [
            {
                type: "improvement",
                text: "Limpieza de imports no usados reportados por el bot de review.",
            },
        ],
    },
    {
        version: "1.1.0",
        date: "2026-06-30",
        changes: [
            {
                type: "feature",
                text: "AssemblyAI Universal-3.5 Pro — nuevo modelo con máxima precisión y diarización avanzada.",
            },
        ],
    },
    {
        version: "0.9.9",
        date: "2026-06-14",
        changes: [
            { type: "feature", text: "What's New modal — shows changelog on plugin update" },
        ],
    },
];
