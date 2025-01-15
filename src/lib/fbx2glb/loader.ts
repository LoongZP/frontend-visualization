// @ts-ignore
import obj2gltf from "../obj2gltf"
import path from "path"
import fs from "fs"
import os from "os"
import childProcess from "child_process";
import {rimraf} from "rimraf"
import { unique } from "@/utils/unique";

/**
 * Converts an FBX to a GTLF or GLB file.
 * @param string srcFile path to the source file.
 * @param string destFile path to the destination file.
 * This must end in `.glb` or `.gltf` (case matters).
 * @param string[] [opts] options to pass to the converter tool.
 * @return Promise<string> a promise that yields the full path to the converted
 * file, an error on conversion failure.
 */
function convert(srcFile: string, destFile: string, opts = []) {
  return new Promise((resolve, reject) => {
    try {
      let binExt = os.type() === 'Windows_NT' ? '.exe' : '';
      let tool = path.join(__dirname, 'assets/bin', os.type(), 'FBX2glTF' + binExt);
      if (!fs.existsSync(tool)) {
        throw new Error(`Unsupported OS: ${os.type()}`);
      }

      let destExt:string;
      if (destFile.endsWith('.glb')) {
        destExt = '.glb';
        opts.includes('--binary') || opts.push('--binary');
      } else if (destFile.endsWith('.gltf')) {
        destExt = '.gltf';
      } else {
        throw new Error(`Unsupported file extension: ${destFile}`);
      }

      let srcPath = fs.realpathSync(srcFile);
      let destDir = fs.realpathSync(path.dirname(destFile));
      let destPath = path.join(destDir, path.basename(destFile, destExt));

      let args = opts.slice(0);
      args.push('--input', srcPath, '--output', destPath);
      let child = childProcess.spawn(tool, args);

      let output = '';
      child.stdout.on('data', (data) => output += data);
      child.stderr.on('data', (data) => output += data);
      child.on('error', reject);
      child.on('close', code => {
        // the FBX SDK may create an .fbm dir during conversion; delete!
        let fbmCruft = srcPath.replace(/.fbx$/i, '.fbm');
        // don't stick a fork in things if this fails, just log a warning
        const onError = error =>
          error && console.warn(`Failed to delete ${fbmCruft}: ${error}`);
        try {
          fs.existsSync(fbmCruft) && rimraf(fbmCruft, {}, onError);
        } catch (error) {
          onError(error);
        }

        // non-zero exit code is failure
        if (code != 0) {
          reject(new Error(`Converter output:\n` +
            (output.length ? output : "<none>")));
        } else {
          resolve(destPath + destExt);
        }
      });

    } catch (error) {
      reject(error);
    }
  });
}
export async function fbx2glb(srcFile: string) {
  const tempDir = os.tmpdir();
  const fileName = path.basename(srcFile.toLowerCase(), ".fbx") + unique(20) + ".glb";
  let tempFile = path.join(tempDir, fileName);
  const options = []; //'--khr-materials-unlit'
  convert(srcFile, tempFile, options).then((tempFile: string) => { }, (error: string) => { console.error(error); });
  let glb = fs.readFileSync(tempFile);
  return glb;
}

export async function obj2glb(srcFile: string): Promise<Uint8Array<ArrayBufferLike>> {
  const options = {
    binary: true,
  };
  let glb: Uint8Array = await obj2gltf(srcFile, options);
  return glb;
}