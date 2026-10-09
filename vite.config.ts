import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    server: {
      hmr: false,
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    optimizeDeps: {
      exclude: ['@vite/client'],
    },
    build: {
      target: 'esnext',
      sourcemap: false,
      minify: 'esbuild' as const,
      rollupOptions: {
        external: [
          '@vite/client',
          'tsx',
          'esbuild',
          'typescript',
        ],
      },
    },
  };
});
