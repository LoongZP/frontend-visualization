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

// import Module,{Mesh as Manifold3dMeshType} from 'manifold-3d';
// const wasm = await Module();
// wasm.setup();
// const { Manifold, Mesh: Manifold3dMesh } = wasm;


// import 'babylonjs-loaders';
import { FBXLoader } from "../../lib/babylonjs-fbx-loader-master"
// @ts-ignore
SceneLoader.RegisterPlugin(new FBXLoader())
import { CreateScene } from '../../lib/babylon-helper';


import initOpenCascade, { gp_Pnt, TopoDS_Shape } from "./opencascade.js/dist/index.js";
import { verticesData1 } from "./data.js";

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


    let oc = await initOpenCascade()
    let positions = verticesData1.positions
    let indices = verticesData1.indices
    // 创建顶点
    function createPoint(x:number, y:number, z:number) {
        return new oc.gp_Pnt_3(x, y, z); // gp_Pnt 用来表示顶点
    }
    // 创建边
    function createEdge(p1: gp_Pnt, p2: gp_Pnt) {
        let tt=new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
        return tt; // BRepBuilderAPI_MakeEdge 用来生成边
    }
    // 创建一个面
    function createFaceFromPositionsAndIndices(positions:number[], indices:number[]) {
        let wireBuilder = new oc.BRepBuilderAPI_MakeWire_1();
        
        // 创建边并将其添加到 Wire
        for (let i = 0; i < 3; i += 3) {
            // 一个三角形
            let idx = [indices[i], indices[i + 1], indices[i + 2]]
            // 一个三角形的三个顶点
            let pos = [
                [positions[idx[0]*3],positions[idx[0]*3+1],positions[idx[0]*3+2]],
                [positions[idx[1]*3],positions[idx[1]*3+1],positions[idx[1]*3+2]],
                [positions[idx[2]*3],positions[idx[2]*3+1],positions[idx[2]*3+2]],
            ]
            let p1 = createPoint(pos[0][0],pos[0][1],pos[0][2]);
            let p2 = createPoint(pos[1][0],pos[1][1],pos[1][2]);
            let p3 = createPoint(pos[2][0],pos[2][1],pos[2][2]);

            wireBuilder.Add_1(createEdge(p1, p2));
            wireBuilder.Add_1(createEdge(p1, p3));
            wireBuilder.Add_1(createEdge(p2, p3));
        }
        if (!wireBuilder.IsDone()) {
            console.log(123);
        }
        // 用 Wire 构造面
        let wire = wireBuilder.Wire();
        let faceBuilder = new oc.BRepBuilderAPI_MakeFace_1();
        faceBuilder.Add(wire)
        
        return faceBuilder.Face(); // 返回创建的面
    }
    // 创建几何体（例如一个由三角形组成的网格体）
    let shape1 = createFaceFromPositionsAndIndices(positions, indices);

//     ShapeFix_Shape fixer(shape);
// fixer.Perform();  // 修复几何体


    // 使用 BRepAlgoAPI_Cut 执行布尔减法
    let cut = new oc.BRepAlgoAPI_Cut_3(shape1, shape1,new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    // 获取布尔运算结果
    let resultShape = cut.Shape();






    // const sphere = new oc.BRepPrimAPI_MakeSphere_1(1);
    // // Take shape and subtract a translated and scaled sphere from it
    // const makeCut = (shape: TopoDS_Shape, translation: [number, number, number], scale: number) => {
    //     const tf = new oc.gp_Trsf_1();
    //     tf.SetTranslation_1(new oc.gp_Vec_4(translation[0], translation[1], translation[2]));
    //     tf.SetScaleFactor(scale);
    //     const loc = new oc.TopLoc_Location_2(tf);
    
    //     const cut = new oc.BRepAlgoAPI_Cut_3(shape, sphere.Shape().Moved(loc, false), new oc.Message_ProgressRange_1());
    //     cut.Build(new oc.Message_ProgressRange_1());
    
    //     return cut.Shape();
    // };
    
    // // Let's make some cuts
    // const cut1 = makeCut(sphere.Shape(), [0, 0, 0.7], 1);
    // const cut2 = makeCut(cut1, [0, 0, -0.7], 1);
    // const cut3 = makeCut(cut2, [0, 0.25, 1.75], 1.825);
    // const cut4 = makeCut(cut3, [4.8, 0, 0], 5);
    
    // // Rotate around the Z axis
    // const makeRotation = (rotation: number) => {
    //     const tf = new oc.gp_Trsf_1();
    //     tf.SetRotation_1(new oc.gp_Ax1_2(new oc.gp_Pnt_1(), new oc.gp_Dir_4(0, 0, 1)), rotation);
    //     const loc = new oc.TopLoc_Location_2(tf);
    //     return loc;
    // };
    
    // // Combine the result
    // const fuse = new oc.BRepAlgoAPI_Fuse_3(cut4, cut4.Moved(makeRotation(Math.PI), false), new oc.Message_ProgressRange_1());
    // fuse.Build(new oc.Message_ProgressRange_1());
    // const result = fuse.Shape().Moved(makeRotation(-30 * Math.PI / 180), false);


    





    
    // // Make 2 meshes..
    // let geometry1 = new THREE.BufferGeometry();
    
    // let positions = new Float32Array(verticesData1.positions);
    // geometry1.attributes.position = new THREE.BufferAttribute(positions, 3);
 
    // let indices = new Uint16Array(verticesData1.indices);
    // geometry1.index = new THREE.BufferAttribute(indices, 1);
    // let n:number[] = []
    // for (let i = 0; i < positions.length;i+=3){
    //     n.push(0,0,1)
    // }
    // let normals=new Uint16Array(n)
    // geometry1.setAttribute('normal',new THREE.BufferAttribute(normals, 3));


    // const house = new THREE.Mesh(geometry1,new THREE.MeshNormalMaterial());
    // house.updateMatrix();

    // const box = new THREE.Mesh(
    //     new THREE.BoxGeometry(2, 2, 2),
    //     new THREE.MeshNormalMaterial()
    // );
    // // Make sure the .matrix of each mesh is current
    // box.updateMatrix();

    // // Perform CSG operations
    // // The result is a THREE.Mesh that you can add to your scene...
    // console.time('计时器');
    // const subRes = threeCGS.subtract(house, box);
    // // const uniRes = threeCGS.union(box, sphere);
    // // const intRes = threeCGS.intersect(box, sphere);
    // // 结束计时
    // console.timeEnd('计时器');

    


    // const { cube, sphere } = Manifold;
    // const box = cube([100, 100, 100], true);
    // const ball = sphere(60, 100);
    // const result = box.subtract(ball);

    // const webworker=new Worker("./webworker/myworker.ts",{type: 'module'})

    // SceneLoader.ImportMesh(
    //     '', // 要导入的特定网格的名称，空字符串表示导入所有网格
    //     "/static/mbabylon/models/animation/",// 模型文件的路径
    //     "house_wlm.fbx", // 模型文件的名称
    //     scene, // 要将模型导入到的目标场景
    //     //  回调函数，处理加载完成后的操作 
    //     function (meshes) { //meshs是模型中的所有网格，是模型的基本组成后续要实现各种交互需要了解。
    //         // let rootMesh: Nullable<Mesh>=null
    //         meshes.forEach(mesh => {
    //             if (!(mesh instanceof Mesh))
    //                 return
    //             if (mesh.name == "__root__") {
    //                 // rootMesh=new Mesh("__root__1", scene)
    //                 return
    //             }

    //             let vertexData1 = new VertexData()
    //             let oldPositions1=mesh.getVerticesData(VertexBuffer.PositionKind)!
    //             let newPositions1 = []
    //             let worldMatrix1=mesh.getWorldMatrix()
    //             for (let i = 0; i < oldPositions1?.length; i+=3){
    //                 let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions1[i], oldPositions1[i+1], oldPositions1[i+2]), worldMatrix1)
    //                 newPositions1.push(worldPos.x,worldPos.y,worldPos.z)
    //             }
    //             vertexData1.positions = newPositions1
    //             // vertexData1.colors=mesh.getVerticesData(VertexBuffer.ColorKind)
    //             vertexData1.indices = mesh.getIndices()

    //             let x5_1 = new Mesh("x5_1", scene)
    //             vertexData1.applyToMesh(x5_1)
    //             x5_1.position.x+=5
    //             // let manifold_mesh = vertexData2mesh(vertexData1)
    //             // manifold_mesh.merge()
    //             // let meshManifold = Manifold.ofMesh(manifold_mesh)
    //             // meshManifold.calculateNormals(2,0)


                
    //             var mesh2 = MeshBuilder.CreateBox("mesh2", { size: 1 }, scene);
    //             mesh2.position.y+=1 
    //             mesh2.useVertexColors = true;
    //             let boxVertCount = mesh2.getTotalVertices();
    //             let boxColors = []
    //             for (let i = 0; i < boxVertCount; i++) {
    //                 boxColors.push(0, 0, 1, 0);
    //             }
    //             mesh2.setVerticesData(VertexBuffer.ColorKind, boxColors);

    //             let vertexData2 = new VertexData()
    //             let oldPositions2=mesh2.getVerticesData(VertexBuffer.PositionKind)!
    //             let newPositions2 = []
    //             mesh2.computeWorldMatrix(true)
    //             let worldMatrix2=mesh2.getWorldMatrix()
    //             for (let i = 0; i < oldPositions2?.length; i+=3){
    //                 let worldPos = Vector3.TransformCoordinates(new Vector3(oldPositions2[i], oldPositions2[i+1], oldPositions2[i+2]), worldMatrix2)
    //                 newPositions2.push(worldPos.x,worldPos.y,worldPos.z)
    //             }

    //             vertexData2.positions = newPositions2
    //             // vertexData2.colors = mesh2.getVerticesData(VertexBuffer.ColorKind)
    //             vertexData2.indices = mesh2.getIndices()

    //             let x5_2 = new Mesh("x5_2", scene)
    //             vertexData2.applyToMesh(x5_2)
    //             x5_2.position.x+=5
    //             // let manifold_mesh2 = vertexData2mesh(vertexData2)
    //             // let mesh2Manifold=Manifold.ofMesh(manifold_mesh2)


    //             webworker.postMessage({
    //                 // serializedMatrix: worldMatrix1,
    //                 verticesData1: {
    //                     positions: vertexData1.positions,
    //                     indices:vertexData1.indices
    //                 },
    //                 verticesData2: {
    //                     positions: vertexData2.positions,
    //                     indices:vertexData2.indices
    //                 },
    //                 a:124
    //             })
    //             webworker.onmessage = function (evt) {
    //                 console.log('master reveived msg: ',evt.data)
    //             }


    //             // let resultManifold = meshManifold.subtract(mesh2Manifold);
    //             // let resultManifoldMesh = resultManifold.getMesh([0, 0, 1])
    //             // // resultManifoldMesh.merge()
    //             // let resultVertexData = mesh2vertexData(resultManifoldMesh)
    //             // let resultMesh = new Mesh("result",scene);
    //             // resultVertexData.applyToMesh(resultMesh)
    //             // resultMesh.position.z+=5
    //         })
    //     }
    // )
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