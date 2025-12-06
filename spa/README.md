# Airtable Schema Generator SPA

A simple single page application that lets users generate TypeScript/JavaScript schema files from their Airtable bases without using the command line.

## Features

- Enter your Airtable personal access token
- Select from available bases
- Choose output format (TypeScript or JavaScript)
- View, copy, or download the generated schema code

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view it in the browser.

## Building for Production

```bash
npm run build
```

Builds the app to the `dist` folder. The build is deployed to GitHub Pages automatically when changes are pushed to main.

## Deployment

This SPA is deployed to GitHub Pages at https://nickcrews.github.io/airtable-kit/

The deployment is handled automatically by the GitHub Actions workflow in `.github/workflows/deploy-pages.yml`.
