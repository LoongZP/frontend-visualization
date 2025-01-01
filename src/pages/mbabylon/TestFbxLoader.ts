// import 'babylonjs-loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper';

import {
  SceneLoader, ArcRotateCamera, Vector3, DirectionalLight,
  MeshBuilder,
  VertexBuffer,
  Mesh,
  Matrix,
  Color3,
} from "@babylonjs/core"
// TODO
// await InitializeCSG2Async();

export async function TestFbxLoader(CanvasEl: HTMLCanvasElement) {
  const scene = CreateScene(CanvasEl)
  // const webworker=new Worker("./webworker/myworker.ts",{type: 'module'})

  SceneLoader.ImportMesh(
    '', // 要导入的特定网格的名称，空字符串表示导入所有网格
    "/static/",// 模型文件的路径
    "MacBook Pro 13-inch Laptop_fbx.fbx", // 模型文件的名称
    scene, // 要将模型导入到的目标场景
    //  回调函数，处理加载完成后的操作 
    function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
      // let rootMesh: Nullable<Mesh>=null
      meshes.forEach(mesh => {
        // webworker.postMessage({
        //     a:124,
        // })
      })
    }
  )
  return scene;
}
