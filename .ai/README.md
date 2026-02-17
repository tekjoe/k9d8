# AI Context Directory

This directory contains structured context for AI agents working on the k9d8 project. The goal is to provide persistent knowledge that survives across sessions and can be consumed by any AI tool (Claude, OpenClaw, Cursor, etc.).

## Directory Structure

```
.ai/
├── README.md              # This file - explains the structure
├── plans/                 # Strategic plans and roadmaps
│   └── seo-plan.md       # SEO & ASO strategy
├── specs/                 # Feature specifications (PRDs, technical specs)
├── decisions/             # Architecture Decision Records (ADRs)
└── context/               # Background knowledge and research
```

## Conventions

### Plans (`/plans`)
High-level strategic documents with phases, timelines, and success metrics.
- **Naming:** `{topic}-plan.md` (e.g., `seo-plan.md`, `launch-plan.md`, `growth-plan.md`)
- **Content:** Goals, phases, action items, KPIs, timelines

### Specs (`/specs`)
Detailed feature specifications ready for implementation.
- **Naming:** `{feature-name}.md` (e.g., `friends-feature.md`, `push-notifications.md`)
- **Content:** Context, requirements, technical approach, acceptance criteria

### Decisions (`/decisions`)
Architecture Decision Records documenting significant technical choices.
- **Naming:** `{number}-{short-title}.md` (e.g., `001-use-supabase.md`, `002-expo-router.md`)
- **Content:** Context, decision, consequences, alternatives considered

### Context (`/context`)
Background research, competitive analysis, and domain knowledge.
- **Naming:** Descriptive names (e.g., `competitor-analysis.md`, `user-research.md`)
- **Content:** Research findings, market data, user insights

## For AI Agents

When starting work on this project:

1. **Read `CLAUDE.md`** (project root) for codebase conventions and commands
2. **Check `.ai/plans/`** for strategic context on current initiatives
3. **Check `.ai/specs/`** for detailed requirements on features being built
4. **Check `.ai/decisions/`** for rationale behind architectural choices

When creating new documents:
- Follow the naming conventions above
- Include a clear title and context section
- Add creation date and version if the document will evolve
- Link to related documents when relevant

## Integration with Other Tools

This structure is designed to work with:
- **Claude Code** - reads from `.ai/` for project context
- **OpenClaw** - can reference plans during task execution
- **Cursor** - `.ai/` files appear in @ mentions
- **GitHub Copilot** - includes `.ai/` in workspace context

The `.ai/` directory should be committed to version control so all team members and AI tools have access to the same context.
