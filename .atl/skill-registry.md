# Skill Registry — Audio Transcript

Generated: 2026-05-21 | Mode: engram | Project: audio_transcript

## User Skills

| Skill | Trigger | Path |
|-------|---------|------|
| work-unit-commits | implementation, commit splitting, chained PRs | `~/.config/opencode/skills/work-unit-commits/SKILL.md` |
| comment-writer | PR feedback, issue replies, reviews | `~/.config/opencode/skills/comment-writer/SKILL.md` |
| branch-pr | creating, opening, or preparing PRs | `~/.config/opencode/skills/branch-pr/SKILL.md` |
| chained-pr | PRs over 400 lines, stacked PRs | `~/.config/opencode/skills/chained-pr/SKILL.md` |
| cognitive-doc-design | writing guides, READMEs, RFCs, docs | `~/.config/opencode/skills/cognitive-doc-design/SKILL.md` |
| judgment-day | dual review, adversarial review | `~/.config/opencode/skills/judgment-day/SKILL.md` |
| issue-creation | creating GitHub issues | `~/.config/opencode/skills/issue-creation/SKILL.md` |
| skill-creator | new skills, agent instructions | `~/.config/opencode/skills/skill-creator/SKILL.md` |
| skill-registry | update skills, actualizar skills | `~/.config/opencode/skills/skill-registry/SKILL.md` |

## Compact Rules

### work-unit-commits
- Commit by work unit: one deliverable behavior, fix, migration, or docs per commit.
- Keep tests with code in the same commit as the behavior they verify.
- Keep docs with the user-visible change they explain.
- Do NOT commit by file type (e.g., "add models" then "add services" then "add tests").
- If SDD tasks forecast >400-line change, group commits into chained PR slices.
- Use conventional commits format: `feat(scope): description`, `fix(scope): description`.

### comment-writer
- Start with the actionable point; do not recap the whole PR.
- Be warm and direct: "Buenísimo el enfoque. Acá separaría este cambio..."
- Keep to 1-3 short paragraphs or a tight bullet list.
- Always explain WHY when asking for a change (technical reason).
- In Spanish: use Rioplatense (voseo): `podés`, `tenés`, `fijate`, `dale`.
- Comment on the highest-value issue only; avoid pile-ons.

### branch-pr
- Every PR MUST link an approved issue: `Closes #N`.
- Every PR MUST have exactly one `type:*` label.
- Branch naming: `^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)/[a-z0-9._-]+$`.
- PR body MUST contain linked issue + what changed + testing section.
- Automated checks must pass before merge.

### chained-pr
- Split PRs over 400 changed lines into chained/sliced PRs.
- Each slice tells an independent story with clear start/finish state.
- Review workload: low risk (<200L) → single PR; medium (200-400L) → monitor; high (>400L) → slice.
- Order slices: foundation → integration → polish/docs.

### cognitive-doc-design
- Reduce cognitive load: start with "why" before "how".
- Use progressive disclosure: overview → details → reference.
- Prefer diagrams over walls of text.
- Use concrete examples before abstract explanations.
- One concept per section; avoid mixing concerns.

### judgment-day
- Run blind dual review with two judges and a fix agent.
- Judges evaluate independently before comparing verdicts.
- Fix confirmed issues, then re-judge.
- Report: severity, file, line, description, fix applied.

## Project Conventions

- **Language**: TypeScript 5.4, ES2020, ESNext modules, esbuild bundler
- **Platform**: Obsidian plugin (browser), CommonJS output
- **Type checking**: `npx tsc -noEmit -skipLibCheck`
- **Testing**: No test runner configured; verify via type check + manual testing
- **Commit style**: Conventional commits (`fix:`, `feat:`, etc.)
- **No test runner**: Strict TDD disabled
- **i18n**: All user-facing strings go through `t()` in `locales.ts`
- **300-line convention**: New files under 300 lines (existing files exempt)
