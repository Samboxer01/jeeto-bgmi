import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          firebase: ['firebase/app', 'firebase/firestore'],
          framer: ['framer-motion'],
          zustand: ['zustand']
        }
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react']
  }
})
