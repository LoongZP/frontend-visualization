// import 'babylonjs-loaders';

import { FBXLoader } from "@/../lib/browser/babylonjs-fbx-loader-master"
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
import "../../../lib/browser/ObjModelLoaderHack"
export async function TestFbxLoader(CanvasEl: HTMLCanvasElement) {
  const scene = CreateScene(CanvasEl)
  // const webworker=new Worker("./webworker/myworker.ts",{type: 'module'})

  SceneLoader.ImportMesh(
    '', // 要导入的特定网格的名称，空字符串表示导入所有网格
    "/static/mbabylon/models/Street environment_V01/fbx/",// 模型文件的路径
    "Street environment_V01.fbx", // 模型文件的名称
    scene, // 要将模型导入到的目标场景
    //  回调函数，处理加载完成后的操作 
    function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
      // let rootMesh: Nullable<Mesh>=null
      meshes.forEach(mesh => {
        // webworker.postMessage({
        //     a:124,
        // })
        // mesh.scaling.x = 10
        // mesh.scaling.y = 10
        // mesh.scaling.z = 10

        // mesh.position.x += 10;
      })
    }
  )
  
  // SceneLoader.ImportMesh(
  //   '', // 要导入的特定网格的名称，空字符串表示导入所有网格
  //   "/static/mbabylon/models/写字楼/",// 模型文件的路径
  //   "写字楼F.obj", // 模型文件的名称
  //   scene, // 要将模型导入到的目标场景
  //   //  回调函数，处理加载完成后的操作 
  //   function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
  //     // let rootMesh: Nullable<Mesh>=null
  //     meshes.forEach(mesh => {
  //       // webworker.postMessage({
  //       //     a:124,
  //       // })
  //       // mesh.scaling.x = 5
  //       // mesh.scaling.y = 5
  //       // mesh.scaling.z = 5
  //     })
  //   }
  // )
  // SceneLoader.ImportMesh(
  //   '', // 要导入的特定网格的名称，空字符串表示导入所有网格
  //   "/static/mbabylon/models/Atlantis/",// 模型文件的路径
  //   "atlantis.obj", // 模型文件的名称
  //   scene, // 要将模型导入到的目标场景
  //   //  回调函数，处理加载完成后的操作 
  //   function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
  //     // let rootMesh: Nullable<Mesh>=null
  //     meshes.forEach(mesh => {
  //       // webworker.postMessage({
  //       //     a:124,
  //       // })
  //       // mesh.scaling.x = 5
  //       // mesh.scaling.y = 5
  //       // mesh.scaling.z = 5
  //       mesh.position.x -= 100;
  //     })
  //   }
  // )
  return scene;
}
