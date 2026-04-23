# Repository Guidelines

## Project Structure & Module Organization

This repository currently has a sparse working tree with `docs/` as the only visible project directory. Treat it as a documentation or planning repository unless application source files are restored. Place design documents, game design notes, architecture proposals, and implementation plans under `docs/`. If code is added later, create conventional top-level folders such as `src/`, `tests/`, and `assets/` and update this guide with exact commands.

## Build, Test, and Development Commands

No package manifest or build system is present in the current working tree. Do not invent commands for this repo. For documentation-only changes, validate Markdown manually and review links.

Examples for future code additions:

```powershell
npm test
npm run build
```

Only add commands here after the matching manifest or tool configuration exists.

## Coding Style & Naming Conventions

For documentation, use clear Markdown headings, concise sections, and stable filenames such as `docs/simulation-engine.md` or `docs/production-readiness.md`. Prefer lowercase, hyphenated filenames for new docs. Keep diagrams and long specifications close to the feature they describe.

## Testing Guidelines

There are no automated tests configured. For docs, check internal links and make sure requirements are specific enough to implement. When code returns to the repo, add tests alongside the code and document the smallest reliable validation command.

## Commit & Pull Request Guidelines

Recent history includes conventional subjects such as `refactor:` and `build:` plus merge commits. Use concise, scoped subjects like `docs: expand draft strategy model`. PRs should summarize changed docs or systems, list validation performed, and call out open design questions.

## Security & Configuration Tips

Do not commit private league data, API keys, credentials, or generated local artifacts. Keep planning docs free of secrets and deployment-only configuration values.
