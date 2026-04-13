# CLAUDE.md

This file provides guidance for AI assistants (Claude Code and similar tools) working in this repository.

## Repository Overview

**ai-lab** is a personal lab for AI-assisted experiments and tools. It currently contains Scriptable iOS widgets (JavaScript).

- **Languages**: JavaScript (Scriptable widgets)
- **Branch model**: Feature branches off `main`; never push directly to `main`
- **Remote**: `bcesarcampos/ai-lab` on GitHub

## Current State

The repository contains:
- `README.md` — project overview and widget index
- `.gitignore` — project gitignore
- `CLAUDE.md` — this file
- `Scriptable/` — iOS widgets built with [Scriptable](https://scriptable.app)
  - `motivation-widget.js` — configurable motivation widget with text, icon, and colors
  - `usd-brl-widget.js` — simple USD → BRL exchange rate
  - `usd-brl-with-graph-widget.js` — USD → BRL rate with historical graph
  - `usd-brl-converter-widget.js` — USD ↔ BRL converter
  - `google-calendar-widget.js` — Google Calendar upcoming events
  - `yahoo-finance-news-widget.js` — Yahoo Finance news feed

## Tech Stack

| Category | Tools |
|---|---|
| Scriptable widgets | JavaScript (ES2020+, Scriptable API) |

## Conventions for AI Assistants

### General

- Read existing files before modifying them.
- Do not add features, refactoring, or comments beyond what is explicitly requested.
- Prefer editing existing files over creating new ones.
- Do not create documentation files (e.g., `README.md`, extra `.md` files) unless explicitly asked.
- Never commit secrets, `.env` files, or credentials.

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
- **Current State** section when new files or directories are added
- **Tech Stack** when new languages or tools are adopted
- **Development Workflows** with actual tested commands
- Any project-specific conventions that differ from the defaults above
