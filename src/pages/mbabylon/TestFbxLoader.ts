import {
    SceneLoader, ArcRotateCamera, Vector3, DirectionalLight,
} from "babylonjs"

// import '@babylonjs/loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper'

export async function TestFbxLoader(CanvasEl: HTMLCanvasElement) {
    const scene = CreateScene(CanvasEl)

    // 添加一个相机，并绑定鼠标事件
    // 创建 ArcRotateCamera
    const camera = new ArcRotateCamera(
        "camera",        // 相机名称
        Math.PI / 2,      // α 角度 (绕Y轴旋转)
        Math.PI / 4,      // β 角度 (绕X轴旋转)
        50,               // 距离目标的半径
        new Vector3(0, 0, 0), // 目标点 (围绕此点旋转)
        scene             // 所属的场景
    );
    // 允许用户通过鼠标控制相机
    camera.attachControl(CanvasEl, true);


    // 添加光源到场景
    let light = new DirectionalLight("DirectionalLight",
        new Vector3(-1, -1, -1),
        scene);
    light.intensity = 1;  //调整平行光的强度
    // let light1 = new BABYLON.HemisphericLight("light1",
    //     new BABYLON.Vector3(1, 1, 0),
    //     scene);
    // let light2 = new BABYLON.PointLight("light2",
    //     new BABYLON.Vector3(0, 1, -1),
    //     scene);


    SceneLoader.ImportMesh(
        '', // 要导入的特定网格的名称，空字符串表示导入所有网格
        "/static/mbabylon/models/animation/",// 模型文件的路径
        "Defeated.fbx", // 模型文件的名称
        scene, // 要将模型导入到的目标场景
        function (meshes) { // 回调函数，处理加载完成后的操作
            // meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
            // 一会的鼠标监听事件就写在这里
            console.log('模型已加载', meshes);
        }
    )
}