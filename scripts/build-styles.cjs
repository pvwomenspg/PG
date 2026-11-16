// Production copies only: keep editable CSS unchanged.
const fs=require('node:fs/promises');
const postcss=require('postcss');
const cssnano=require('cssnano');
(async()=>{let before=0,after=0;for(const file of await fs.readdir('css')){if(!file.endsWith('.css')||file.endsWith('.min.css')||file==='tailwind-input.css')continue;const source='css/'+file;const destination=source.replace(/\.css$/,'.min.css');const input=await fs.readFile(source,'utf8');const output=await postcss([cssnano({preset:['default',{mergeRules:false,cssDeclarationSorter:false}]})]).process(input,{from:source,to:destination,map:false});await fs.writeFile(destination,output.css);before+=Buffer.byteLength(input);after+=Buffer.byteLength(output.css);console.log(file+': '+Buffer.byteLength(input)+' -> '+Buffer.byteLength(output.css)+' bytes');}console.log('Total CSS: '+before+' -> '+after+' bytes');})().catch(error=>{console.error(error);process.exitCode=1});
