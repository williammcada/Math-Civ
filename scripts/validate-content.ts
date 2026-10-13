import Ajv2020 from 'ajv/dist/2020.js';
import {contentPairs,validateContent} from '../src/content/loader';
const ajv=new Ajv2020({strict:false,allErrors:true});
for(const [name,data,schema] of contentPairs){const validator=ajv.compile(schema);if(!validator(data))throw Error(name+': '+JSON.stringify(validator.errors));}
console.log('Validated content:',validateContent());
