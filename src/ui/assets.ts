/** Embedded assets are used only by the downloadable single-file local edition. */
export function assetURL(path:string):string{return (globalThis as typeof globalThis&{SEKIGAHARA_ASSETS?:Record<string,string>}).SEKIGAHARA_ASSETS?.[path]??path;}
