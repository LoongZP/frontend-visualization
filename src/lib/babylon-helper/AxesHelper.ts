import { Color3, LinesMesh, MeshBuilder, Vector3, Scene } from '@babylonjs/core'
export class AxesHelper {
    axisX: LinesMesh
    axisY: LinesMesh
    axisZ: LinesMesh
    constructor(x: number, y: number, z: number, scene: Scene) {
        this.axisX = MeshBuilder.CreateLines("axisX", {
            points: [new Vector3(0, 0, 0), new Vector3(x, 0, 0)],
            updatable: false,
        }, scene);
        this.axisX.color = new Color3(1, 0, 0); // X 轴为红色

        this.axisY = MeshBuilder.CreateLines("axisY", {
            points: [new Vector3(0, 0, 0), new Vector3(0, y, 0)],
            updatable: false
        }, scene);
        this.axisY.color = new Color3(0, 1, 0); // Y 轴为绿色

        this.axisZ = MeshBuilder.CreateLines("axisZ", {
            points: [new Vector3(0, 0, 0), new Vector3(0, 0, z)],
            updatable: false
        }, scene);
        this.axisZ.color = new Color3(0, 0, 1); // Z 轴为蓝色
    }
}


