interface ImportMetaEnv { readonly PROD: boolean; readonly DEV: boolean }
interface ImportMeta { readonly env: ImportMetaEnv }
declare module '*.css';
declare const __DEV_BUILD__:boolean;
