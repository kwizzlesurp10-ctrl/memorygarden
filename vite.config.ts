import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";

import { resolve } from 'path'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || (id.includes('/react/') && !id.includes('react-'))) {
              return 'vendor-react'
            }
            if (id.includes('framer-motion')) {
              return 'vendor-motion'
            }
            if (id.includes('@radix-ui')) {
              return 'vendor-radix'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-charts'
            }
            if (id.includes('date-fns') || id.includes('uuid') || id.includes('zod') || id.includes('marked') || id.includes('sonner')) {
              return 'vendor-utils'
            }
            if (id.includes('@phosphor-icons') || id.includes('lucide-react')) {
              return 'vendor-icons'
            }
            if (id.includes('three')) {
              return 'vendor-three'
            }
          }
        },
      },
    },
  },
});
