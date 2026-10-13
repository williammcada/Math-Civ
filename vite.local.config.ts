// Reconstructed 13 Oct 2026. Produces dist-local/game.js and dist-local/sekigahara-prototype.css for scripts/local-edition.mjs.
import {defineConfig} from 'vite';
export default defineConfig({base:'./',build:{outDir:'dist-local',target:'es2020',cssCodeSplit:false,assetsInlineLimit:100000000,lib:{entry:'src/app/bootstrap.ts',name:'Sekigahara',formats:['iife'],fileName:()=>'game.js'},rollupOptions:{output:{assetFileNames:'sekigahara-prototype.[ext]'}}}});
