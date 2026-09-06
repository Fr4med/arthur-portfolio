import sharp from 'sharp';
import {writeFile} from 'node:fs/promises';
const files=['9d4e6e5f-7de4-4096-83d4-9e3c0c39ee8b.JPG','75ead69c-e3c7-44b6-8b5b-51f206eed426.JPG','IMG_1147.jpg','IMG_1148.jpg','story shabbat sesh.PNG','VCA THUMB.png','IMG_1164.JPG','IMG_8481 3.JPG','IMG_9203.JPG','561A1007.JPG','IMG_8480 2.JPG','561A1011.JPG','IMG_9191.JPG','IMG_9194.JPG','0S4A5650.jpg','561A1004.JPG','IMG_0702.JPG','0S4A5666 2.JPG','0S4A5659.jpg','561A1524.JPEG','IMG_9234.JPG','IMG_9235.JPG','IMG_9233.JPG','IMG_9236.JPG'];
const manifest=[];
for(const [i,file] of files.entries()){
const stem=String(i+1).padStart(2,'0');
for(const width of [640,1600]) await sharp('D:/website/'+file).rotate().resize({width,withoutEnlargement:true}).webp({quality:82}).toFile(`public/photos/${stem}-${width}.webp`);
const info=await sharp(`public/photos/${stem}-1600.webp`).metadata(); manifest.push({id:i+1,source:file,width:info.width,height:info.height});
}
await writeFile('lib/photo-manifest.json',JSON.stringify(manifest,null,2));
console.log(`Prepared ${manifest.length} photos in two sizes.`);
