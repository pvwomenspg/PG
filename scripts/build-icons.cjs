// Preserve Font Awesome styles while shipping only icon glyphs used by the site.
const fs=require('node:fs/promises');
const postcss=require('postcss');
const subsetFont=require('subset-font');
(async()=>{
 const used=new Set(['fa-chevron-up','fa-chevron-down']); // dynamically composed in Gallery
 const files=(await fs.readdir('.')).filter(f=>f.endsWith('.html'));
 for(const directory of ['js','css'])for(const file of await fs.readdir(directory))if(/\.(js|css)$/.test(file)&&!file.startsWith('icons.')&&!file.endsWith('.min.css'))files.push(directory+'/'+file);
 for(const file of files){const text=await fs.readFile(file,'utf8');for(const name of text.match(/\bfa-[a-z0-9-]+\b/g)||[])used.add(name);}
 const original='node_modules/@fortawesome/fontawesome-free/';
 const root=postcss.parse(await fs.readFile(original+'css/all.min.css','utf8'));
 const glyphs=new Set();
 root.walkRules(rule=>{
  const content=rule.nodes.find(node=>node.type==='decl'&&node.prop==='content');
  if(!content||!rule.selector.includes('.fa-'))return;
  const selectors=rule.selectors.filter(selector=>(selector.match(/\.fa-[a-z0-9-]+/g)||[]).some(name=>used.has(name.slice(1))));
  if(!selectors.length){rule.remove();return;}
  rule.selectors=selectors;
  for(const match of content.value.matchAll(/\\([0-9a-f]{1,6})/gi))glyphs.add(String.fromCodePoint(parseInt(match[1],16)));
 });
 root.walkDecls(decl=>{
  if(decl.prop!=='src')return;
  decl.value=decl.value.replace(/url\(\.\.\/webfonts\/([^)]*\.woff2)\)/g,"url('../assets/fonts/$1')").replace(/,url\(\.\.\/webfonts\/[^)]*\.ttf\) format\("truetype"\)/g,'');
 });
 let before=0,after=0;
 for(const name of ['fa-solid-900.woff2','fa-regular-400.woff2','fa-brands-400.woff2']){
  const input=await fs.readFile(original+'webfonts/'+name);
  const output=await subsetFont(input,[...glyphs].join(''),{targetFormat:'woff2'});
  await fs.writeFile('assets/fonts/'+name,output);
  before+=input.length;after+=output.length;
  console.log(name+': '+input.length+' -> '+output.length+' bytes');
 }
 await fs.writeFile('css/icons.min.css',root.toString());
 console.log('Icon fonts: '+before+' -> '+after+' bytes; '+glyphs.size+' used codepoints retained.');
})().catch(error=>{console.error(error);process.exitCode=1});
