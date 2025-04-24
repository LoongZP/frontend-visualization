import { BaseTexture, Deferred, ITextureCreationOptions, Texture, VertexBuffer } from "@babylonjs/core";
import { GLTF2 } from "@babylonjs/loaders";
import { IImage, ISampler } from "@babylonjs/loaders/glTF/2.0";
import { IAccessor } from "babylonjs-gltf2interface";

//加载uv的时候对v进行翻转
const __loadVertexAccessorAsync = GLTF2.GLTFLoader.prototype._loadVertexAccessorAsync;
GLTF2.GLTFLoader.prototype._loadVertexAccessorAsync = function(context: string, accessor: IAccessor, kind: string): Promise<VertexBuffer> {
  return __loadVertexAccessorAsync.call(this, context, accessor, kind).then((vertexBuffer: VertexBuffer)=>{
    if (vertexBuffer && [VertexBuffer.UVKind, VertexBuffer.UV2Kind, VertexBuffer.UV3Kind, VertexBuffer.UV4Kind, VertexBuffer.UV5Kind, VertexBuffer.UV6Kind].includes(kind)) {
      const data = vertexBuffer.getData();
      if (data) {
        //对v进行翻转
        const count = vertexBuffer._maxVerticesCount;
        const stride = vertexBuffer.byteStride / 4;
        const vOffset = vertexBuffer.byteOffset / 4 + 1;
        if (data instanceof Array) {
          for (let i = 0; i < count * stride; i += stride) {
            data[i + vOffset] = 1 - data[i + vOffset];
          }
        } else {
          let floatArray: Float32Array;
          if (data instanceof ArrayBuffer) {
            floatArray = new Float32Array(data, 0, count * stride);
          } else {
            let byteOffset = data.byteOffset;
            const remainder = byteOffset % 4;
            if (remainder) {
              byteOffset = Math.max(0, byteOffset - remainder);
            }
            floatArray = new Float32Array(data.buffer, byteOffset, count * stride);
          }
          for (let i = 0; i < floatArray.length; i += stride) {
            floatArray[i + vOffset] = 1 - floatArray[i + vOffset];
          }
        }
        vertexBuffer.update(data);
        vertexBuffer._rebuild();
      }
    }
    return vertexBuffer;
  });
}
//创建Texture时invertY默认给true
GLTF2.GLTFLoader.prototype._createTextureAsync = function(
  this: GLTF2.GLTFLoader,
  context: string,
  sampler: ISampler,
  image: IImage,
  assign: (babylonTexture: BaseTexture) => void = () => {},
  textureLoaderOptions?: any,
  useSRGBBuffer?: boolean
): Promise<BaseTexture> {
  //@ts-ignore
  const samplerData = this._loadSampler(`/samplers/${sampler.index}`, sampler);

  const promises = new Array<Promise<any>>();

  const deferred = new Deferred<void>();
  //@ts-ignore
  this._babylonScene._blockEntityCollection = !!this._assetContainer;
  const textureCreationOptions: ITextureCreationOptions = {
    noMipmap: samplerData.noMipMaps,
    invertY: true, //hack here
    samplingMode: samplerData.samplingMode,
    onLoad: () => {
      //@ts-ignore
      if (!this._disposed) {
        deferred.resolve();
      }
    },
    onError: (message?: string, exception?: any) => {
      //@ts-ignore
      if (!this._disposed) {
        deferred.reject(new Error(`${context}: ${exception && exception.message ? exception.message : message || "Failed to load texture"}`));
      }
    },
    mimeType: image.mimeType,
    loaderOptions: textureLoaderOptions,
    //@ts-ignore
    useSRGBBuffer: !!useSRGBBuffer && this._parent.useSRGBBuffers,
  };
  //@ts-ignore
  const babylonTexture = new Texture(null, this._babylonScene, textureCreationOptions);
  babylonTexture._parentContainer = this._assetContainer;
  //@ts-ignore
  this._babylonScene._blockEntityCollection = false;
  promises.push(deferred.promise);

  promises.push(
    this.loadImageAsync(`/images/${image.index}`, image).then((data) => {
      //@ts-ignore
      const name = image.uri || `${this._fileName}#image${image.index}`;
      //@ts-ignore
      const dataUrl = `data:${this._uniqueRootUrl}${name}`;
      babylonTexture.updateURL(dataUrl, data);
    })
  );

  babylonTexture.wrapU = samplerData.wrapU;
  babylonTexture.wrapV = samplerData.wrapV;
  assign(babylonTexture);

  return Promise.all(promises).then(() => {
    return babylonTexture;
  });
}