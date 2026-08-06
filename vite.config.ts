import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import fs from 'fs';

// Automatically copy correct WASM files from node_modules to public/, public/assets/ and public/sqlite-wasm/ on dev/build
try {
  const publicDir = path.resolve('public');
  const assetsDir = path.resolve('public/assets');
  const sqliteWasmDir = path.resolve('public/sqlite-wasm');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true });
  }
  if (!fs.existsSync(sqliteWasmDir)) {
    fs.mkdirSync(sqliteWasmDir, { recursive: true });
  }

  const filesToCopy = [
    { file: 'sql-wasm.wasm', srcName: 'sql-wasm.wasm' },
    { file: 'sql-wasm-browser.wasm', srcName: 'sql-wasm.wasm' },
    { file: 'sql-wasm-debug.wasm', srcName: 'sql-wasm-debug.wasm' },
    { file: 'sql-wasm-browser-debug.wasm', srcName: 'sql-wasm-debug.wasm' },
  ];

  filesToCopy.forEach(({ file, srcName }) => {
    // Try multiple possible paths in node_modules
    const possibleSources = [
      path.resolve('node_modules/sql.js/dist', srcName),
      path.resolve('node_modules/jeep-sqlite/dist/jeep-sqlite', srcName),
      path.resolve('node_modules/jeep-sqlite/dist', srcName),
    ];

    let found = false;
    for (const source of possibleSources) {
      if (fs.existsSync(source)) {
        const srcSize = fs.statSync(source).size;

        // Copy to root public/
        const dest1 = path.resolve(publicDir, file);
        const destSize1 = fs.existsSync(dest1) ? fs.statSync(dest1).size : 0;
        if (srcSize !== destSize1) {
          fs.copyFileSync(source, dest1);
          console.log(`[WASM Safe-Restore] Restored ${file} to public/ (${srcSize} bytes)`);
        } else {
          console.log(`[WASM Safe-Restore] public/${file} is up-to-date (${srcSize} bytes)`);
        }

        // Copy to public/assets/
        const dest2 = path.resolve(assetsDir, file);
        const destSize2 = fs.existsSync(dest2) ? fs.statSync(dest2).size : 0;
        if (srcSize !== destSize2) {
          fs.copyFileSync(source, dest2);
          console.log(`[WASM Safe-Restore] Restored ${file} to public/assets/ (${srcSize} bytes)`);
        } else {
          console.log(`[WASM Safe-Restore] public/assets/${file} is up-to-date (${srcSize} bytes)`);
        }

        // Copy to public/sqlite-wasm/
        const dest3 = path.resolve(sqliteWasmDir, file);
        const destSize3 = fs.existsSync(dest3) ? fs.statSync(dest3).size : 0;
        if (srcSize !== destSize3) {
          fs.copyFileSync(source, dest3);
          console.log(`[WASM Safe-Restore] Restored ${file} to public/sqlite-wasm/ (${srcSize} bytes)`);
        } else {
          console.log(`[WASM Safe-Restore] public/sqlite-wasm/${file} is up-to-date (${srcSize} bytes)`);
        }

        found = true;
        break;
      }
    }
    
    if (!found) {
      console.warn(`[WASM Safe-Restore] Warning: could not find source for ${file}`);
    }
  });
} catch (err) {
  console.error('[WASM Safe-Restore] Error during file synchronization:', err);
}

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(), 
      tailwindcss(),
    ],
    optimizeDeps: {
      exclude: ['@capacitor-community/sqlite', 'jeep-sqlite', 'sql.js'],
    },
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
