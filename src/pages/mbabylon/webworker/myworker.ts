/// <reference lib="webworker" />

import { VertexData, VertexBuffer, Vector3, MeshBuilder, Mesh } from '@babylonjs/core';
import Module,{Mesh as Manifold3dMeshType} from 'manifold-3d';
const wasm = await Module();
wasm.setup();
const { Manifold, Mesh: Manifold3dMesh } = wasm;


self.onmessage = async (ev) => {
    debugger
    const {verticesData1, verticesData2 } = ev.data;
    console.log(verticesData1, verticesData2);
    
    
    let vertexData11 = new VertexData()
    vertexData11.positions = verticesData1.positions
    vertexData11.indices = verticesData1.indices

    let manifold1 = vertexData2mesh(vertexData11)
    manifold1.merge()
    let meshManifold1 = Manifold.ofMesh(manifold1)
    meshManifold1.calculateNormals(2,0)


    let vertexData22 = new VertexData()
    vertexData22.positions = verticesData2.positions
    vertexData22.indices = verticesData2.indices

    let manifold2 = vertexData2mesh(vertexData22)
    manifold2.merge()
    let meshManifold2 = Manifold.ofMesh(manifold2)
    meshManifold2.calculateNormals(2,0)

    
    let resultManifold = meshManifold1.subtract(meshManifold2);
    let resultManifoldMesh = resultManifold.getMesh([0, 0, 1])
    // resultManifoldMesh.merge()
    let resultVertexData = mesh2vertexData(resultManifoldMesh)
};

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