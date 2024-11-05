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

    var box = MeshBuilder.CreateBox("box", { size: 10 }, scene);
    box.position = new Vector3(17, 13, 6);
    box.useVertexColors = true;
    let boxVertCount = box.getTotalVertices();
    let boxColors = []
    for (let i = 0; i < boxVertCount; i++) {
        boxColors.push(1, 0, 0, 0);
    }
    box.setVerticesData(VertexBuffer.ColorKind, boxColors);



    SceneLoader.ImportMesh(
        '', // 要导入的特定网格的名称，空字符串表示导入所有网格
        "/static/mbabylon/models/animation/",// 模型文件的路径
        "house_wlm.fbx", // 模型文件的名称
        scene, // 要将模型导入到的目标场景
        //  回调函数，处理加载完成后的操作 
        function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
            let rootMesh: Nullable<Mesh>=null
            meshes.forEach(mesh => {
                if (!(mesh instanceof Mesh))
                    return
                if (mesh.name == "__root__") {
                    rootMesh=new Mesh("__root__1", scene)
                    return
                }
                //@ts-ignore

                // let position = Vector3.TransformCoordinates(mesh.position, meshes[0].getWorldMatrix());
                // let scaling = Vector3.TransformCoordinates(mesh.scaling, meshes[0].getWorldMatrix());

                // const intersects1 = mesh.getBoundingInfo().boundingBox.intersectsMinMax(box.getBoundingInfo().boundingBox.minimum, box.getBoundingInfo().boundingBox.maximum);
                // const intersects2 = box.getBoundingInfo().boundingBox.intersectsMinMax(mesh.getBoundingInfo().boundingBox.minimum, mesh.getBoundingInfo().boundingBox.maximum);
                
                // if (mesh.name == "2") {
                //     let news = mesh.clone()
                //     news.parent = rootMesh
                //     news.position.z = 40
                //     return
                // }

                // 不能改变顺序，否则会影响 结果mesh的法线的方向、新subMesh的位置
                let meshCSG = CSG.FromMesh(mesh);
                let boxCSG = CSG.FromMesh(box);


                let meshCSGtoVertexData=meshCSG.toVertexData()
                let boxCSGtoVertexData = boxCSG.toVertexData()
                
                let booleanCSG = meshCSG.subtract(boxCSG);
                let newMesh = booleanCSG.toMesh(mesh.name + "1", mesh.material, scene, true);
       

                let subMeshes1 = mesh.subMeshes
                subMeshes1.forEach((subMesh) => {
                    console.log(subMesh.getMaterial());
                })

                let subMeshes2 = newMesh.subMeshes
                subMeshes2.forEach((subMesh) => {
                    console.log(subMesh.getMaterial());
                })
                // let tmp=subMeshes2[subMeshes2.length-1].materialIndex
                // for (let i = subMeshes2.length - 1; i > 0;i--){
                //     subMeshes2[i].materialIndex=subMeshes2[i-1].materialIndex
                //     console.log(subMeshes2[i].getMaterial());
                // }
                // subMeshes2[0].materialIndex = tmp
                // console.log(subMeshes2[0].getMaterial());




                let subMaterial1 = mesh.material?.subMaterials!
                let subMaterial2 = newMesh.material?.subMaterials!
                


                let vDataKind = mesh.getVerticesDataKinds()
                let vData:any={}
                vDataKind.forEach((kind) => {
                    vData[kind]=mesh.getVerticesData(kind)
                })
                // 删除 cut 带来的顶点颜色
                newMesh.geometry?.removeVerticesData("color")
                let newvDataKind = newMesh.getVerticesDataKinds()
                let newvData:any={}
                newvDataKind.forEach((kind) => {
                    newvData[kind]=newMesh.getVerticesData(kind)
                })



                if(rootMesh)
                    newMesh.parent = rootMesh
                newMesh.position.z = 40
  
            })
        }
    )
    return scene;
}

// function isT(mesh1: Mesh, mesh2: Mesh) {
//     let box1 = mesh1.getBoundingInfo().boundingBox
//     let box1W = box1.vectors.map((local) => {
//         return Vector3.TransformCoordinates(local, box1.getWorldMatrix());
//     })
//     let box12d=box1W.forEach()
//     let box2 = mesh2.getBoundingInfo().boundingBox
//     let box2W = box2.vectors.map((local) => {
//         return Vector3.TransformCoordinates(local, box1.getWorldMatrix());
//     })
//     for (const v of box1W) {
//         const flag = pointInPolygon({
//             x: v.x,
//             y: v.x,
//         }, points);
//         if (flag) return true;
//     }
//     for (const v of boundingBoxPoints) {
//         const flag = pointInPolygon({
//             x: v.x,
//             x: v.x,
//         }, points);
//         if (flag) return true;
//     }
// }

// export type Point2D = { x: number, y: number };
// export type Line2D = [Point2D, Point2D];
// export type Polygon2D = Point2D[];
// export const isPointInPolygon = (point: Point2D, polygon: Polygon2D) => {
//     let inRange = false;
//     for (let i = -1, l = polygon.length, j = l - 1; ++i < l; j = i)
//       ((polygon[i].y <= point.y && point.y < polygon[j].y) || (polygon[j].y <= point.y && point.y < polygon[i].y))
//         && (point.x < (polygon[j].x - polygon[i].x) * (point.y - polygon[i].y) / (polygon[j].y - polygon[i].y) + polygon[i].x)
//         && (inRange = !inRange);
//     return inRange;
//   };
