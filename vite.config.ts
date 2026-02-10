
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              'vendor-react': ['react', 'react-dom'],
              'vendor-ui': ['lucide-react'], 
              'vendor-data': ['@tanstack/react-query', 'zustand', 'idb-keyval'],
              'vendor-forms': ['react-hook-form', 'zod', '@hookform/resolvers']
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest', // Chế độ thủ công với file sw.ts
          srcDir: '.', 
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          // manifestFilename: 'manifest.webmanifest', // Default
          manifest: {
            name: 'QUẢN LÝ VẬT TƯ 1.0.0',
            short_name: 'QLVT',
            description: 'Hệ thống quản lý kho vật tư chuyên nghiệp trên nền tảng Web PC.',
            theme_color: '#0f0f0f',
            background_color: '#0f0f0f',
            display: 'standalone',
            orientation: 'portrait',
            start_url: '/',
            id: '/',
            icons: [
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      },
      // @ts-ignore
      test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: [],
      }
    };
});
