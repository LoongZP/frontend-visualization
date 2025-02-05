import { Document, Material, Texture } from "@gltf-transform/core"
import sharp, { Sharp } from "sharp";
import sharpBmp from "sharp-bmp";
import fs from "fs";
import path from "path";
type Nullable<T> = T | null;
/**
 * Class reading and parsing the MTL file bundled with the obj file.
 */
export class MTLFileLoader {
  /**
   * Invert Y-Axis of referenced textures on load
   */
  public static INVERT_TEXTURE_Y = true;


  //#region mtl
  // 读取 mtl文件，并解析
  public async loadMTL(srcFilePath: string, documernt: Document): Promise<Material[]> {
    const dirName = path.dirname(srcFilePath);

    const mtlStr = fs.readFileSync(srcFilePath, { encoding: "utf8" });
    let data = mtlStr.replace(/#.*$/gm, "").trim(); //删除注释
    let materials = await this.parseMTL(documernt, data, dirName);
    return materials;
  }

  /**
   * This function will read the mtl file and create each material described inside
   * This function could be improve by adding :
   * -some component missing (Ni, Tf...)
   * -including the specific options available
   *
   * @param document defines the document the material will be created in
   * @param data defines the mtl data to parse
   * @param rootUrl defines the rooturl to use in order to load relative dependencies
   */
  private async parseMTL(document: Document, data: string, rootUrl: string): Promise<Material[]> {
    // 所有从 mtl 加载的材质都将在这里设置
    let materials: Material[] = [];

    //Split the lines from the file
    const lines = data.split("\n");
    // whitespace char ie: [ \t\r\n\f]
    const delimiter_pattern = /\s+/;
    //Array with RGB colors
    let color: number[];
    //New material
    let material: Nullable<Material> = null;

    //Look at each line
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Blank line or comment
      // if (line.length === 0 || line.charAt(0) === "#") {
      //     continue;
      // }

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
          materials.push(material);
        }
        //Create a new material.
        // value is the name of the material read in the mtl file
        // scene._blockEntityCollection = !!assetContainer;
        // material = new StandardMaterial(value, scene);
        material = document.createMaterial(value);
        // material._parentContainer = assetContainer;
        // scene._blockEntityCollection = false;
      } else if (key === "kd" && material) {
        // Diffuse color (color under white light) using RGB values

        //value  = "r g b"
        color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
        //color = [r,g,b]
        //Set tghe color into the material
        // material.diffuseColor = Color3.FromArray(color);
        material.setBaseColorFactor([color[0], color[1], color[2], 1]);
      } else if (key === "ka" && material) {
        // Ambient color (color under shadow) using RGB values

        //value = "r g b"
        color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
        //color = [r,g,b]
        //Set tghe color into the material
        // material.ambientColor = Color3.FromArray(color);
        material.setOcclusionStrength(color[0]); // r 通道提取
      } else if (key === "ks" && material) {
        // Specular color (color when light is reflected from shiny surface) using RGB values
        //value = "r g b"
        color = <number[]>value.split(delimiter_pattern, 3).map(parseFloat);
        //color = [r,g,b]
        //Set the color into the material
        // material.specularColor = Color3.FromArray(color);
        // TODO
        material.setMetallicFactor(1.0 - color[2]);
      } else if (key === "ke" && material) {
        // Emissive color using RGB values
        color = value.split(delimiter_pattern, 3).map(parseFloat);
        // material.emissiveColor = Color3.FromArray(color);
        material.setEmissiveFactor([color[0], color[1], color[2],]);
      } else if (key === "ns" && material) {
        //value = "Integer"
        // material.specularPower = parseFloat(value);
        material.setRoughnessFactor(parseFloat(value));
      } else if (key === "d" && material) {
        //d is dissolve for current material. It mean alpha for BABYLON
        // material.alpha = parseFloat(value);
        material.setAlpha(parseFloat(value));


        //Texture
        //This part can be improved by adding the possible options of texture
      } else if (key === "map_ka" && material) {
        // ambient texture map with a loaded image
        //We must first get the folder of the image
        // material.ambientTexture = MTLFileLoader._GetTexture(rootUrl, value, scene);
        let ambientTexture = await MTLFileLoader.loadTextutre(rootUrl, value, document);
        material.setOcclusionTexture(ambientTexture);
      } else if (key === "map_kd" && material) {
        // Diffuse texture map with a loaded image
        // material.diffuseTexture = MTLFileLoader._GetTexture(rootUrl, value, scene);
        let diffuseTexture = await MTLFileLoader.loadTextutre(rootUrl, value, document);
        material.setBaseColorTexture(diffuseTexture);
      } else if (key === "map_ks" && material) {
        // Specular texture map with a loaded image
        //We must first get the folder of the image
        // material.specularTexture = MTLFileLoader._GetTexture(rootUrl, value, scene);
        // TODO 金属/粗糙度和镜面/光泽度是两种不同的pbr模式，但是gltf-transform 只有金属/粗糙度，Roughness的值需要转换
        let specularTexture = await MTLFileLoader.loadTextutre(rootUrl, value, document);
        material.setMetallicRoughnessTexture(specularTexture);
      } else if (key === "map_ke") {
        let emissiveTexture = await MTLFileLoader.loadTextutre(rootUrl, value, document);
        material.setEmissiveTexture(emissiveTexture);
      } else if (key === "map_ns") {
        //Specular
        //Specular highlight component
        //We must first get the folder of the image
        //
        //Not supported by BABYLON
        //
        //    continue;
      } else if (key === "map_bump" && material) {
        //The bump texture
        const values = value.trim().split(delimiter_pattern);
        const bumpMultiplierIndex = values.indexOf("-bm");
        let bumpMultiplier: Nullable<string> = null;

        if (bumpMultiplierIndex >= 0) {
          bumpMultiplier = values[bumpMultiplierIndex + 1];
          values.splice(bumpMultiplierIndex, 2); // remove
        }

        // material.bumpTexture = MTLFileLoader._GetTexture(rootUrl, values.join(" "), scene);
        // if (material.bumpTexture && bumpMultiplier !== null) {
        //     material.bumpTexture.level = parseFloat(bumpMultiplier);
        // }
        let bumpTexture = await MTLFileLoader.loadTextutre(rootUrl, values[values.length - 1], document);
        material.setNormalScale(parseFloat(bumpMultiplier));
        material.setNormalTexture(bumpTexture);
      } else if (key === "map_d" && material) {
        // The dissolve of the material
        // material.opacityTexture = MTLFileLoader._GetTexture(rootUrl, value, scene);

        //Options for illumination
      } else if (key === "illum") {
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
      } else {
        // console.log("Unhandled expression at line : " + i +'\n' + "with value : " + line);
      }
    }
    //At the end of the file, add the last material
    if (material) {
      materials.push(material);
    }
    return materials;
  }
  //#endregion mtl

  //#region texture
  // 读取贴图文件
  /**
   * Gets the texture for the material.
   *
   * If the material is imported from input file,
   * We sanitize the url to ensure it takes the texture from aside the material.
   *
   * @param rootUrl The root url to load from
   * @param value The value stored in the mtl
   * @param document
   * @returns The Texture
   */
  private static async loadTextutre(rootUrl: string, value: string, document: Document): Promise<Nullable<Texture>> {
    if (!value) {
      return null;
    }
    // let url = rootUrl;
    // Load from input file.
    if (rootUrl === "file:") {
      let lastDelimiter = value.lastIndexOf("\\");
      if (lastDelimiter === -1) {
        lastDelimiter = value.lastIndexOf("/");
      }
      if (lastDelimiter > -1) {
        // url += value.substring(lastDelimiter + 1);
        value = value.substring(lastDelimiter + 1);
      }
      // else {
      //   // url += value;
      // }
    }
    // // Not from input file.
    // else {
    //   // url += value;
    // }
    let url = path.join(rootUrl, value);
    let sharpImg = this.getSharp(url);
    if (MTLFileLoader.INVERT_TEXTURE_Y) {
      sharpImg = sharpImg.flip(); //图片上下翻转
    }
    sharpImg = sharpImg.jpeg({ mozjpeg: true, quality: 100 });

    let fileNames = path.basename(value).split(".");
    fileNames[fileNames.length - 1] = "jpeg";

    let newValue = path.join(path.dirname(value), fileNames.join("."));
    let newUrl = path.join(rootUrl, newValue);
    
    let texture = document.createTexture(newValue);
    texture.setURI(newUrl);
    texture.setMimeType(`image/jpeg`);
    let newBuffer = await sharpImg.toBuffer();
    texture.setImage(newBuffer);
    return texture;
  }
  private static getSharp(url: string): Sharp {
    let ext = path.extname(path.basename(url)).toLowerCase();
    if (ext === ".bmp") {
      return (sharpBmp.sharpFromBmp(url)) as Sharp;
    } else {
      return sharp(url);
    }
  }
  //#endregion texture
}
