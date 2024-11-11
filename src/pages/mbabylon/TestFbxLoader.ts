// import 'babylonjs-loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper';


import {
  SceneLoader, ArcRotateCamera, Vector3, DirectionalLight,
  MeshBuilder,
  VertexBuffer,
  CSG,
  CSG2,
  Mesh,
  Matrix,
  Color3,
  VertexData,
  Nullable
} from "@babylonjs/core"
// TODO
// await InitializeCSG2Async();

export async function TestFbxLoader(CanvasEl: HTMLCanvasElement) {
  const scene = CreateScene(CanvasEl)
  // const webworker=new Worker("./webworker/myworker.ts",{type: 'module'})

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
        let oldPositions1 = mesh.getVerticesData(VertexBuffer.PositionKind)!
        let newPositions1 = []
        let worldMatrix1 = mesh.getWorldMatrix()
        for (let i = 0; i < oldPositions1?.length; i += 3) {
          let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions1[i], oldPositions1[i + 1], oldPositions1[i + 2]), worldMatrix1)
          newPositions1.push(worldPos.x, worldPos.y, worldPos.z)
        }
        vertexData1.positions = newPositions1
        vertexData1.indices = mesh.getIndices()

        let x5_1 = new Mesh("x5_1", scene)
        vertexData1.applyToMesh(x5_1)
        x5_1.position.x += 5



        var mesh2 = MeshBuilder.CreateBox("mesh2", { size: 1 }, scene);
        mesh2.position.y += 1
        mesh2.useVertexColors = true;
        let boxVertCount = mesh2.getTotalVertices();
        let boxColors = []
        for (let i = 0; i < boxVertCount; i++) {
          boxColors.push(0, 0, 1, 0);
        }
        mesh2.setVerticesData(VertexBuffer.ColorKind, boxColors);

        let vertexData2 = new VertexData()
        let oldPositions2 = mesh2.getVerticesData(VertexBuffer.PositionKind)!
        let newPositions2 = []
        mesh2.computeWorldMatrix(true)
        let worldMatrix2 = mesh2.getWorldMatrix()
        for (let i = 0; i < oldPositions2?.length; i += 3) {
          let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions2[i], oldPositions2[i + 1], oldPositions2[i + 2]), worldMatrix2)
          newPositions2.push(worldPos.x, worldPos.y, worldPos.z)
        }

        vertexData2.positions = newPositions2
        // vertexData2.colors = mesh2.getVerticesData(VertexBuffer.ColorKind)
        vertexData2.indices = mesh2.getIndices()

        let x5_2 = new Mesh("x5_2", scene)
        vertexData2.applyToMesh(x5_2)
        x5_2.position.x += 5





        // webworker.postMessage({
        //     a:124,
        // })
      })
    }
  )
  return scene;
}
