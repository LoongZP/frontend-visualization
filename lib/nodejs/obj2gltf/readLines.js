"use strict";
import fsExtra from "fs-extra";
import Promise from "bluebird";
import readline from "readline";
import events from "events";

export default  readLines;

/**
 * Read a file line-by-line.
 *
 * @param {String} path Path to the file.
 * @param {Function} callback Function to call when reading each line.
 * @returns {Promise} A promise when the reader is finished.
 *
 * @private
 */
function readLines(path, callback) {
  const stream = fsExtra.createReadStream(path);
  return events.once(stream, "open").then(function () {
    return new Promise(function (resolve, reject) {
      stream.on("error", reject);
      stream.on("end", resolve);

      const lineReader = readline.createInterface({
        input: stream,
      });

      const callbackWrapper = function (line) {
        try {
          callback(line);
        } catch (error) {
          reject(error);
        }
      };

      lineReader.on("line", callbackWrapper);
    });
  });
}
