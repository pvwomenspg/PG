// Generate responsive display copies; original images and lightbox URLs stay unchanged.
const fs=require('node:fs');
const path=require('node:path');
const sharp=require('sharp');
(async()=>{
const pages=fs.readdirSync('.').filter(p=>p.endsWith('.html'));
const sources=new Set();
for(const page of pages){const html=fs.readFileSync(page,'utf8');for(const tag of html.matchAll(/<(?:img|source)\b[^>]*>/g)){const match=tag[0].match(/(?:src|srcset)="(assets\/[^" ,]+)"/);if(match)sources.add(match[1]);}for(const match of html.matchAll(/&quot;src&quot;\s*:\s*&quot;([^&]+)&quot;/g))sources.add(match[1]);}
// Include carousel originals even when they are not the initial visible slide.
for(const file of fs.readdirSync('assets').filter(f=>/^(two-|three-|bathroom)/.test(f)&&f.endsWith('.webp')))sources.add('assets/'+file);
const variants={};
let count=0;
for(const src of sources){if(!fs.existsSync(src)||!src.match(/\.(webp|png|jpe?g)$/i))continue;const meta=await sharp(src).metadata();const widths=[480,800,1200].filter(w=>w<meta.width);widths.push(meta.width);const set=[];for(const width of [...new Set(widths)]){const dest='assets/optimized/'+path.parse(src).name+'-w'+width+'.webp';await sharp(src).resize({width,withoutEnlargement:true}).webp({quality:82}).toFile(dest);set.push(dest+' '+width+'w');count++;}variants[src]=set.join(', ');}
const sizes='(max-width: 767px) calc(100vw - 36px), (max-width: 1279px) 60vw, 720px';
for(const page of pages){let html=fs.readFileSync(page,'utf8');html=html.replace(/<(img|source)\b[^>]*>/g,(tag,type)=>{const match=tag.match(/(?:src|srcset)="(assets\/[^" ,]+)"/);if(!match||!variants[match[1]])return tag;const set=variants[match[1]];if(type==='source')return tag.replace(/srcset="[^"]*"/,'srcset="'+set+'"').replace(/\s*sizes="[^"]*"/,'').replace(/>$/,' sizes="'+sizes+'">');return tag.replace(/\s*(?:srcset|sizes)="[^"]*"/g,'').replace(/>$/,' srcset="'+set+'" sizes="'+sizes+'">');});
// Store display variants on existing records, keeping their original src for the viewer.
html=html.replace(/data-gallery-images='([^']*)'/g,(all,json)=>{const images=JSON.parse(json);for(const image of images){if(variants[image.src]){image.srcset=variants[image.src];image.sizes=sizes;}}return "data-gallery-images='"+JSON.stringify(images)+"'";});fs.writeFileSync(page,html);}
console.log('Generated '+count+' responsive display assets.');
})().catch(error=>{console.error(error);process.exitCode=1});
