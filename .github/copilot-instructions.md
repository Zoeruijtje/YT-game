# Repository guidance

Before making changes, read `AGENTS.md` and all files in `docs/`.

Use `docs/BUILD_PROMPT.md` as the implementation brief. Keep changes inside this repository, use strict TypeScript, preserve provider separation, add tests, update documentation, and never commit secrets or local runtime data.

The temporary browser provider must remain isolated and must not bypass access controls or technical challenges. The official YouTube Data API is the intended later provider.
