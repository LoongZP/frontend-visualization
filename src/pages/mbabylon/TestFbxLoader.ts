import {
    SceneLoader, ArcRotateCamera, Vector3, DirectionalLight,
    InitializeCSG2Async,
    MeshBuilder,
    CSG2,
    VertexBuffer,
    CSG,
    Mesh,
    Matrix,
    Color3,
    VertexData,
    Nullable
} from "@babylonjs/core"

import Module from 'manifold-3d';





// import 'babylonjs-loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper';

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
    light.intensity = 5;  //调整平行光的强度



    // TODO
    await InitializeCSG2Async();

    var box = MeshBuilder.CreateBox("box", { size: 1 }, scene);
    box.position = new Vector3(1, 1, 0);
    box.useVertexColors = true;
    let boxVertCount = box.getTotalVertices();
    let boxColors = []
    for (let i = 0; i < boxVertCount; i++) {
        boxColors.push(0, 0, 1, 0);
    }
    box.setVerticesData(VertexBuffer.ColorKind, boxColors);



    const wasm = await Module();


    SceneLoader.ImportMesh(
        '', // 要导入的特定网格的名称，空字符串表示导入所有网格
        "/static/mbabylon/models/animation/",// 模型文件的路径
        "single.fbx", // 模型文件的名称
        scene, // 要将模型导入到的目标场景
        //  回调函数，处理加载完成后的操作 
        function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
            // let rootMesh: Nullable<Mesh>=null
            meshes.forEach(mesh => {
                if (!(mesh instanceof Mesh))
                    return
                if (mesh.name == "__root__") {
                    // rootMesh=new Mesh("__root__1", scene)
                    return
                }

                let vertexData1 = new VertexData()
                vertexData1.positions = mesh.getVerticesData(VertexBuffer.PositionKind)
                // vertexData1.colors=mesh.getVerticesData(VertexBuffer.ColorKind)
                vertexData1.indices = mesh.getIndices()
                let meshCSG = CSG.FromVertexData(vertexData1)
                meshCSG.position = mesh.position.clone()
                meshCSG.position.x += 10
                // meshCSG.rotation=mesh.rotation.clone()
                // meshCSG.rotationQuaternion=mesh.rotationQuaternion!.clone()
                meshCSG.scaling = mesh.scaling.clone()
                // meshCSG.matrix = mesh.getWorldMatrix().clone()




                let vertexData2 = new VertexData()
                vertexData2.positions = box.getVerticesData(VertexBuffer.PositionKind)
                vertexData2.colors = box.getVerticesData(VertexBuffer.ColorKind)
                vertexData2.indices = box.getIndices()

                let boxCSG = CSG.FromMesh(box)
                boxCSG.position = box.position.clone()
                boxCSG.position.x += 12
                boxCSG.scaling = box.scaling.clone()
                boxCSG.matrix=box.getWorldMatrix().clone()



                let booleanCSG = meshCSG.subtract(boxCSG);
                let newMesh = booleanCSG.toMesh(mesh.name + "1", null, scene, true);
                newMesh.removeVerticesData(VertexBuffer.ColorKind)
            })
        }
    )
    return scene;
}