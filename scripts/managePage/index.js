import path from "path"
import fs from "fs"
import chalk from 'chalk';

const log = (message) => console.log(chalk.green(`${message}`))
const successLog = (message) => console.log(chalk.blue(`${message}`))
const errorLog = (error) => console.log(chalk.red(`${error}`))

log('请输入要生成的"命令:页面名称:页面描述"')
log("1. create:页面名称:页面描述")
log("2. del:页面名称:页面描述")
log("3. exit (退出)")
log(">")


//process.stdin属性是流程模块的内置应用程序编程接口，用于侦听用户输入，它使用on()函数来监听事件。
process.stdin.on('data', async (chunk) => {
    // 获取输入的信息
    const content = String(chunk).trim().toString().split(':')
    if (content.length == 0) {
        errorLog('格式错误，请重新输入')
        return
    }
    switch (content[0]) {
        case "create":
            {
                const inputName = content[1]
                const inputDesc = content[2] || inputName
                if (!inputName) {
                    errorLog('格式错误，请重新输入')
                    return
                }
                createPage(inputName, inputDesc)
                break;
            }
        case "del":
            {
                const inputName = content[1]
                if (!inputName) {
                    errorLog('格式错误，请重新输入')
                    return
                }
                delPage(inputName)
                break;
            }
        case "exit":
            process.stdin.emit('end')
            break;
        default:
            errorLog('格式错误，请重新输入')
            return
    }
})
process.stdin.on('end', () => {
    console.log('exit')
    process.exit()
})


// 判断文件夹是否存在，不存在创建一个
const isExist = (path) => {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path)
    }
}
//递归复制模版文件夹内的文件
const copyFile = (sourcePath, targetPath) => {
    const sourceFile = fs.readdirSync(sourcePath, { withFileTypes: true })
    sourceFile.forEach((file) => {
        const newSourcePath = path.resolve(sourcePath, file.name)
        const newTargetPath = path.resolve(targetPath, file.name)
        //isDirectory() 判断这个文件是否是文件夹，是就继续递归复制其内容
        if (file.isDirectory()) {
            isExist(newTargetPath)
            copyFile(newSourcePath, newTargetPath)
        } else {
            fs.copyFileSync(newSourcePath, newTargetPath)
        }
    })
}
function createPage(inputName, inputDesc) {
    // const isTs = process.env.npm_config_ts
    const targetPath = path.resolve('./src/pages', inputName)
    // 判断同名文件夹是否存在
    if (fs.existsSync(targetPath)) {
        errorLog('页面已经存在，请重新输入')
        return
    }
    successLog(`将在 /src/pages/ 目录下创建 ${inputName} 网页文件夹`)
    // 在pages中建立新的目录
    fs.mkdirSync(targetPath)
    const sourcePath = path.resolve('./scripts/managePage/template') // isTs ? './scripts/template-ts' : './scripts/template'
    copyFile(sourcePath, targetPath)
    successLog(`网页 ${inputName} 已经创建`)
    process.stdin.emit('end')
    // let infoPath = path.resolve('./scripts', 'multiPages.json');
    // if (!fs.existsSync(targetPath)) {
    //     fs.writeFileSync(infoPath, '[]')
    // }
    // 获取multiPages.json文件内容，获取当前已有的页面集合
    // fs.readFile(
    //     infoPath,
    //     'utf-8',
    //     (err, data) => {
    //         //获取老数据
    //         let datas = JSON.parse(data)
    //         //和老数据去比较
    //         let index = datas.findIndex((ele) => {
    //             return ele.pageName == inputName
    //         })
    //         if (index == -1) {
    //             //写入新页面的
    //             let obj = {
    //                 pageName: inputName,
    //                 pageDesc: inputDesc
    //             }
    //             datas.push(obj)
    //             // 写入multiPages.json
    //             fs.writeFile(
    //                 path.resolve('./scripts', 'multiPages.json'),
    //                 JSON.stringify(datas),
    //                 'utf-8',
    //                 (err) => {
    //                     if (err) throw err
    //                     // 在pages中建立新的目录
    //                     fs.mkdirSync(targetPath)
    //                     const sourcePath = path.resolve('./scripts/template') // isTs ? './scripts/template-ts' : './scripts/template'
    //                     copyFile(sourcePath, targetPath)
    //                     successLog(`网页 ${inputName} 已经创建`)
    //                     process.stdin.emit('end')
    //                 }
    //             )
    //         }
    //     }
    // )
}
function delPage(inputName) {
    const targetPath = path.resolve('./src/pages', inputName)
    fs.rmSync(targetPath, { recursive: true, force: true });
    process.stdin.emit('end')

    // fs.readFile(
    //     path.resolve('./scripts', 'multiPages.json'),
    //     'utf-8',
    //     (err, data) => {
    //         //获取老数据
    //         let datas = JSON.parse(data)
    //         //和老数据去重
    //         datas = datas.filter((ele) => {
    //             return ele.pageName !== inputName
    //         })
    //         // 写入multiPages.json
    //         fs.writeFile(
    //             path.resolve('./scripts', 'multiPages.json'),
    //             JSON.stringify(datas),
    //             'utf-8',
    //             (err) => {
    //                 if (err) throw err
    //                 fs.rmSync(targetPath, { recursive: true, force: true });
    //                 process.stdin.emit('end')
    //             }
    //         )
    //     }
    // )
}