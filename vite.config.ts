import { defineConfig, type Plugin } from 'vite';
import { generateContent } from './scripts/build-content';

const MD_RE = /[\\/]content[\\/].+\.md$/;

function contentPlugin(): Plugin {
  return {
    name: 'content-compiler',
    buildStart() {
      generateContent();
    },
    configureServer(server) {
      generateContent();
      const onMaybe = (f: string) => {
        if (MD_RE.test(f)) generateContent();
      };
      server.watcher.on('change', onMaybe);
      server.watcher.on('add', onMaybe);
      server.watcher.on('unlink', onMaybe);
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [contentPlugin()],
  build: {
    target: 'es2021',
  },
});
