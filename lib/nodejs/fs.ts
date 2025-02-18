import fs from "fs";
import util from "util";
// 是否存在
// fs.existsSync("C:\\Users\\ztl\\Desktop\\test");

// let result = await new Promise((resolve, reject) => {
//     fs.access("C:\\Users\\ztl\\Desktop\\test", fs.constants.F_OK, (err) => {
//         if (err) {
//             resolve(false);
//             console.log('文件不存在');
//         } else {
//             resolve(true);
//             console.log('文件存在');
//         }
//     });
// })


// 是文件夹还是文件
const stats = await util.promisify(fs.stat)("C:\\Users\\ztl\\Desktop\\test");
console.log(stats.isDirectory()); // 是否是一个目录
console.log(stats.isFile()); // 是否是一个文件



// fs.copyFile(srcPath, outputPath, callback);
// fs.copyFileSync(srcPath, outputPath);

// 复制文件
// fs.cp('./a.txt', './aa/b.txt', (err) => {
//     if (err) {
//         console.error(err);
//     }
// });


// 复制目录
// "C:\\Users\\ztl\\Desktop\\test" 下的移动到  C:\\Users\\ztl\\Desktop\\test1 下面
fs.cp("C:\\Users\\ztl\\Desktop\\test", "C:\\Users\\ztl\\Desktop\\test1", { recursive: true }, (err) => {
    if (err) {
        console.error(err);
    }
});