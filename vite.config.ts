import { defineConfig } from 'vite'
import { resolve, join } from 'path'
import { readFileSync } from "fs";
import { readdirSync, statSync } from "node:fs";

export default defineConfig({
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                content: resolve(__dirname, 'src/content/content.ts'),
                background: resolve(__dirname, 'src/background/background.ts'),
                popup: resolve(__dirname, 'src/popup/popup.html'),
            },
            output: {
                entryFileNames: '[name].js',
                chunkFileNames: '[name].js',
                assetFileNames: '[name].[ext]'
            }
        }
    },
    plugins: [{
        name: 'copy-assets',
        generateBundle(): void {
            const manifest = readFileSync('manifest.json', 'utf-8');
            this.emitFile({
                type: 'asset',
                fileName: 'manifest.json',
                source: manifest
            });

            const popupHtml = readFileSync('src/popup/popup.html', 'utf-8');
            this.emitFile({
                type: 'asset',
                fileName: 'popup.html',
                source: popupHtml
            });

            const popupCss = readFileSync('src/popup/popup.css', 'utf-8');
            this.emitFile({
                type: 'asset',
                fileName: 'popup.css',
                source: popupCss
            });

            try {
                const srcDir: string = "icons";
                const files = readdirSync(srcDir);
                files.forEach(f => {
                    const fullPath = join(srcDir, f);
                    if (statSync(fullPath).isFile()) {
                        this.emitFile({
                            type: 'asset',
                            fileName: `icons/${f}`,
                            source: readFileSync(fullPath)
                        });
                    }
                });
            } catch {}
        }
    }],
    define: {
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV)
    }
});
