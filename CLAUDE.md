# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**ai-lab** is a Python project currently in its initial scaffold phase. No source code, dependencies, or infrastructure has been set up yet. This document will be updated as the project evolves.

- **Language**: Python (inferred from `.gitignore`)
- **Branch model**: Feature branches off `main`; current active development branch is `claude/add-claude-documentation-ozQny`
- **Remote**: `bcesarcampos/ai-lab` on GitHub

## Current State

The repository contains only:
- `README.md` — minimal title placeholder
- `.gitignore` — comprehensive Python project gitignore
- `CLAUDE.md` — this file

No source code, tests, configuration files, or CI/CD pipelines exist yet.

## Inferred Tech Stack (from `.gitignore`)

The `.gitignore` references tooling that suggests this project may use:

| Category | Tools |
|---|---|
| Package managers | `uv`, `poetry`, `pdm`, `pipenv`, `pixi` |
| Linting / formatting | `ruff` |
| Type checking | `mypy`, `pyre`, `pytype` |
| Testing | `pytest`, `tox`, `nox`, `hypothesis` |
| Notebooks | Jupyter, Marimo |
| Automation | Abstra |
| Web frameworks | Django, Flask (patterns present) |
| Docs | Sphinx, mkdocs |

When source code is added, check which tools are actually installed and configured before running commands.

## Development Workflows

### Setting Up

Since no dependency manager is configured yet, check for any of the following files when starting work:

```bash
# uv
uv sync

# poetry
poetry install

# pip
pip install -r requirements.txt
# or
pip install -e .
```

Always activate or use a virtual environment — never install to the system Python.

### Running Tests

Once a test framework is configured, the standard pytest invocation applies:

```bash
pytest
# or with coverage
pytest --cov
```

### Linting and Formatting

If `ruff` is configured:

```bash
ruff check .
ruff format .
```

If `mypy` is configured:

```bash
mypy .
```

## Conventions for AI Assistants

### General

- Read existing files before modifying them.
- Do not add features, refactoring, or comments beyond what is explicitly requested.
- Prefer editing existing files over creating new ones.
- Do not create documentation files (e.g., `README.md`, extra `.md` files) unless explicitly asked.
- Never commit secrets, `.env` files, or credentials.

### Python Conventions

- Follow PEP 8 style (enforced by `ruff` once configured).
- Use type annotations on new functions and classes when the project adopts `mypy`.
- Prefer `pathlib.Path` over `os.path` for file operations.
- Use f-strings for string formatting.
- Keep imports grouped: stdlib → third-party → local, separated by blank lines.

### Git Workflow

- Develop on the designated feature branch — **never push directly to `main`**.
- Write clear, descriptive commit messages (imperative mood, e.g. "Add user authentication module").
- Stage specific files rather than `git add -A` to avoid accidentally committing sensitive files.
- Do not force-push or use `--no-verify` unless explicitly instructed.

### Environment Files

The `.gitignore` excludes `.env` and `.envrc`. If environment variables are needed:
- Document required variables in a `.env.example` file (committed, no real values).
- Never commit `.env` or any file containing real secrets.

## Updating This File

When new tools, frameworks, or conventions are introduced to the project, update this file to reflect them. Specifically update:
- **Current State** section when source code is added
- **Inferred Tech Stack** → **Confirmed Tech Stack** once dependencies are locked
- **Development Workflows** with actual tested commands
- Any project-specific conventions that differ from the defaults above
