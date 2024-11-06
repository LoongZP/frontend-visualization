import {
    SceneLoader, ArcRotateCamera, Vector3, DirectionalLight,
    MeshBuilder,
    VertexBuffer,
    CSG,
    Mesh,
    Matrix,
    Color3,
    VertexData,
    Nullable
} from "@babylonjs/core"

// TODO
// await InitializeCSG2Async(); 


// import 'babylonjs-loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper';


import Module,{Mesh as Manifold3dMeshType} from 'manifold-3d';
const wasm = await Module();
wasm.setup();
const { Manifold, Mesh: Manifold3dMesh } = wasm;

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




    const { cube, sphere } = Manifold;
    const box = cube([100, 100, 100], true);
    const ball = sphere(60, 100);
    const result = box.subtract(ball);

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
                let oldPositions1=mesh.getVerticesData(VertexBuffer.PositionKind)!
                let newPositions1 = []
                let worldMatrix1=mesh.getWorldMatrix()
                for (let i = 0; i < oldPositions1?.length; i+=3){
                    let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions1[i], oldPositions1[i+1], oldPositions1[i+2]), worldMatrix1)
                    newPositions1.push(worldPos.x,worldPos.y,worldPos.z)
                }
                vertexData1.positions = newPositions1
                // vertexData1.colors=mesh.getVerticesData(VertexBuffer.ColorKind)
                vertexData1.indices = mesh.getIndices()

                let x5_1 = new Mesh("x5_1", scene)
                vertexData1.applyToMesh(x5_1)
                x5_1.position.x+=5
                
                let manifold_mesh = vertexData2mesh(vertexData1)
                let meshManifold = Manifold.ofMesh(manifold_mesh)
                


                
                var mesh2 = MeshBuilder.CreateBox("mesh2", { size: 1 }, scene);
                mesh2.position.y+=1 
                mesh2.useVertexColors = true;
                let boxVertCount = mesh2.getTotalVertices();
                let boxColors = []
                for (let i = 0; i < boxVertCount; i++) {
                    boxColors.push(0, 0, 1, 0);
                }
                mesh2.setVerticesData(VertexBuffer.ColorKind, boxColors);

                let vertexData2 = new VertexData()
                let oldPositions2=mesh2.getVerticesData(VertexBuffer.PositionKind)!
                let newPositions2 = []
                mesh2.computeWorldMatrix(true)
                let worldMatrix2=mesh2.getWorldMatrix()
                for (let i = 0; i < oldPositions2?.length; i+=3){
                    let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions2[i], oldPositions2[i+1], oldPositions2[i+2]), worldMatrix2)
                    newPositions2.push(worldPos.x,worldPos.y,worldPos.z)
                }

                vertexData2.positions = newPositions2
                // vertexData2.colors = mesh2.getVerticesData(VertexBuffer.ColorKind)
                vertexData2.indices = mesh2.getIndices()

                let x5_2 = new Mesh("x5_2", scene)
                vertexData2.applyToMesh(x5_2)
                x5_2.position.x+=5
                let manifold_mesh2 = vertexData2mesh(vertexData2)
                let mesh2Manifold=Manifold.ofMesh(manifold_mesh2)





                let resultManifold = meshManifold.subtract(mesh2Manifold);
                let resultManifoldMesh = resultManifold.getMesh()
                resultManifoldMesh.merge()
                let resultVertexData = mesh2vertexData(resultManifoldMesh)
                let resultMesh = new Mesh("result",scene);
                resultVertexData.applyToMesh(resultMesh)
                resultMesh.position.z+=5
            })
        }
    )
    return scene;
}



  
// Convert Manifold Mesh to  
function mesh2vertexData(mesh: Manifold3dMeshType):VertexData {
    const vertexData = new VertexData()
    // Assign buffers
    vertexData.positions = mesh.vertProperties
    vertexData.indices=mesh.triVerts
    return vertexData;
}

// Convert   to Manifold Mesh
function vertexData2mesh(vertexData:VertexData): Manifold3dMeshType{
    // Only using position in this sample for simplicity. Can interleave any other
    // desired attributes here such as UV, normal, etc.

    // positions
    const positions = vertexData.positions;
    // UV
    // normal
    // Manifold only uses indexed geometry, so generate an index if necessary.
    const indices = vertexData.indices;

    // Create the MeshGL for I/O with Manifold library.

    const mesh =new Manifold3dMesh({vertProperties:positions, triVerts:indices});
        
    // Automatically merge vertices with nearly identical positions to create a
    // Manifold. This only fills in the mergeFromVert and mergeToVert vectors -
    // these are automatically filled in for any mesh returned by Manifold. These
    // are necessary because GL drivers require duplicate verts when any
    // properties change, e.g. a UV boundary or sharp corner.
    mesh.merge();
    return mesh;
}





// // Convert Three.js BufferGeometry to Manifold Mesh
// function geometry2mesh(geometry: BufferGeometry) {
//     // Only using position in this sample for simplicity. Can interleave any other
//     // desired attributes here such as UV, normal, etc.
//     const vertProperties = geometry.attributes.position.array as Float32Array;
//     // Manifold only uses indexed geometry, so generate an index if necessary.
//     const triVerts = geometry.index != null ?
//         geometry.index.array as Uint32Array :
//         new Uint32Array(vertProperties.length / 3).map((_, idx) => idx);
//     // Create a triangle run for each group (material) - akin to a draw call.
//     const starts = [...Array(geometry.groups.length)].map(
//         (_, idx) => geometry.groups[idx].start);
//     // Map the materials to ID.
//     const originalIDs = [...Array(geometry.groups.length)].map(
//         (_, idx) => ids[geometry.groups[idx].materialIndex!]);
//     // List the runs in sequence.
//     const indices = Array.from(starts.keys())
//     indices.sort((a, b) => starts[a] - starts[b])
//     const runIndex = new Uint32Array(indices.map(i => starts[i]));
//     const runOriginalID = new Uint32Array(indices.map(i => originalIDs[i]));
//     // Create the MeshGL for I/O with Manifold library.
//     const mesh =
//         new Mesh({numProp: 3, vertProperties, triVerts, runIndex, runOriginalID});
//     // Automatically merge vertices with nearly identical positions to create a
//     // Manifold. This only fills in the mergeFromVert and mergeToVert vectors -
//     // these are automatically filled in for any mesh returned by Manifold. These
//     // are necessary because GL drivers require duplicate verts when any
//     // properties change, e.g. a UV boundary or sharp corner.
//     mesh.merge();
//     return mesh;
//   }
  
//   // Convert Manifold Mesh to Three.js BufferGeometry
//   function mesh2geometry(mesh: Mesh) {
//     const geometry = new BufferGeometry();
//     // Assign buffers
//     geometry.setAttribute(
//         'position', new BufferAttribute(mesh.vertProperties, 3));
//     geometry.setIndex(new BufferAttribute(mesh.triVerts, 1));
//     // Create a group (material) for each ID. Note that there may be multiple
//     // triangle runs returned with the same ID, though these will always be
//     // sequential since they are sorted by ID. In this example there are two runs
//     // for the MeshNormalMaterial, one corresponding to each input mesh that had
//     // this ID. This allows runTransform to return the total transformation matrix
//     // applied to each triangle run from its input mesh - even after many
//     // consecutive operations.
//     let id = mesh.runOriginalID[0];
//     let start = mesh.runIndex[0];
//     for (let run = 0; run < mesh.numRun; ++run) {
//       const nextID = mesh.runOriginalID[run + 1];
//       if (nextID !== id) {
//         const end = mesh.runIndex[run + 1];
//         geometry.addGroup(start, end - start, id2matIndex.get(id));
//         id = nextID;
//         start = end;
//       }
//     }
//     return geometry;
//   }