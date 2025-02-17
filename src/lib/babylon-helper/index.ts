import { Engine, Scene, MeshBuilder, StandardMaterial, Texture, CubeTexture, Color3, ArcRotateCamera, Vector3, DirectionalLight } from '@babylonjs/core'
import { Inspector } from '@babylonjs/inspector';
import { AxesHelper } from "./AxesHelper";
import { GridHelper } from "./GridHelper";

export function CreateScene(CanvasEl: HTMLCanvasElement) {
    // 初始化 Babylon.js 引擎
    const engine = new Engine(CanvasEl);
    const scene = new Scene(engine); // 创建一个场景scene

    // TODO debuger 模式 
    Inspector.Show(scene, {
        showExplorer: true,
        showInspector: true,
    });
    // 影响 GridMaterial 的显示
    // scene.debugLayer.show({
    //     showExplorer: true,
    //     showInspector: true,
    // })

    const axesHelper = new AxesHelper(200, 200, 200, scene);
    const gridHelper = new GridHelper(400, 400, scene);


    // 创建天空盒
    const skybox = MeshBuilder.CreateBox("skyBox", { size: 10000.0 }, scene);
    // 创建天空盒材质
    const skyboxMaterial = new StandardMaterial("skyBoxMaterial", scene);
    skyboxMaterial.backFaceCulling = false; // 关闭背面剔除
    skyboxMaterial.reflectionTexture = new CubeTexture("/static/mbabylon/sky/Paris", scene);
    // skyboxMaterial.reflectionTexture.rotationY = 90
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.diffuseColor = new Color3(0, 0, 0); // 漫反射颜色
    skyboxMaterial.specularColor = new Color3(0, 0, 0); // 高光颜色
    // 应用材质到天空盒
    skybox.material = skyboxMaterial;


    // 最后一步调用engine的runRenderLoop方案，执行scene.render()，让我们的3d场景渲染起来
    engine.runRenderLoop(function () {
        scene.render();
    });
    // 监听浏览器改变大小的事件，通过调用engine.resize()来自适应窗口大小
    window.addEventListener("resize", function () {
        engine.resize();
    });



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
    let light1 = new DirectionalLight("DirectionalLight1",
        new Vector3(-1, -1, -1),
        scene);
    light1.intensity = 2;  //调整平行光的强度

    // 添加光源到场景
    let light2 = new DirectionalLight("DirectionalLight2",
        new Vector3(1, -1, 1),
        scene);
    light2.intensity = 2;  //调整平行光的强度

    return scene;
}