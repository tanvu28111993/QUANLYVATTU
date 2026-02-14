
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
        target: 'esnext',
        minify: 'esbuild',
        rollupOptions: {
          output: {
            manualChunks: {
              'react-vendor': ['react', 'react-dom'],
              'query-vendor': ['@tanstack/react-query', '@tanstack/react-query-persist-client'],
              'storage-vendor': ['zustand', 'idb-keyval'],
              'ui-vendor': ['lucide-react']
            }
          }
        }
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.', 
          filename: 'sw.ts',
          registerType: 'autoUpdate',
          manifestFilename: 'manifest.json',
          manifest: {
            name: 'HỆ THỐNG QUẢN LÝ KHO TUẤN BẰNG',
            short_name: 'QLVT-TB',
            description: 'Quản lý kho vật tư & giấy chuyên nghiệp cho PC Desktop',
            theme_color: '#0f0f0f',
            background_color: '#0f0f0f',
            display: 'standalone',
            orientation: 'any',
            start_url: '/',
            id: '/',
            scope: '/',
            icons: [
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'maskable'
              },
              {
                src: 'https://i.postimg.cc/8zF3c24h/image.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
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
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});
