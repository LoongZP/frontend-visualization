import TGA from 'tga';
import { PNG } from 'pngjs';
import fs from "fs"
import sharp from 'sharp';
let data = fs.readFileSync("C:\\Users\\admin\\Desktop\\00切片\\fbx\\9btvoxf8n0cg-3dt\\building_025_c.tga")
const tga = new TGA(data);
const png = new PNG({
    width: tga.width,
    height: tga.height
});
png.data = Buffer.from(tga.pixels);
const stream = png.pack();
var options = { colorType: 6 };
var buffer = PNG.sync.write(stream,options);


let sharpImg = sharp(buffer);
sharpImg = sharpImg.jpeg({ mozjpeg: true, quality: 100 });
let newBuffer = await sharpImg.toBuffer();