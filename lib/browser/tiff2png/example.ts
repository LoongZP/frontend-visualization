import UTIF from "./UTIF"
import UPNG from "./UPNG"
var arrayBuffer = new ArrayBuffer(10);
var ifds = UTIF.decode(arrayBuffer);
UTIF.decodeImage(arrayBuffer, ifds[0])
var rgba = UTIF.toRGBA8(ifds[0]);  // Uint8Array with RGBA pixels
var png = UPNG.encode([rgba], ifds[0].width, ifds[0].height, 0);
console.log(new Uint8Array(png));
let img = document.createElement("img");
img.src = URL.createObjectURL(new Blob([arrayBuffer], { type: "image/tiff" }))
document.getElementById("main")?.appendChild(img)