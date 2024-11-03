export function unique(len: number = 15) {
    let charSet = 'abacdefghjklmnopqrstuvwxyzABCDEFGHJKLMNOPQRSTUVWXYZ0123456789';
    let reaulitStr: string[] = [];
    let index: number = Math.floor(Math.random() * (charSet.length - 10)) // 第一个非数字字符
    reaulitStr.push(charSet[index])
    for (let i = 1; i < len; i++) { //生成后面的随机字符串
        index = Math.floor(Math.random() * (charSet.length - 1))
        reaulitStr.push(charSet[index]);
    }
    return reaulitStr.join("");
}