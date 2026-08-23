# Publishing Chee Skool to GitHub Pages

Use GitHub Desktop for normal project updates. The repository contains both learner-facing files and internal authoring tools, so the live website must deploy the generated learner-only artifact rather than the repository root.

## One-time GitHub Pages setting

1. Push the project to the repository's `main` branch.
2. On GitHub, open **Settings -> Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. Do not use **Deploy from a branch** for the current project.

## What happens after each push

`.github/workflows/pages.yml` automatically:

1. runs the full automated test suite;
2. validates the RLA content bank;
3. runs `npm run public:build`;
4. uploads only the generated `dist/` folder;
5. deploys that artifact to GitHub Pages.

The public artifact includes the learner site, generated practice data, PDFs, icons, and required runtime files. It excludes `builder.html`, `content-studio.html`, `resource-studio.html`, `content-src/`, `authoring/`, development scripts, project documentation, and other internal files.

## Before sharing a new release

Open the GitHub Actions run and confirm the build/deploy jobs passed. Then manually test the production Pages URL on desktop and phone before changing `release-gate.json` to enable a public alpha.

Do not commit `node_modules/` if it is created locally.
