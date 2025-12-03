import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Tauri expects a fixed output directory
    outDir: 'dist',
    // Tauri uses this to ensure asset paths are correct
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      //    this is required for tauri to work
      ignored: ["**/src-tauri/**"],
    },
  },
})
