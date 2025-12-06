import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'

export default defineConfig({
  plugins: [solid()],
  // Base path for GitHub Pages deployment
  base: '/airtable-kit/',
})
