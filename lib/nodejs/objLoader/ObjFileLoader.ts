import fs from "fs";
import { Vector2, Vector3, Color3, Color4, Tools, VertexData } from "@babylonjs/core";
import { Material, Document } from "@gltf-transform/core"
import { Matrix4 } from "@cesium/engine";
import { MTLFileLoader } from "./MtlFileLoader";
import path from "path";

export type Geometry = {
  name: string,
  document?: Document,
  extras?: Record<string, unknown>,

  worldPositions: Float64Array,
  worldNormals: Float32Array,

  indices: Uint16Array | Uint32Array,
  texcoords: Float32Array,
  material: Material,
  transformMatrixInv: Matrix4,

  minWorldPoint?: Vector3,
  maxWorldPoint?: Vector3,
}

export type GeometryInfo = {
  geometries: Geometry[],
  minPoint?: Vector3,
  maxPoint?: Vector3,
};

type Nullable<T> = T | null;
/**
 * Options for loading OBJ/MTL files
 */
type OBJLoadingOptions = {
  /**
   * Defines if UVs are optimized by default during load.
   * 定义在加载期间是否默认优化 UV。
   */
  optimizeWithUV: boolean;
  /**
   * Defines custom scaling of UV coordinates of loaded meshes.
   * 定义加载网格的 UV 坐标的自定义缩放。
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  UVScaling: Vector2;
  /**
   * Invert model on y-axis (does a model scaling inversion)
   *  在 y 轴上反转模型（执行模型缩放反转）
   */
  invertY: boolean;
  /**
   * Invert Y-Axis of referenced textures on load
   * 加载时反转引用纹理的 Y 轴
   */
  invertTextureY: boolean;
  /**
   * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
   * 在网格中包含某些 OBJ 文件中可用的顶点颜色。 这不是 OBJ 标准的一部分。
   */
  importVertexColors: boolean;
  /**
   * Compute the normals for the model, even if normals are present in the file.
   * 计算模型的法线，即使文件中存在法线。
   */
  computeNormals: boolean;
  /**
   * Optimize the normals for the model. Lighting can be uneven if you use OptimizeWithUV = true because new vertices can be created for the same location if they pertain to different faces.
   * Using OptimizehNormals = true will help smoothing the lighting by averaging the normals of those vertices.
   * 优化模型的法线。如果使用 OptimizeWithUV = true，则光照可能不均匀，因为如果新顶点与不同的面相关，则可以为同一位置创建新顶点。
   * 使用 OptimizehNormals = true 将通过平均这些顶点的法线来帮助平滑照明。
   */
  optimizeNormals: boolean;
  /**
   * Skip loading the materials even if defined in the OBJ file (materials are ignored).
   * 跳过加载材质，即使在 OBJ 文件中定义（忽略材质）。
   */
  skipMaterials: boolean;
  /**
   * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
   * 当素材加载失败时，OBJ 加载器会静默失败，并触发 onSuccess（） 回调。
   */
  // materialLoadingFailsSilently: boolean;
  /**
   * Loads assets without handedness conversions. This flag is for compatibility. Use it only if absolutely required. Defaults to false.
   * 加载资产，而不进行惯用手转换。此标志用于兼容性。仅在绝对需要时才使用它。默认为 false。
   */
  useLegacyBehavior: boolean;


  useRightHandedSystem: boolean,
  isLODModel: boolean,
};


/**
 * OBJ file type loader.
 * This is a babylon scene loader plugin.
 */
export class OBJFileLoader {

  /**
   * Defines if UVs are optimized by default during load.
   * 定义在加载期间是否默认优化 UV
   */
  public static OPTIMIZE_WITH_UV = true;
  /**
   * Invert model on y-axis (does a model scaling inversion)
   * 在 y 轴上反转模型（执行模型缩放反转）
   */
  public static INVERT_Y = false;

  /**
   * Invert Y-Axis of referenced textures on load
   * 加载时反转引用纹理的 Y 轴
   */
  public static get INVERT_TEXTURE_Y() {
    return MTLFileLoader.INVERT_TEXTURE_Y;
  }
  public static set INVERT_TEXTURE_Y(value: boolean) {
    MTLFileLoader.INVERT_TEXTURE_Y = value;
  }

  /**
   * Include in meshes the vertex colors available in some OBJ files.  This is not part of OBJ standard.
   * 在网格中包含某些 OBJ 文件中可用的顶点颜色。 这不是 OBJ 标准的一部分。
   */
  public static IMPORT_VERTEX_COLORS = false;
  /**
   * Compute the normals for the model, even if normals are present in the file.
   * 计算模型的法线，即使文件中存在法线
   */
  public static COMPUTE_NORMALS = false;
  /**
   * Optimize the normals for the model. Lighting can be uneven if you use OptimizeWithUV = true because new vertices can be created for the same location if they pertain to different faces.
   * Using OptimizehNormals = true will help smoothing the lighting by averaging the normals of those vertices.
   * 优化模型的法线。如果使用 OptimizeWithUV = true，则光照可能不均匀，因为如果新顶点与不同的面相关，则可以为同一位置创建新顶点。
   * 使用 OptimizehNormals = true 将通过平均这些顶点的法线来帮助平滑照明。
   */
  public static OPTIMIZE_NORMALS = false;
  /**
   * Defines custom scaling of UV coordinates of loaded meshes.
   * 定义加载网格的 UV 坐标的自定义缩放。
   */
  public static UV_SCALING = new Vector2(1, 1);
  /**
   * Skip loading the materials even if defined in the OBJ file (materials are ignored).
   * 跳过加载材质，即使在 OBJ 文件中定义（忽略材质）。
   */
  public static SKIP_MATERIALS = false;
  // /**
  //  * When a material fails to load OBJ loader will silently fail and onSuccess() callback will be triggered.
  //  * 当素材加载失败时，OBJ 加载器会静默失败，并触发 onSuccess（） 回调。
  //  * Defaults to true for backwards compatibility.
  //  * 默认为 true 以实现向后兼容性。
  //  */
  // public static MATERIAL_LOADING_FAILS_SILENTLY = true;
  /**
   * Loads assets without handedness conversions. This flag is for compatibility. Use it only if absolutely required. Defaults to false.
   * 加载资产，而不进行惯用手转换。此标志用于兼容性。仅在绝对需要时才使用它。默认为 false。
   */
  public static USE_LEGACY_BEHAVIOR = false;

  public static USE_RIGHT_HANDED_SYSTEM = false;
  public static IS_LOD_MODEL = true;

  private _loadingOptions: OBJLoadingOptions;
  private static get _DefaultLoadingOptions(): OBJLoadingOptions {
    return {
      computeNormals: OBJFileLoader.COMPUTE_NORMALS,
      optimizeNormals: OBJFileLoader.OPTIMIZE_NORMALS,
      importVertexColors: OBJFileLoader.IMPORT_VERTEX_COLORS,
      invertY: OBJFileLoader.INVERT_Y,
      invertTextureY: OBJFileLoader.INVERT_TEXTURE_Y,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      UVScaling: OBJFileLoader.UV_SCALING,
      // materialLoadingFailsSilently: OBJFileLoader.MATERIAL_LOADING_FAILS_SILENTLY,
      optimizeWithUV: OBJFileLoader.OPTIMIZE_WITH_UV,
      skipMaterials: OBJFileLoader.SKIP_MATERIALS,
      useLegacyBehavior: OBJFileLoader.USE_LEGACY_BEHAVIOR,

      useRightHandedSystem: OBJFileLoader.USE_RIGHT_HANDED_SYSTEM,
      isLODModel: OBJFileLoader.IS_LOD_MODEL
    };
  }

  /**
   * Creates loader for .OBJ files
   *
   * @param loadingOptions options for loading and parsing OBJ/MTL files.
   */
  constructor(loadingOptions?: OBJLoadingOptions) {
    this._loadingOptions = Object.assign(OBJFileLoader._DefaultLoadingOptions, loadingOptions);
  }

  // 读取 obj文件，并解析
  public async loadOBJ(srcFilePath: string): Promise<GeometryInfo> {
    const flieName = path.basename(srcFilePath);
    const dirName = path.dirname(srcFilePath); //root url
    const document = new Document();

    /* 解析 obj */
    const objStr = fs.readFileSync(srcFilePath, { encoding: "utf8" });
    const solidParser = new SolidParser(this._loadingOptions);
    let geometryInfo = solidParser.parse(dirName, objStr, document);
    return geometryInfo;
  }
}



type MeshObject = {
  name: string;
  indices: Nullable<Array<number>>;
  positions: Nullable<Array<number>>;
  normals: Nullable<Array<number>>;
  colors: Nullable<Array<number>>;
  uvs: Nullable<Array<number>>;
  materialName: string;
  directMaterial?: Nullable<Material>;
  isObject: boolean; // If the entity is defined as an object ("o"), or group ("g")
  _node?: Geometry;
  hasLines?: boolean; // If the mesh has lines
};

/**
 * Class used to load mesh data from OBJ content
 */
class SolidParser {
  // Descriptor
  /** Object descriptor */
  public static ObjectDescriptor = /^o/;
  /** Group descriptor */
  public static GroupDescriptor = /^g/;
  /** Material lib descriptor */
  public static MtlLibGroupDescriptor = /^mtllib /;
  /** Use a material descriptor */
  public static UseMtlDescriptor = /^usemtl /;
  /** Smooth descriptor */
  public static SmoothDescriptor = /^s /;


  // Patterns
  /** Pattern used to detect a vertex */
  public static VertexPattern = /^v(\s+[\d|.|+|\-|e|E]+){3,7}/;
  /** Pattern used to detect a normal */
  public static NormalPattern = /^vn(\s+[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)/;
  /** Pattern used to detect a UV set */
  public static UVPattern = /^vt(\s+[\d|.|+|\-|e|E]+)( +[\d|.|+|\-|e|E]+)/;

  // vertex
  /** Pattern used to detect a first kind of face (f vertex vertex vertex) */
  public static FacePattern1 = /^f\s+(([\d]{1,}[\s]?){3,})+/;
  // vertex/uvs
  /** Pattern used to detect a second kind of face (f vertex/uvs vertex/uvs vertex/uvs) */
  public static FacePattern2 = /^f\s+((([\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
  // vertex/uvs/normal
  /** Pattern used to detect a third kind of face (f vertex/uvs/normal vertex/uvs/normal vertex/uvs/normal) */
  public static FacePattern3 = /^f\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){3,})+)/;
  // vertex//normal
  /** Pattern used to detect a fourth kind of face (f vertex//normal vertex//normal vertex//normal)*/
  public static FacePattern4 = /^f\s+((([\d]{1,}\/\/[\d]{1,}[\s]?){3,})+)/;
  // -vertex/-uvs/-normal
  /** Pattern used to detect a fifth kind of face (f -vertex/-uvs/-normal -vertex/-uvs/-normal -vertex/-uvs/-normal) */
  public static FacePattern5 = /^f\s+(((-[\d]{1,}\/-[\d]{1,}\/-[\d]{1,}[\s]?){3,})+)/;

  /** Pattern used to detect a line(l vertex vertex) */
  public static LinePattern1 = /^l\s+(([\d]{1,}[\s]?){2,})+/;
  /** Pattern used to detect a second kind of line (l vertex/uvs vertex/uvs) */
  public static LinePattern2 = /^l\s+((([\d]{1,}\/[\d]{1,}[\s]?){2,})+)/;
  /** Pattern used to detect a third kind of line (l vertex/uvs/normal vertex/uvs/normal) */
  public static LinePattern3 = /^l\s+((([\d]{1,}\/[\d]{1,}\/[\d]{1,}[\s]?){2,})+)/;




  private _handledMesh: MeshObject; //The current mesh of meshes array
  private _curPositionInIndices = 0;
  private _hasMeshes: Boolean = false; //Meshes are defined in the file
  private _materialNameFromObj: string = ""; //The name of the current material

  private _isFirstMaterial: boolean = true;
  private _grayColor = new Color4(0.5, 0.5, 0.5, 1);


  private _objMeshName: string = ""; //The name of the current obj mesh
  private _increment: number = 1; //Id for meshes created by the multimaterial


  private _loadingOptions: OBJLoadingOptions;
  /**
   * Creates a new SolidParser
   * @param materialToUse defines the array to fill with the list of materials to use (it will be filled by the parse function)
   * @param babylonMeshesArray defines the array to fill with the list of loaded meshes (it will be filled by the parse function)
   * @param loadingOptions defines the loading options to use
   */
  public constructor(loadingOptions: OBJLoadingOptions) {
    this._loadingOptions = loadingOptions;
  }


  private _pushTriangle: (faces: Array<string>, faceIndex: number) => void; //TODO
  private _handednessSign: number;

  private _hasLineData: boolean = false; //If this mesh has line segment(l) data

  //Create a tuple with indice of Position, Normal, UV  [pos, norm, uvs]
  private _tuplePosNorm: Array<{ idx: Array<number>; normals: Array<number>; uv: Array<number> }> = [];
  private _positions: Array<Vector3> = []; //values for the positions of vertices
  private _colors: Array<Color4> = [];
  private _normals: Array<Vector3> = []; //Values for the normals
  private _uvs: Array<Vector2> = []; //Values for the textures

  private _wrappedPositionForBabylon: Array<Vector3> = []; //The list of position in vectors
  private _wrappedColorsForBabylon: Array<Color4> = []; // Array with all color values to match with the indices
  private _wrappedUvsForBabylon: Array<Vector2> = []; //Array with all value of uvs to match with the indices
  private _wrappedNormalsForBabylon: Array<Vector3> = []; //Array with all value of normals to match with the indices

  private _indicesForBabylon: Array<number> = []; //The list of indices for VertexData

  private _unwrappedPositionsForBabylon: Array<number> = []; //Value of positionForBabylon w/o Vector3() [x,y,z]
  private _unwrappedColorsForBabylon: Array<number> = []; // Value of colorForBabylon w/o Color4() [r,g,b,a]
  private _unwrappedNormalsForBabylon: Array<number> = []; //Value of normalsForBabylon w/o Vector3()  [x,y,z]
  private _unwrappedUVForBabylon: Array<number> = []; //Value of uvsForBabylon w/o Vector3()      [x,y,z]




  // indices
  private _triangles: Array<string> = []; // Indices from new triangles coming from polygons // TODO
  private _extColors: Array<Color4> = []; //Extension color


  // output
  private _meshesFromObj: Array<MeshObject> = []; //[mesh] Contains all the obj meshes
  private _materials: Array<Material> = [];


  private static _IsLineElement(line: string) {
    return line.startsWith("l"); //l 线(Line)
  }

  private static _IsObjectElement(line: string) {
    return line.startsWith("o"); //o 对象名称(Object name)
  }

  private static _IsGroupElement(line: string) {
    return line.startsWith("g"); //g组名称(Group name)
  }

  /**
   * Function used to parse an OBJ string
   * @param data defines the OBJ string
   * @param document 
   * @param onFileToLoadFound defines a callback that will be called if a MTL file is found
   */
  public async parse(rootUrl: string, data: string, document: Document): Promise<GeometryInfo> {
    //Move Santitize here to forbid delete zbrush data
    // Sanitize data 清理数据
    data = data.replace(/#MRGB/g, "mrgb");
    data = data.replace(/#.*$/gm, "").trim();//删除注释

    if (this._loadingOptions.useLegacyBehavior) {
      this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
      this._handednessSign = 1;
    } else if (this._loadingOptions.useRightHandedSystem) {
      this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex + 1], faces[faceIndex]);
      this._handednessSign = 1;
    } else {
      this._pushTriangle = (faces, faceIndex) => this._triangles.push(faces[0], faces[faceIndex], faces[faceIndex + 1]);
      this._handednessSign = -1;
    }

    // 分组
    // Split the file into lines
    // Preprocess line data
    const linesOBJ = data.split("\n");
    const lineLines: string[][] = [];
    let currentGroup: string[] = [];
    lineLines.push(currentGroup);
    for (let i = 0; i < linesOBJ.length; i++) {
      const line = linesOBJ[i].trim().replace(/\s\s/g, " ");
      // Comment or newLine
      if (line.length === 0 || line.charAt(0) === "#") {
        continue;
      }
      if (SolidParser._IsGroupElement(line) || SolidParser._IsObjectElement(line)) {
        currentGroup = [];
        lineLines.push(currentGroup);
      }

      if (SolidParser._IsLineElement(line)) {
        const lineValues = line.split(" ");
        // create line elements with two vertices only
        for (let i = 1; i < lineValues.length - 1; i++) {
          currentGroup.push(`l ${lineValues[i]} ${lineValues[i + 1]}`);
        }
      } else {
        currentGroup.push(line);
      }
    }
    const lines = lineLines.flat();

    // 解析，组装
    // Look at each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim().replace(/\s\s/g, " ");
      // Comment or newLine
      if (line.length === 0 || line.charAt(0) === "#") {
        continue;
      }
      let result;
      if (SolidParser.VertexPattern.test(line)) {
        //Get information about one position possible for the vertices
        result = line.match(/[^ ]+/g)!; // match will return non-null due to passing regex pattern
        //顶点 position
        // Value of result with line: "v 1.0 2.0 3.0"
        // ["v", "1.0", "2.0", "3.0"]
        // Create a Vector3 with the position x, y, z
        this._positions.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3]))); //TODO
        // 顶点颜色 非标准
        if (this._loadingOptions.importVertexColors) {
          if (result.length >= 7) {
            const r = parseFloat(result[4]);
            const g = parseFloat(result[5]);
            const b = parseFloat(result[6]);
            this._colors.push(
              new Color4(r > 1 ? r / 255 : r, g > 1 ? g / 255 : g, b > 1 ? b / 255 : b, result.length === 7 || result[7] === undefined ? 1 : parseFloat(result[7]))
            );
          } else {
            // TODO: maybe push NULL and if all are NULL to skip (and remove grayColor var).
            this._colors.push(this._grayColor);
          }
        }
      } else if ((result = SolidParser.NormalPattern.exec(line)) !== null) {
        //Create a Vector3 with the normals x, y, z
        //Value of result
        // ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]
        //Add the Vector in the list of normals
        this._normals.push(new Vector3(parseFloat(result[1]), parseFloat(result[2]), parseFloat(result[3])));
      } else if ((result = SolidParser.UVPattern.exec(line)) !== null) {
        //Create a Vector2 with the normals u, v
        //Value of result
        // ["vt 0.1 0.2 0.3", "0.1", "0.2"]
        //Add the Vector in the list of uvs
        this._uvs.push(new Vector2(parseFloat(result[1]) * this._loadingOptions.UVScaling.x, parseFloat(result[2]) * this._loadingOptions.UVScaling.y));

        //Identify patterns of faces
        //Face could be defined in different type of pattern
      } else if ((result = SolidParser.FacePattern3.exec(line)) !== null) {
        //Value of result:
        // vertex / uvs / normal
        //["f 1/1/1 2/2/2 3/3/3", "1/1/1 2/2/2 3/3/3"...]
        //Set the data for this face
        //result[1].trim().split(" "): ["1/1/1", "2/2/2", "3/3/3"]
        this._setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), 1);
      } else if ((result = SolidParser.FacePattern4.exec(line)) !== null) {
        //Value of result:
        // vertex//normal
        //["f 1//1 2//2 3//3", "1//1 2//2 3//3"...]
        //Set the data for this face
        //result[1].trim().split(" "): ["1//1", "2//2", "3//3"]
        this._setDataForCurrentFaceWithPattern4(result[1].trim().split(" "), 1);
      } else if ((result = SolidParser.FacePattern5.exec(line)) !== null) {
        //Value of result:
        // -vertex/-uvs/-normal
        //["f -1/-1/-1 -2/-2/-2 -3/-3/-3", "-1/-1/-1 -2/-2/-2 -3/-3/-3"...]
        //Set the data for this face
        //result[1].trim().split(" "):  ["-1/-1/-1", "-2/-2/-2", "-3/-3/-3"]
        this._setDataForCurrentFaceWithPattern5(result[1].trim().split(" "), 1);
      } else if ((result = SolidParser.FacePattern2.exec(line)) !== null) {
        //Value of result:
        // vertex/uvs
        //["f 1/1 2/2 3/3", "1/1 2/2 3/3"...]
        //Set the data for this face
        //result[1].trim().split(" "): ["1/1", "2/2", "3/3"]
        this._setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), 1);
      } else if ((result = SolidParser.FacePattern1.exec(line)) !== null) {
        //Value of result
        // vertex
        //["f 1 2 3", "1 2 3"...]
        //Set the data for this face
        //result[1].trim().split(" "): ["1", "2", "3"]
        this._setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), 1);

      } else if ((result = SolidParser.LinePattern1.exec(line)) !== null) {
        //Value of result
        //["l 1 2"]
        //Set the data for this face
        //result[1].trim().split(" "): ["1", "2"]
        this._setDataForCurrentFaceWithPattern1(result[1].trim().split(" "), 0);
        this._hasLineData = true;
      } else if ((result = SolidParser.LinePattern2.exec(line)) !== null) {
        //Value of result
        //["l 1/1 2/2"]
        //Set the data for this face
        //result[1].trim().split(" "): ["1/1", "2/2"]
        this._setDataForCurrentFaceWithPattern2(result[1].trim().split(" "), 0);
        this._hasLineData = true;
      } else if ((result = SolidParser.LinePattern3.exec(line)) !== null) {
        //Value of result
        //["l 1/1/1 2/2/2"]
        //Set the data for this face
        //result[1].trim().split(" "): ["1/1/1", "2/2/2"]
        this._setDataForCurrentFaceWithPattern3(result[1].trim().split(" "), 0);
        this._hasLineData = true;
      } else if ((result = SolidParser._GetZbrushMRGB(line, !this._loadingOptions.importVertexColors))) {// Define a mesh or an object
        // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
        result.forEach((element) => { this._extColors.push(element); });
      } else if (SolidParser.GroupDescriptor.test(line) || SolidParser.ObjectDescriptor.test(line)) {// Define a mesh or an object
        // Each time this keyword is analyzed, create a new Object with all data for creating a babylonMesh
        // Create a new mesh corresponding to the name of the group.
        // Definition of the mesh
        this._objMeshName = line.substring(2).trim();
        const objMesh: MeshObject = {
          name: line.substring(2).trim(), //Set the name of the current obj mesh
          indices: null,
          positions: null,
          normals: null,
          uvs: null,
          colors: null,
          materialName: this._materialNameFromObj,
          isObject: SolidParser.ObjectDescriptor.test(line),
        };
        this._addPreviousObjMesh();

        //Push the last mesh created with only the name
        this._meshesFromObj.push(objMesh);

        //Set this variable to indicate that now meshesFromObj has objects defined inside
        this._hasMeshes = true;
        this._isFirstMaterial = true;
        this._increment = 1;
      } else if (SolidParser.UseMtlDescriptor.test(line)) { //Keyword for applying a material
        //Get the name of the material
        this._materialNameFromObj = line.substring(7).trim();
        //If this new material is in the same mesh
        if (!this._isFirstMaterial || !this._hasMeshes) {
          //Set the data for the previous mesh
          this._addPreviousObjMesh();
          //Create a new mesh
          const objMesh: MeshObject = {
            name: ((this._objMeshName || this._materialNameFromObj) || "mesh") + "_mm" + this._increment.toString(), //Set the name of the current obj mesh
            indices: null,
            positions: null,
            normals: null,
            uvs: null,
            colors: null,
            materialName: this._materialNameFromObj,
            isObject: false,
          };
          this._increment++;
          //If meshes are already defined
          this._meshesFromObj.push(objMesh);
          this._hasMeshes = true;
        }
        //Set the material name if the previous line define a mesh
        if (this._hasMeshes && this._isFirstMaterial) {
          //Set the material name to the previous mesh (1 material per mesh)
          this._meshesFromObj[this._meshesFromObj.length - 1].materialName = this._materialNameFromObj;
          this._isFirstMaterial = false;
        }
      } else if (SolidParser.MtlLibGroupDescriptor.test(line)) {// Keyword for loading the mtl file
        // Get the name of mtl file
        // onFileToLoadFound(line.substring(7).trim());  
        let fileToLoad = line.substring(7).trim(); //TODO 读取并解析材质
        if (fileToLoad !== "" && !this._loadingOptions.skipMaterials) {
          const materialsFromMTLFile: MTLFileLoader = new MTLFileLoader();
          this._materials = await materialsFromMTLFile.loadMTL(path.join(rootUrl, fileToLoad), document);
        }
      } else if (SolidParser.SmoothDescriptor.test(line)) {// Apply smoothing
        // smooth shading => apply smoothing
        // Today I don't know it work with babylon and with obj.
        // With the obj file  an integer is set
      } else {
        //If there is another possibility
        console.warn("Unhandled expression at line : " + line);
      }
    }
    // At the end of the file, add the last mesh into the meshesFromObj array
    // 和 _addPreviousObjMesh() 函数类似，但是不能直接调用_addPreviousObjMesh()
    if (this._hasMeshes) {
      // Set the data for the last mesh
      this._handledMesh = this._meshesFromObj[this._meshesFromObj.length - 1];
      if (this._loadingOptions.useLegacyBehavior) {
        //Reverse indices for displaying faces in the good sense
        this._indicesForBabylon.reverse();
      }
      //Get the good array
      this._unwrapData();
      //Set array
      this._handledMesh.indices = this._indicesForBabylon;
      this._handledMesh.positions = this._unwrappedPositionsForBabylon;
      this._handledMesh.normals = this._unwrappedNormalsForBabylon;
      this._handledMesh.uvs = this._unwrappedUVForBabylon;
      this._handledMesh.hasLines = this._hasLineData;
      if (this._loadingOptions.importVertexColors) {
        this._handledMesh.colors = this._unwrappedColorsForBabylon;
      }
    }


    // If any o or g keyword not found, create a mesh with a random id
    if (!this._hasMeshes) {
      let newMaterial: Nullable<Material> = null;
      if (this._indicesForBabylon.length) {
        if (this._loadingOptions.useLegacyBehavior) {
          // reverse tab of indices
          this._indicesForBabylon.reverse();
        }
        //Get positions normals uvs
        this._unwrapData();
      } else {
        // There is no indices in the file. We will have to switch to point cloud rendering
        //  文件中没有索引。我们将不得不切换到点云渲染
        for (const pos of this._positions) {
          this._unwrappedPositionsForBabylon.push(pos.x, pos.y, pos.z);
        }

        if (this._normals.length) {
          for (const normal of this._normals) {
            this._unwrappedNormalsForBabylon.push(normal.x, normal.y, normal.z);
          }
        }

        if (this._uvs.length) {
          for (const uv of this._uvs) {
            this._unwrappedUVForBabylon.push(uv.x, uv.y);
          }
        }

        if (this._extColors.length) {
          for (const color of this._extColors) {
            this._unwrappedColorsForBabylon.push(color.r, color.g, color.b, color.a);
          }
        } else {
          if (this._colors.length) {
            for (const color of this._colors) {
              this._unwrappedColorsForBabylon.push(color.r, color.g, color.b, color.a);
            }
          }
        }

        if (!this._materialNameFromObj) {
          // Create a material with point cloud on
          newMaterial = document.createMaterial('material_' + Tools.RandomId());
          // newMaterial.pointsCloud = true; //TODO
          this._materialNameFromObj = newMaterial.getName();
          if (!this._normals.length) {
            // newMaterial.disableLighting = true; //TODO
            // newMaterial.emissiveColor = Color3.White();
            newMaterial.setEmissiveFactor([Color3.White().r, Color3.White().g, Color3.White().b]);
          }
        }
      }

      //Set data for one mesh
      this._meshesFromObj.push({
        name: "mesh_" + Tools.RandomId(),
        indices: this._indicesForBabylon,
        positions: this._unwrappedPositionsForBabylon,
        colors: this._unwrappedColorsForBabylon,
        normals: this._unwrappedNormalsForBabylon,
        uvs: this._unwrappedUVForBabylon,
        materialName: this._materialNameFromObj,
        directMaterial: newMaterial,
        isObject: true,
        hasLines: this._hasLineData,
      });
    }

    return this.toGeometryInfo(document);
  }

  private toGeometryInfo(document: Document): GeometryInfo {
    const geometryInfo: GeometryInfo = {
      geometries: [],
    }
    // LOD mode
    const minPoint = new Vector3(Infinity, Infinity, Infinity);
    const maxPoint = new Vector3(-Infinity, -Infinity, -Infinity);
    //Set data for each mesh
    for (let j = 0; j < this._meshesFromObj.length; j++) {
      //Get the current mesh
      //Set the data with VertexBuffer for each mesh
      this._handledMesh = this._meshesFromObj[j];
      if (this._handledMesh.positions?.length === 0) {
        continue
      }
      //Create a Mesh with the name of the obj mesh
      const geometry: Geometry = {
        name: "",
        document: document,
        worldPositions: null,
        worldNormals: null,
        indices: null,
        texcoords: null,
        material: null,
        transformMatrixInv: Matrix4.IDENTITY,
        extras: {}
      }
      // LOD mode
      const minWorldPoint = new Vector3(Infinity, Infinity, Infinity);
      const maxWorldPoint = new Vector3(-Infinity, -Infinity, -Infinity);
      this._handledMesh._node = geometry;
      geometry.name = this._handledMesh.name;

      // If this is a group mesh, it should have an object mesh as a parent. So look for the first object mesh that appears before it.
      // if (!this._handledMesh.isObject) {
      //     for (let k = j - 1; k >= 0; --k) {
      //         if (this._meshesFromObj[k].isObject && this._meshesFromObj[k]._node) {
      //             nodeTransformNode.parent = this._meshesFromObj[k]._node!;
      //             this._meshesFromObj[k]._node.children.push(nodeTransformNode);
      //             break;
      //         }
      //     }
      // }


      //Push the name of the material to an array
      //This is indispensable for the importMesh function
      // this._materialToUse.push(this._meshesFromObj[j].materialName);

      //If the mesh is a line mesh
      if (this._handledMesh.hasLines) {
        // babylonMesh._internalMetadata ??= {};
        // babylonMesh._internalMetadata["_isLine"] = true; //this is a line mesh
        geometry.extras["_isLine"] = true;
      }

      // if (this._handledMesh.positions?.length === 0) {
      //     //Push the mesh into an array
      //     this._babylonMeshesArray.push(babylonMesh);
      //     continue;
      // }

      const vertexData: VertexData = new VertexData(); //The container for the values
      //Set the data for the babylonMesh
      vertexData.uvs = this._handledMesh.uvs;
      vertexData.indices = this._handledMesh.indices;
      vertexData.positions = this._handledMesh.positions;
      if (this._loadingOptions.computeNormals) {
        const normals: Array<number> = new Array<number>();
        VertexData.ComputeNormals(this._handledMesh.positions, this._handledMesh.indices, normals);
        vertexData.normals = normals;
      } else {
        vertexData.normals = this._handledMesh.normals;
      }
      if (this._loadingOptions.importVertexColors) {
        vertexData.colors = this._handledMesh.colors;
      }

      //Set the data from the VertexBuffer to the current Mesh
      if (vertexData.positions) {
        geometry.worldPositions = new Float64Array(vertexData.positions);
      }
      if (vertexData.normals) {
        geometry.worldNormals = new Float32Array(vertexData.normals);
      }
      if (vertexData.uvs) {
        geometry.texcoords = new Float32Array(vertexData.uvs);
      }
      geometry.indices = new Uint32Array(vertexData.indices);
      // if (vertexData.colors) {
      //     geometry.colors = new Float32Array(vertexData.colors);
      // }


      if (this._loadingOptions.invertY) {
        // nodeTransformNode.scale.y *= -1;

        for (let y = 0; y < geometry.worldPositions.length; y += 3) {
          geometry.worldPositions[y + 1] = geometry.worldPositions[y + 1] * -1;
        }
        // FIXME:法线要不要在 y 轴上反转
        for (let y = 0; y < geometry.worldNormals.length; y += 3) {
          geometry.worldNormals[y + 1] = geometry.worldNormals[y + 1] * -1;
        }
      }

      if (this._loadingOptions.optimizeNormals) {
        this._optimizeNormals(geometry);
        // this._optimizeNormals(babylonMesh);
      }

      //Push the mesh into an array
      // this._babylonMeshesArray.push(babylonMesh);

      if (this._loadingOptions.isLODModel) {
        const vertexCount = geometry.worldPositions.length / 3;
        let positions = geometry.worldPositions;
        for (let i = 0; i < vertexCount; i++) {
          // LOD mode
          let worldPositionVector3 = new Vector3(positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
          minPoint.minimizeInPlace(worldPositionVector3);
          maxPoint.maximizeInPlace(worldPositionVector3);
          minWorldPoint.minimizeInPlace(worldPositionVector3);
          maxWorldPoint.maximizeInPlace(worldPositionVector3);
        }
        geometry.minWorldPoint = minWorldPoint;
        geometry.maxWorldPoint = maxWorldPoint;
      }

      if (this._handledMesh.directMaterial) {
        geometry.material = this._handledMesh.directMaterial;
      } else {
        for (let item of this._materials) {
          if (item.getName() === this._handledMesh.materialName) {
            geometry.material = item;
          }
        }
      }
      geometryInfo.geometries.push(geometry);
    }
    if (this._loadingOptions.isLODModel) {
      geometryInfo.minPoint = minPoint;
      geometryInfo.maxPoint = maxPoint;
    }
    return geometryInfo;
  }

  private _optimizeNormals(geometry: Geometry): void {
    const positions = geometry.worldPositions;
    const normals = geometry.worldNormals;
    const mapVertices: { [key: string]: number[] } = {};
    if (!positions || !normals) {
      return;
    }
    for (let i = 0; i < positions.length / 3; i++) {
      const x = positions[i * 3 + 0];
      const y = positions[i * 3 + 1];
      const z = positions[i * 3 + 2];
      const key = x + "_" + y + "_" + z;

      let lst = mapVertices[key];
      if (!lst) {
        lst = [];
        mapVertices[key] = lst;
      }
      lst.push(i);
    }
    const normal = new Vector3();
    for (const key in mapVertices) {
      const lst = mapVertices[key];
      if (lst.length < 2) {
        continue;
      }
      const v0Idx = lst[0];
      for (let i = 1; i < lst.length; ++i) {
        const vIdx = lst[i];
        normals[v0Idx * 3 + 0] += normals[vIdx * 3 + 0];
        normals[v0Idx * 3 + 1] += normals[vIdx * 3 + 1];
        normals[v0Idx * 3 + 2] += normals[vIdx * 3 + 2];
      }
      normal.copyFromFloats(normals[v0Idx * 3 + 0], normals[v0Idx * 3 + 1], normals[v0Idx * 3 + 2]);
      normal.normalize();
      for (let i = 0; i < lst.length; ++i) {
        const vIdx = lst[i];
        normals[vIdx * 3 + 0] = normal.x;
        normals[vIdx * 3 + 1] = normal.y;
        normals[vIdx * 3 + 2] = normal.z;
      }
    }
    geometry.worldNormals = normals;
  }




  /**
   * To get color between color and extension color
   * @param index Integer The index of the element in the array
   * @returns value of target color
   */
  private _getColor(index: number) {
    if (this._loadingOptions.importVertexColors) {
      return this._extColors[index] ?? this._colors[index];
    } else {
      return undefined;
    }
  }

  /**
   * Create triangles from polygons
   * It is important to notice that a triangle is a polygon
   * We get 5 patterns of face defined in OBJ File :
   * facePattern1 = ["1","2","3","4","5","6"]
   * facePattern2 = ["1/1","2/2","3/3","4/4","5/5","6/6"]
   * facePattern3 = ["1/1/1","2/2/2","3/3/3","4/4/4","5/5/5","6/6/6"]
   * facePattern4 = ["1//1","2//2","3//3","4//4","5//5","6//6"]
   * facePattern5 = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-4/-4/-4","-5/-5/-5","-6/-6/-6"]
   * Each pattern is divided by the same method
   * @param faces Array[String] The indices of elements
   * @param v Integer The variable to increment
   */
  private _getTriangles(faces: Array<string>, v: number) {
    //Work for each element of the array
    for (let faceIndex = v; faceIndex < faces.length - 1; faceIndex++) {
      //Add on the triangle variable the indexes to obtain triangles
      this._pushTriangle(faces, faceIndex);
    }
    //Result obtained after 2 iterations:
    //Pattern1 => triangle = ["1","2","3","1","3","4"];
    //Pattern2 => triangle = ["1/1","2/2","3/3","1/1","3/3","4/4"];
    //Pattern3 => triangle = ["1/1/1","2/2/2","3/3/3","1/1/1","3/3/3","4/4/4"];
    //Pattern4 => triangle = ["1//1","2//2","3//3","1//1","3//3","4//4"];
    //Pattern5 => triangle = ["-1/-1/-1","-2/-2/-2","-3/-3/-3","-1/-1/-1","-3/-3/-3","-4/-4/-4"];
  }

  /**
   * Create triangles and push the data for each polygon for the pattern 1
   * In this pattern we get vertice positions
   * @param face
   * @param v
   */
  private _setDataForCurrentFaceWithPattern1(face: Array<string>, v: number) {
    //Get the indices of triangles for each polygon
    this._getTriangles(face, v);
    //For each element in the triangles array.
    //This var could contains 1 to an infinity of triangles
    for (let k = 0; k < this._triangles.length; k++) {
      // Set position indice
      const indicePositionFromObj = parseInt(this._triangles[k]) - 1;  // 从 0 开始

      this._setData(
        indicePositionFromObj, 0, 0, // In the pattern 1, normals and uvs are not defined
        this._positions[indicePositionFromObj], // Get the vectors data
        Vector2.Zero(),
        Vector3.Up(), // Create default vectors
        this._getColor(indicePositionFromObj)
      );
    }
    //Reset variable for the next line
    this._triangles.length = 0;
  }

  /**
   * Create triangles and push the data for each polygon for the pattern 2
   * In this pattern we get vertice positions and uvs
   * @param face
   * @param v
   */
  private _setDataForCurrentFaceWithPattern2(face: Array<string>, v: number) {
    //Get the indices of triangles for each polygon
    this._getTriangles(face, v);
    for (let k = 0; k < this._triangles.length; k++) {
      //triangle[k] = "1/1"
      //Split the data for getting position and uv
      const point = this._triangles[k].split("/"); // ["1", "1"]
      //Set position indice
      const indicePositionFromObj = parseInt(point[0]) - 1;
      //Set uv indice
      const indiceUvsFromObj = parseInt(point[1]) - 1;

      this._setData(
        indicePositionFromObj, indiceUvsFromObj, 0, //Default value for normals
        this._positions[indicePositionFromObj], //Get the values for each element
        this._uvs[indiceUvsFromObj] ?? Vector2.Zero(),
        Vector3.Up(), //Default value for normals
        this._getColor(indicePositionFromObj)
      );
    }

    //Reset variable for the next line
    this._triangles.length = 0;
  }

  /**
   * Create triangles and push the data for each polygon for the pattern 3
   * In this pattern we get vertice positions, uvs and normals
   * @param face
   * @param v
   */
  private _setDataForCurrentFaceWithPattern3(face: Array<string>, v: number) {
    //Get the indices of triangles for each polygon
    this._getTriangles(face, v);

    for (let k = 0; k < this._triangles.length; k++) {
      //triangle[k] = "1/1/1"
      //Split the data for getting position, uv, and normals
      const point = this._triangles[k].split("/"); // ["1", "1", "1"]
      // Set position indice
      const indicePositionFromObj = parseInt(point[0]) - 1;
      // Set uv indice
      const indiceUvsFromObj = parseInt(point[1]) - 1;
      // Set normal indice
      const indiceNormalFromObj = parseInt(point[2]) - 1;

      this._setData(
        indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj,
        this._positions[indicePositionFromObj],
        this._uvs[indiceUvsFromObj] ?? Vector2.Zero(),
        this._normals[indiceNormalFromObj] ?? Vector3.Up() //Set the vector for each component
      );
    }
    //Reset variable for the next line
    this._triangles.length = 0;
  }

  /**
   * Create triangles and push the data for each polygon for the pattern 4
   * In this pattern we get vertice positions and normals
   * @param face
   * @param v
   */
  private _setDataForCurrentFaceWithPattern4(face: Array<string>, v: number) {
    this._getTriangles(face, v);

    for (let k = 0; k < this._triangles.length; k++) {
      //triangle[k] = "1//1"
      //Split the data for getting position and normals
      const point = this._triangles[k].split("//"); // ["1", "1"]
      // We check indices, and normals
      const indicePositionFromObj = parseInt(point[0]) - 1;
      const indiceNormalFromObj = parseInt(point[1]) - 1;

      this._setData(
        indicePositionFromObj, 1, //Default value for uv
        indiceNormalFromObj,
        this._positions[indicePositionFromObj], //Get each vector of data
        Vector2.Zero(),
        this._normals[indiceNormalFromObj],
        this._getColor(indicePositionFromObj)
      );
    }
    //Reset variable for the next line
    this._triangles.length = 0;
  }

  /*
   * Create triangles and push the data for each polygon for the pattern 3
   * In this pattern we get vertice positions, uvs and normals
   * @param face
   * @param v
   */
  private _setDataForCurrentFaceWithPattern5(face: Array<string>, v: number) {
    //Get the indices of triangles for each polygon
    this._getTriangles(face, v);

    for (let k = 0; k < this._triangles.length; k++) {
      //triangle[k] = "-1/-1/-1"
      //Split the data for getting position, uv, and normals
      const point = this._triangles[k].split("/"); // ["-1", "-1", "-1"]
      // Set position indice
      const indicePositionFromObj = this._positions.length + parseInt(point[0]);
      // Set uv indice
      const indiceUvsFromObj = this._uvs.length + parseInt(point[1]);
      // Set normal indice
      const indiceNormalFromObj = this._normals.length + parseInt(point[2]);

      this._setData(
        indicePositionFromObj, indiceUvsFromObj, indiceNormalFromObj,
        this._positions[indicePositionFromObj],
        this._uvs[indiceUvsFromObj],
        this._normals[indiceNormalFromObj], //Set the vector for each component
        this._getColor(indicePositionFromObj)
      );
    }
    //Reset variable for the next line
    this._triangles.length = 0;
  }


  /**
   * Search for obj in the given array.
   * This function is called to check if a couple of data already exists in an array.
   *
   * If found, returns the index of the founded tuple index. Returns -1 if not found
   * @param arr Array<{ normals: Array<number>, idx: Array<number> }>
   * @param obj Array<number>
   * @returns {boolean}
   */
  private _isInArray(arr: Array<{ normals: Array<number>; idx: Array<number> }>, obj: Array<number>) {
    //indicePosition
    if (!arr[obj[0]]) {
      arr[obj[0]] = { idx: [], normals: [] };
    }
    // indiceNormal
    const idx = arr[obj[0]].normals.indexOf(obj[1]);

    return idx === -1 ? -1 : arr[obj[0]].idx[idx];
  }

  private _isInArrayUV(arr: Array<{ normals: Array<number>; idx: Array<number>; uv: Array<number> }>, obj: Array<number>) {
    //indicePosition indiceNormal indiceUvs
    if (!arr[obj[0]]) {
      arr[obj[0]] = { idx: [], normals: [], uv: [] };
    }
    // indiceNormal
    const idx = arr[obj[0]].normals.indexOf(obj[1]);
    // indiceUvs
    if (idx != 1 && obj[2] === arr[obj[0]].uv[idx]) {
      return arr[obj[0]].idx[idx];
    }
    return -1;
  }
  /**
   * This function set the data for each triangle.
   * Data are position, normals and uvs
   * If a tuple of (position, normal) is not set, add the data into the corresponding array
   * If the tuple already exist, add only their indice
   *
   * @param indicePositionFromObj Integer The index in positions array
   * @param indiceUvsFromObj Integer The index in uvs array
   * @param indiceNormalFromObj Integer The index in normals array
   * @param positionVectorFromOBJ Vector3 The value of position at index objIndice
   * @param textureVectorFromOBJ Vector3 The value of uvs
   * @param normalsVectorFromOBJ Vector3 The value of normals at index objNormale
   * @param positionColorsFromOBJ
   */
  private _setData(
    indicePositionFromObj: number, indiceUvsFromObj: number, indiceNormalFromObj: number,
    positionVectorFromOBJ: Vector3, uvVectorFromOBJ: Vector2, normalsVectorFromOBJ: Vector3,
    positionColorsFromOBJ?: Color4
  ) {
    //Check if this tuple already exists in the list of tuples
    let _index: number;
    if (this._loadingOptions.optimizeWithUV) {
      _index = this._isInArrayUV(this._tuplePosNorm, [indicePositionFromObj, indiceNormalFromObj, indiceUvsFromObj]);
    } else {
      _index = this._isInArray(this._tuplePosNorm, [indicePositionFromObj, indiceNormalFromObj]);
    }

    //If it not exists
    if (_index === -1) {
      //Add an new indice.
      //The array of indices is only an array with his length equal to the number of triangles - 1.
      //We add vertices data in this order
      this._indicesForBabylon.push(this._wrappedPositionForBabylon.length);

      /* position uv  normal*/
      //Push the position of vertice for Babylon
      //Each element is a Vector3(x,y,z)
      this._wrappedPositionForBabylon.push(positionVectorFromOBJ);
      if (positionColorsFromOBJ !== undefined) {
        //Push the colors for Babylon
        //Each element is a BABYLON.Color4(r,g,b,a)
        this._wrappedColorsForBabylon.push(positionColorsFromOBJ);
      }
      //Push the uvs for Babylon
      //Each element is a Vector2(u,v)
      //If the UVs are missing, set (u,v)=(0,0)
      uvVectorFromOBJ = uvVectorFromOBJ ?? new Vector2(0, 0);
      this._wrappedUvsForBabylon.push(uvVectorFromOBJ);
      //Push the normals for Babylon
      //Each element is a Vector3(x,y,z)
      this._wrappedNormalsForBabylon.push(normalsVectorFromOBJ);

      //Add the tuple in the comparison list
      this._tuplePosNorm[indicePositionFromObj].normals.push(indiceNormalFromObj);
      this._tuplePosNorm[indicePositionFromObj].idx.push(this._curPositionInIndices++);
      if (this._loadingOptions.optimizeWithUV) {
        this._tuplePosNorm[indicePositionFromObj].uv.push(indiceUvsFromObj);
      }
    } else {
      //The tuple already exists
      //Add the index of the already existing tuple
      //At this index we can get the value of position, normal, color and uvs of vertex
      this._indicesForBabylon.push(_index);
    }
  }


  /**
   * Transform Vector() and BABYLON.Color() objects into numbers in an array
   */
  private _unwrapData() {
    try {
      //Every array has the same length
      for (let l = 0; l < this._wrappedPositionForBabylon.length; l++) {
        //Push the x, y, z values of each element in the unwrapped array
        this._unwrappedPositionsForBabylon.push(
          this._wrappedPositionForBabylon[l].x * this._handednessSign,
          this._wrappedPositionForBabylon[l].y,
          this._wrappedPositionForBabylon[l].z
        );
        this._unwrappedNormalsForBabylon.push(
          this._wrappedNormalsForBabylon[l].x * this._handednessSign,
          this._wrappedNormalsForBabylon[l].y,
          this._wrappedNormalsForBabylon[l].z
        );

        this._unwrappedUVForBabylon.push(this._wrappedUvsForBabylon[l].x, this._wrappedUvsForBabylon[l].y); //z is an optional value not supported by BABYLON
        if (this._loadingOptions.importVertexColors) {
          //Push the r, g, b, a values of each element in the unwrapped array
          this._unwrappedColorsForBabylon.push(
            this._wrappedColorsForBabylon[l].r,
            this._wrappedColorsForBabylon[l].g,
            this._wrappedColorsForBabylon[l].b,
            this._wrappedColorsForBabylon[l].a
          );
        }
      }
      // Reset arrays for the next new meshes
      this._wrappedPositionForBabylon.length = 0;
      this._wrappedNormalsForBabylon.length = 0;
      this._wrappedUvsForBabylon.length = 0;
      this._wrappedColorsForBabylon.length = 0;
      this._tuplePosNorm.length = 0;
      this._curPositionInIndices = 0;
    } catch (e) {
      throw new Error("Unable to unwrap data while parsing OBJ data.");
    }
  }
  private _addPreviousObjMesh() {
    //Check if it is not the first mesh. Otherwise we don't have data.
    if (this._meshesFromObj.length > 0) {
      //Get the previous mesh for applying the data about the faces
      //=> in obj file, faces definition append after the name of the mesh
      this._handledMesh = this._meshesFromObj[this._meshesFromObj.length - 1];

      //Set the data into Array for the mesh
      this._unwrapData();

      if (this._loadingOptions.useLegacyBehavior) {
        // Reverse tab. Otherwise face are displayed in the wrong sens
        this._indicesForBabylon.reverse();
      }

      //Set the information for the mesh
      //Slice the array to avoid rewriting because of the fact this is the same var which be rewrited
      this._handledMesh.indices = this._indicesForBabylon.slice();
      this._handledMesh.positions = this._unwrappedPositionsForBabylon.slice();
      this._handledMesh.normals = this._unwrappedNormalsForBabylon.slice();
      this._handledMesh.uvs = this._unwrappedUVForBabylon.slice();
      this._handledMesh.hasLines = this._hasLineData;

      if (this._loadingOptions.importVertexColors) {
        this._handledMesh.colors = this._unwrappedColorsForBabylon.slice();
      }

      //Reset the array for the next mesh
      this._indicesForBabylon.length = 0;
      this._unwrappedPositionsForBabylon.length = 0;
      this._unwrappedColorsForBabylon.length = 0;
      this._unwrappedNormalsForBabylon.length = 0;
      this._unwrappedUVForBabylon.length = 0;
      this._hasLineData = false;
    }
  }


  private static _GetZbrushMRGB(line: string, notParse: boolean) {
    if (!line.startsWith("mrgb")) return null;
    // if include vertex color , not load mrgb anymore
    if (notParse) return [];

    line = line.replace("mrgb", "").trim();
    const regex = /[a-z0-9]/g;
    const regArray = line.match(regex);
    if (!regArray || regArray.length % 8 !== 0) {
      return [];
    }
    const array: Color4[] = [];
    for (let regIndex = 0; regIndex < regArray.length / 8; regIndex++) {
      //each item is MMRRGGBB, m is material index
      // const m = regArray[regIndex * 8 + 0] + regArray[regIndex * 8 + 1];
      const r = regArray[regIndex * 8 + 2] + regArray[regIndex * 8 + 3];
      const g = regArray[regIndex * 8 + 4] + regArray[regIndex * 8 + 5];
      const b = regArray[regIndex * 8 + 6] + regArray[regIndex * 8 + 7];
      array.push(new Color4(parseInt(r, 16) / 255, parseInt(g, 16) / 255, parseInt(b, 16) / 255, 1));
    }
    return array;
  }
}

