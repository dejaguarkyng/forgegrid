# Contributing

Thanks for your interest in improving ForgeGrid.

## Before You Start

- Open an issue for substantial changes so we can align on scope.
- Keep pull requests focused and reviewable.
- Follow this repository's Code of Conduct.

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Create your local environment file:

```bash
cp .env.example .env.local
```

3. Fill required values in .env.local.

4. Start the app:

```bash
npm run dev
```

## Branching and Commits

- Create a feature branch from main.
- Use clear commit messages in imperative form.
- Group related code and docs changes together.

## Pull Request Checklist

- Explain the problem and solution clearly.
- Link related issue(s).
- Include screenshots or recordings for UI changes.
- Ensure local checks pass:

```bash
npm run lint
npm run build
```

- Update docs when behavior, API, or configuration changes.

## Review Expectations

- Maintainers may request scope reduction or follow-up changes.
- PRs that include unrelated refactors may be asked to split.

## Questions

Open a GitHub issue with the question label or discussion context.
