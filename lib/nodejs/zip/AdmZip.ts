import AdmZip from "adm-zip";
function zip(srcPath: string, outputPath: string) {
    srcPath = srcPath.replace(/\\/g, '/');
    outputPath = outputPath.replace(/\\/g, '/');
    const admzip = new AdmZip();
    admzip.addLocalFolder(srcPath);
    admzip.writeZip(outputPath);
}
zip("C:\\Users\\ztl\\Desktop\\test", "C:\\Users\\ztl\\Desktop\\test.zip");

function unzip(srcPath: string, outputPath: string) {
    srcPath = srcPath.replace(/\\/g, '/');
    outputPath = outputPath.replace(/\\/g, '/');
    const file = new AdmZip(srcPath);
    file.extractAllTo(outputPath);
}
unzip("C:\\Users\\ztl\\Desktop\\test.zip", "C:\\Users\\ztl\\Desktop\\test1");