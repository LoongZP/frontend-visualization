import { Engine, Scene, MeshBuilder, StandardMaterial, Texture, CubeTexture, Color3 } from '@babylonjs/core'
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
    return scene;
}