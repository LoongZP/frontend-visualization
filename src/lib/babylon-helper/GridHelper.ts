// @ts-nocheck
import { Color3, GroundMesh, MeshBuilder, Scene } from '@babylonjs/core'
import { GridMaterial } from 'babylonjs-materials';

export class GridHelper {
    ground: GroundMesh | undefined
    groundMaterial: GridMaterial | undefined
    constructor(_width: number | undefined, _height: number | undefined, scene: Scene) {
        // 创建一个地面
        this.ground = MeshBuilder.CreateGround("ground",
            {
                width: _width,
                height: _height
            },
            scene);

        // 引入 GridMaterial 模块
        this.groundMaterial = new GridMaterial("groundMaterial", scene);
        // this.groundMaterial.mainColor = new Color3(1, 0.5, 0.5); // 网格的颜色
        // 设置网格的透明度
        this.groundMaterial.opacity = 0.9;
        // 设置网格线的颜色
        this.groundMaterial.lineColor = new Color3(0, 0, 0); // 网格线的颜色
        this.groundMaterial.majorUnitFrequency = 10; // 主网格线的频率, 较粗线条的频率
        this.groundMaterial.minorUnitVisibility = 0.2; // 次网格线的可见性
        this.groundMaterial.gridRatio = 1; // 网格比率
        this.groundMaterial.antialias = true
        this.groundMaterial.preMultiplyAlpha = true;
        // 启用双面渲染
        this.groundMaterial.backFaceCulling = false;
        // 将网格材质应用到地面
        this.ground.material = this.groundMaterial;
    }
}