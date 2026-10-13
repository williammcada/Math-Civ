import {campaign,balance,battle,math,crises,endings,template,text} from './registry';
import campaignSchema from './schemas/campaign.schema.json';
import balanceSchema from './schemas/balance.schema.json';
import battleSchema from './schemas/battle.schema.json';
import mathSchema from './schemas/math-templates.schema.json';
import crisisSchema from './schemas/crises.schema.json';
import endingSchema from './schemas/endings.schema.json';
import saveSchema from './schemas/save.schema.json';
import {answerPolicy,solve} from '../core/mathEngine';
import manifest from '../assets/manifest.json';
type Schema={type?:string|string[];const?:unknown;enum?:unknown[];required?:string[];properties?:Record<string,Schema>;additionalProperties?:boolean;items?:Schema;minItems?:number;maxItems?:number;minLength?:number;maxLength?:number;pattern?:string;minimum?:number;maximum?:number;minProperties?:number;$ref?:string;$defs?:Record<string,Schema>};
// Small, non-executable interpreter for the supplied closed schema vocabulary.
// Ajv also validates the files during the build. Boot needs no eval/new Function.
export function validateSchema(value:unknown,schema:Schema,root:Schema=schema,path='root'):void {
 if(schema.$ref){const target=schema.$ref.split('/').slice(1).reduce<unknown>((v,k)=>(v as Record<string,unknown>)[k],root);return validateSchema(value,target as Schema,root,path);}
 if('const' in schema&&value!==schema.const)throw Error(path+': invalid constant');if(schema.enum&&!schema.enum.includes(value))throw Error(path+': invalid value');
 const actual=value===null?'null':Array.isArray(value)?'array':typeof value;const types=schema.type?Array.isArray(schema.type)?schema.type:[schema.type]:[];
 if(types.length&&!types.some(t=>t===actual||t==='integer'&&typeof value==='number'&&Number.isInteger(value)))throw Error(path+': invalid type');
 if(typeof value==='number'&&(!Number.isFinite(value)||value<(schema.minimum??-Infinity)||value>(schema.maximum??Infinity)))throw Error(path+': outside range');
 if(typeof value==='string'&&(Array.from(value).length<(schema.minLength??0)||Array.from(value).length>(schema.maxLength??Infinity)||schema.pattern&&!new RegExp(schema.pattern).test(value)))throw Error(path+': invalid string');
 if(Array.isArray(value)){if(value.length<(schema.minItems??0)||value.length>(schema.maxItems??Infinity))throw Error(path+': invalid array length');if(schema.items)value.forEach((v,i)=>validateSchema(v,schema.items!,root,path+'.'+i));}
 else if(value&&typeof value==='object'){const obj=value as Record<string,unknown>;if(Object.keys(obj).length<(schema.minProperties??0))throw Error(path+': empty object');for(const k of schema.required??[])if(!(k in obj))throw Error(path+': missing '+k);for(const [k,v] of Object.entries(obj)){if(['__proto__','prototype','constructor'].includes(k))throw Error('Unsafe key');if(schema.properties?.[k])validateSchema(v,schema.properties[k],root,path+'.'+k);else if(schema.additionalProperties===false)throw Error(path+': unknown '+k);}}
}
export const contentPairs=[['campaign',campaign,campaignSchema],['balance',balance,balanceSchema],['battle',battle,battleSchema],['math',math,mathSchema],['crises',crises,crisisSchema],['endings',endings,endingSchema]] as const;
export function validateSaveEnvelope(v:unknown){validateSchema(v,saveSchema as Schema);}
export function validateContent(){
 contentPairs.forEach(([name,d,s])=>validateSchema(d,s as Schema,s as Schema,name));
 const unique=(items:Array<{id:string}>)=>{const ids=new Set(items.map(i=>i.id));if(ids.size!==items.length)throw Error('Duplicate IDs');return ids;};
 const orders=unique(campaign.orders),nodes=unique(campaign.map.nodes),templates=unique(math.templates),assets=new Set(manifest.map(a=>a.id));
 [campaign.chapters,campaign.map.routes,battle.formations,crises.crises,endings.tiers,endings.clauses].forEach(unique);
 for(const c of campaign.chapters){if(c.orderIds.filter(id=>id==='audit_stores').length!==1||c.orderIds.some(id=>!orders.has(id)))throw Error('Invalid chapter orders');}
 for(const o of campaign.orders)if(!templates.has(o.challengeTemplateId))throw Error('Unknown challenge');
 for(const r of campaign.map.routes)if(!nodes.has(r.a)||!nodes.has(r.b))throw Error('Invalid route');
 const visit=(v:unknown,k='')=>{if(Array.isArray(v)){v.forEach(x=>visit(x,k));return;}if(v&&typeof v==='object'){Object.entries(v).forEach(([key,x])=>visit(x,key));return;}if(typeof v==='string'&&(/StringIds?$/.test(k)||k==='stringId')&&text(v)===v)throw Error('Missing string '+v);if(typeof v==='string'&&(/AssetId$/.test(k)||k==='assetId')&&!assets.has(v))throw Error('Missing asset ID '+v);};
 [campaign,battle,math,crises,endings].forEach(d=>visit(d));
 for(const t of math.templates)answerPolicy(t.id);
 for(const t of math.templates)for(const v of t.variants){const answer=solve(t.id,v.operands);for(const k of t.answerFields)if(answer[k]!==v.answer[k as keyof typeof v.answer])throw Error('Math fixture mismatch '+t.id);}
 const defs=battle.terrainDefinitions as Record<string,{passable?:boolean}>;for(const row of battle.terrainGrid)for(const t of row)if(!defs[t])throw Error('Unknown terrain');
 const points=[...Object.values(battle.defaultDeployment),...Object.values(battle.deploymentZones).flat(),...Object.values(battle.fieldworkTilesByTier).flat()];for(const p of points)if(!battle.terrainGrid[p.y]?.[p.x]||defs[battle.terrainGrid[p.y][p.x]].passable===false)throw Error('Illegal board coordinate');
 for(const f of battle.formations)if(!(f.archetype in battle.archetypes))throw Error('Unknown archetype');
 return {chapters:campaign.chapters.length,orders:orders.size,templates:templates.size,variants:math.templates.reduce((n,t)=>n+t.variants.length,0),crises:crises.crises.length,formations:battle.formations.length};
}
