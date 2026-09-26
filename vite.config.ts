import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Root-relative: Vercel (and the manifest's absolute start_url/scope) serve this from '/'.
  base: '/',
})
