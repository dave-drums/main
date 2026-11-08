import { defineConfig } from 'vite';

// The public page owns the hero and controls around this isolated app.
export default defineConfig({
  base: '/metronome/app/',
  test: { environment: 'jsdom', include: ['tests/unit/**/*.test.js'], setupFiles: ['tests/setup.js'] },
  publicDir: false,
  define: { 'process.env.NODE_ENV': JSON.stringify('production') },
  build: {
    target: 'es2020',
    outDir: 'dist/embed',
    emptyOutDir: true,
    lib: { entry: 'src/embed.js', formats: ['es'], fileName: () => 'metronome.js', cssFileName: 'metronome' },
    rollupOptions: { output: { banner: '/*! Dave Drums metronome. MIT. Source: https://github.com/dave-drums/main/tree/main/apps/metronome; see ../LICENSE */' } }
  }
});
