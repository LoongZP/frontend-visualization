import {
  Nullable, AssetContainer, Scene, PBRMaterial, Color3,
  Mesh, Tools, AbstractMesh, StandardMaterial, Vector3,
  Texture
} from "@babylonjs/core";
import { MTLFileLoader, OBJFileLoader, SolidParser } from "@babylonjs/loaders";
import { pathC } from "../common/pathC";
import path from '../common/path'

OBJFileLoader.prototype._parseSolid = function (meshesNames: any, scene: Scene, data: string, rootUrl: string): Promise<Array<AbstractMesh>> {
  let fileToLoad: string = ""; //The name of the mtlFile to load
  const materialsFromMTLFile: MTLFileLoader = new MTLFileLoader();
  const materialToUse: string[] = [];
  let babylonMeshesArray: Array<Mesh> = []; //The mesh for babylon

  // Sanitize data
  data = data.replace(/#.*$/gm, "").trim();

  // Main function
  const solidParser = new SolidParser(materialToUse, babylonMeshesArray, this._loadingOptions);

  solidParser.parse(meshesNames, data, scene, this._assetContainer, (fileName: string) => {
    fileToLoad = fileName;
  });

  // load the materials
  const mtlPromises: Array<Promise<void>> = [];
  // Check if we have a file to load
  if (fileToLoad !== "" && !this._loadingOptions.skipMaterials) {
    //Load the file synchronously
    mtlPromises.push(
      new Promise((resolve, reject) => {
        this._loadMTL(
          fileToLoad,
          rootUrl,
          (dataLoaded) => {
            try {
              //Create materials thanks MTLLoader function
              materialsFromMTLFile.parseMTL(scene, dataLoaded, rootUrl, this._assetContainer);
              //Look at each material loaded in the mtl file
              for (let n = 0; n < materialsFromMTLFile.materials.length; n++) {
                //Three variables to get all meshes with the same material
                let startIndex = 0;
                const _indices = [];
                let _index;

                //The material from MTL file is used in the meshes loaded
                //Push the indice in an array
                //Check if the material is not used for another mesh
                while ((_index = materialToUse.indexOf(materialsFromMTLFile.materials[n].name, startIndex)) > -1) {
                  _indices.push(_index);
                  startIndex = _index + 1;
                }
                //If the material is not used dispose it
                if (_index === -1 && _indices.length === 0) {
                  //If the material is not needed, remove it
                  materialsFromMTLFile.materials[n].dispose();
                } else {
                  for (let o = 0; o < _indices.length; o++) {
                    //Apply the material to the Mesh for each mesh with the material
                    const mesh = babylonMeshesArray[_indices[o]];
                    const material = materialsFromMTLFile.materials[n];
                    
                    // HACK 主要是针对空mesh（无geometry）带来的bug进行处理
                    // 只有存在geometry时，模型才需要 material
                    // 并且只有存在geometry，但是不存在索引时才使用点云，否则部分模型的材质会变成点云模型
                    if (mesh.geometry) {
                      mesh.material = material;
                    }
                    if (mesh.geometry && !mesh.getTotalIndices()) {
                      // No indices, we need to turn on point cloud
                      material.pointsCloud = true;
                    }
                  }
                }
              }

              // HACK 调整空mesh的subMesh的名称，并将非空mesh全部挂载到__root__下
              // 因为我们的加载机制只会从第一个meshs[0] 递归往下加载，模型会丢失
              babylonMeshesArray.forEach((mesh) => {
                if (mesh.getChildMeshes().length > 0) {
                  mesh.getChildMeshes().forEach((childMesh, index) => { childMesh.name = mesh.name + '_' + (index + 1); });
                  mesh.name = mesh.name + "_0";
                }
              })
              let rootMesh = new Mesh("__root__", scene);
              rootMesh.scaling = new Vector3(1, 1, 1);
              rootMesh.position = new Vector3(0, 0, 0);
              rootMesh.rotation = new Vector3(0, 0, 0);
              rootMesh._parentContainer = this._assetContainer;
              babylonMeshesArray = babylonMeshesArray.filter((mesh) => {
                if (mesh.geometry) {
                  mesh.parent = rootMesh;
                  return true;
                } else {
                  mesh.dispose(true);
                  return false;
                }
              })
              babylonMeshesArray.unshift(rootMesh);


              resolve();
            } catch (e) {
              Tools.Warn(`Error processing MTL file: '${fileToLoad}'`);
              if (this._loadingOptions.materialLoadingFailsSilently) {
                resolve();
              } else {
                reject(e);
              }
            }
          },
          (pathOfFile: string, exception?: any) => {
            Tools.Warn(`Error downloading MTL file: '${fileToLoad}'`);
            if (this._loadingOptions.materialLoadingFailsSilently) {
              resolve();
            } else {
              reject(exception);
            }
          }
        );
      })
    );
  }
  //Return an array with all Mesh
  return Promise.all(mtlPromises).then(() => {
    const isLine = (mesh: AbstractMesh) => Boolean(mesh._internalMetadata?.["_isLine"] ?? false);

    // Iterate over the mesh, determine if it is a line mesh, clone or modify the material to line rendering.
    babylonMeshesArray.forEach((mesh) => {
      if (isLine(mesh)) {
        let mat = mesh.material ?? new StandardMaterial(mesh.name + "_line", scene);
        // If another mesh is using this material and it is not a line then we need to clone it.
        const needClone = mat.getBindedMeshes().filter((e) => !isLine(e)).length > 0;
        if (needClone) {
          mat = mat.clone(mat.name + "_line") ?? mat;
        }
        mat.wireframe = true;
        mesh.material = mat;
        if (mesh._internalMetadata) {
          mesh._internalMetadata["_isLine"] = undefined;
        }
      }
    });

    return babylonMeshesArray;
  });
}

// HACK 将StandardMaterial 替换成PBRMaterial，并进行属性映射的调整
MTLFileLoader.prototype.parseMTL = function (scene: Scene, data: string | ArrayBuffer, rootUrl: string, assetContainer: Nullable<AssetContainer>): void {
  if (data instanceof ArrayBuffer) {
    return;
  }

  //Split the lines from the file
  const lines = data.split("\n");
  // whitespace char ie: [ \t\r\n\f]
  const delimiter_pattern = /\s+/;
  //Array with RGB colors
  let color: number[];
  //New material
  let material: Nullable<PBRMaterial> = null;

  //Look at each line
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Blank line or comment
    if (line.length === 0 || line.charAt(0) === "#") {
      continue;
    }

    //Get the first parameter (keyword)
    const pos = line.indexOf(" ");
    let key = pos >= 0 ? line.substring(0, pos) : line;
    key = key.toLowerCase();

    //Get the data following the key
    const value: string = pos >= 0 ? line.substring(pos + 1).trim() : "";

    //This mtl keyword will create the new material
    if (key === "newmtl") {
      //Check if it is the first material.
      // Materials specifications are described after this keyword.
      if (material) {
        //Add the previous material in the material array.
        this.materials.push(material);
      }
      //Create a new material.
      // value is the name of the material read in the mtl file

      scene._blockEntityCollection = !!assetContainer;
      material = new PBRMaterial(value, scene);
      material._parentContainer = assetContainer;
      scene._blockEntityCollection = false;
      // init
      material.reflectivityColor = Color3.FromArray([0.5, 0.5, 0.5]);
      material.metallic = 0.2;
      material.roughness = 0.8;
    }
    //#region Basic materials
    // https://en.wikipedia.org/wiki/Wavefront_.obj_file#Basic_materials
    else if (key === "kd" && material) {
      // Diffuse color (color under white light) using RGB values

      //value  = "r g b"
      color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
      //color = [r,g,b]
      //Set tghe color into the material
      material.albedoColor = Color3.FromArray(color);
    } else if (key === "ka" && material) {
      // Ambient color (color under shadow) using RGB values

      //value = "r g b"
      color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
      //color = [r,g,b]
      //Set tghe color into the material
      material.ambientColor = Color3.FromArray(color);
    } else if (key === "ks" && material) {
      // Specular color (color when light is reflected from shiny surface) using RGB values

      //value = "r g b"
      color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
      //color = [r,g,b]
      //Set the color into the material
      // material.metallicReflectanceColor = Color3.FromArray(color);
      material.reflectionColor = Color3.FromArray(color);
    } else if (key === "ns" && material) {
      //value = "Integer"
      material.metallicF0Factor = parseFloat(value) / 1000;
    } else if (key === "d" && material) {
      //d is dissolve for current material. It mean alpha for BABYLON
      material.alpha = parseFloat(value);
      //Texture
      //This part can be improved by adding the possible options of texture
    } else if (key === "tr" && material) {
      //others use 'Tr' (inverted: Tr = 1 - d)
      material.alpha = 1 - parseFloat(value);
    } else if (key === "tf" && material) {
      /**
       * Transparent materials can additionally have a Transmission Filter Color, specified with "Tf".
       * #  Transmission Filter Color (using R G B)
            Tf 1.0 0.5 0.5
            # Transmission Filter Color (using CIEXYZ) - y and z values are optional and assumed to be equal to x if omitted
            Tf xyz 1.0 0.5 0.5
            # Transmission Filter Color from spectral curve file (not commonly used)
            Tf spectral <filename>.rfl <optional factor>
       */
    } else if (key === "ni" && material) {
      /**
       * A material can also have an optical density for its surface. This is also known as index of refraction.
       *
       * Values can range from 0.001 to 10. A value of 1.0 means that light does not bend as it passes through an object. Increasing the optical density increases the amount of bending. Glass has an index of refraction of about 1.5. Values of less than 1.0 produce bizarre results and are not recommended.[7]
       * # optical density
       * Ni 1.45000
       */
      material.indexOfRefraction = parseFloat(value);
    }
    //#endregion Basic materials
    //#region Texture maps
    else if (key === "map_ka" && material) {
      // ambient texture map with a loaded image
      //We must first get the folder of the image
      material.ambientTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_kd" && material) {
      // Diffuse texture map with a loaded image
      material.albedoTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_ks" && material) {
      // Specular texture map with a loaded image
      //We must first get the folder of the image
      // material.metallicReflectanceTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
      material.reflectionTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_ns" && material) {
      //Specular
      //Specular highlight component
      //We must first get the folder of the image
      //
      //Not supported by BABYLON
      //
      //    continue;
      material.microSurfaceTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
      material.metallicTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_refl" && material) {
      material.reflectanceTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_bump" && material) {
      //The bump texture
      const values = value.split(delimiter_pattern);
      const bumpMultiplierIndex = values.indexOf("-bm");
      let bumpMultiplier: Nullable<string> = null;

      if (bumpMultiplierIndex >= 0) {
        bumpMultiplier = values[bumpMultiplierIndex + 1];
        values.splice(bumpMultiplierIndex, 2); // remove
      }

      material.bumpTexture = (MTLFileLoader as any)._GetTexture(rootUrl, values.join(" "), scene);
      if (material.bumpTexture && bumpMultiplier !== null) {
        material.bumpTexture.level = parseFloat(bumpMultiplier);
      }
    } else if (key === "map_d" && material) {
      // The dissolve of the material
      material.opacityTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);

      //Options for illumination
    }
    //#endregion Texture maps
    else if (key === "illum") {
      //Illumination
      if (value === "0") {
        //That mean Kd == Kd
      } else if (value === "1") {
        //Color on and Ambient on
      } else if (value === "2") {
        //Highlight on
      } else if (value === "3") {
        //Reflection on and Ray trace on
      } else if (value === "4") {
        //Transparency: Glass on, Reflection: Ray trace on
      } else if (value === "5") {
        //Reflection: Fresnel on and Ray trace on
      } else if (value === "6") {
        //Transparency: Refraction on, Reflection: Fresnel off and Ray trace on
      } else if (value === "7") {
        //Transparency: Refraction on, Reflection: Fresnel on and Ray trace on
      } else if (value === "8") {
        //Reflection on and Ray trace off
      } else if (value === "9") {
        //Transparency: Glass on, Reflection: Ray trace off
      } else if (value === "10") {
        //Casts shadows onto invisible surfaces
      }
    }
    //#region Physically-based rendering
    /**
     * The creators of the online 3D editing and modeling tool, Clara.io, proposed extending the
     * MTL format to enable specifying physically-based rendering (PBR) maps and parameters.
     * This extension has been subsequently adopted by Blender and TinyObjLoader.
     * The extension PBR maps and parameters are:[8]

      Pr/map_Pr     # roughness
      Pm/map_Pm     # metallic
      Ps/map_Ps     # sheen
      Pc            # clearcoat thickness
      Pcr           # clearcoat roughness
      Ke/map_Ke     # emissive
      aniso         # anisotropy
      anisor        # anisotropy rotation
      norm          # normal map (RGB components represent XYZ components of the surface normal)
     */
    else if (key === "pr" && material) {
      material.roughness = parseFloat(value);
    } else if (key === "pm" && material) {
      material.metallic = parseFloat(value);
    } else if (key === "ps" && material?.sheen) {
      material.sheen.intensity = parseFloat(value);
    } else if (key === "pc" && material?.clearCoat) {
      material.clearCoat.tintThickness = parseFloat(value);
    } else if (key === "pcr" && material?.clearCoat) {
      material.clearCoat.roughness = parseFloat(value);
    } else if (key === "ke" && material) {
      color = value.split(delimiter_pattern, 3).map(parseFloat);
      material.emissiveColor = Color3.FromArray(color);
    } else if (key === "km" && material) {
      material.emissiveIntensity = parseFloat(value);
    } else if (key === "aniso" && material?.anisotropy) {
      material.anisotropy.intensity = parseFloat(value);
    } else if (key === "anisor" && material?.anisotropy) {
      //可能不是angle
      material.anisotropy.angle = parseFloat(value);
    } else if (key === "norm") {
      //没搞清楚normal map跟上面的bump map关系 先忽略
    } else if ((key === "map_pr" || key === "map_pm") && material) {
      //需要测试一下 处理同时存在或者只存在其中之一时的情况
      material.metallicTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_ps" && material?.sheen) {
      material.sheen.texture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
    } else if (key === "map_ke" && material) {
      material.emissiveTexture = (MTLFileLoader as any)._GetTexture(rootUrl, value, scene);
      material.emissiveColor = Color3.FromArray([1, 1, 1]);
      material.emissiveIntensity = 1;
    }
    //#endregion Physically-based rendering
    else {
      // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
    }
  }
  //At the end of the file, add the last material
  if (material) {
    this.materials.push(material);
  }
}


// HACK 调整了外部材质的路劲的处理方式
MTLFileLoader._GetTexture = (rootUrl: string, value: string, scene: Scene): Nullable<Texture> => {
  if (!value) {
    return null;
  }
  value = value.replace(/\\/g, '/');
  if (pathC.isAbsolute(value)) {
    // @ts-ignore
    value = path.basename(value);
  }
  // @ts-ignore
  let url = path.join(rootUrl, value);

  return new Texture(url, scene, false, MTLFileLoader.INVERT_TEXTURE_Y);
}