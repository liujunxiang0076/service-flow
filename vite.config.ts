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
    // 配置manualChunks优化chunking
    rollupOptions: {
      output: {
        manualChunks: {
          // 将react相关库打包到一个chunk
          'react-vendor': ['react', 'react-dom', 'react-router-dom', '@hookform/resolvers', 'react-hook-form'],
          // 将UI组件库打包到一个chunk
          'ui-vendor': ['lucide-react', '@radix-ui/react-accordion', '@radix-ui/react-alert-dialog', '@radix-ui/react-aspect-ratio', '@radix-ui/react-avatar', '@radix-ui/react-checkbox', '@radix-ui/react-collapsible', '@radix-ui/react-context-menu', '@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-hover-card', '@radix-ui/react-label', '@radix-ui/react-menubar', '@radix-ui/react-navigation-menu', '@radix-ui/react-popover', '@radix-ui/react-progress', '@radix-ui/react-radio-group', '@radix-ui/react-scroll-area', '@radix-ui/react-select', '@radix-ui/react-separator', '@radix-ui/react-slider', '@radix-ui/react-slot', '@radix-ui/react-switch', '@radix-ui/react-tabs', '@radix-ui/react-toast', '@radix-ui/react-toggle', '@radix-ui/react-toggle-group', '@radix-ui/react-tooltip'],
          // 将图表库打包到一个chunk
          'chart-vendor': ['recharts'],
        },
      },
    },
  },
  server: {
    port: 1430,
    strictPort: false,
    watch: {
      // 3. tell vite to ignore watching `src-tauri`
      //    this is required for tauri to work
      ignored: ["**/src-tauri/**"],
    },
  },
})
