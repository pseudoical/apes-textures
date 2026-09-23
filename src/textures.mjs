/**
 * Usage:
 *   $ node ./src/textures.mjs
 *       - Download the `.tex` files if needed and extract textures.
 *   $ node ./src/textures.mjs --fetch
 *       - Force download the `.tex` files and extract textures.
 */

// @ts-check

import fs from "node:fs";
import path from "node:path";

/**
 * @param {string} name
 * @returns {Promise<void>}
 */
async function extractTextures(name) {
    const texName = `${name}.tex`;
    const texPath = path.join(import.meta.dirname, texName);

    if (!fs.existsSync(texPath) || process.argv[2] === "--fetch") {
        const response = await fetch(`https://apes.io/game/260916-28dd180-ls/${texName}`);
        const start = performance.now();
        const buffer = await response.arrayBuffer();
        const seconds = (performance.now() - start) / 1000;
        console.log(
            `${(buffer.byteLength / 1024 / 1024 / seconds).toFixed(2)} MB/s`
        );
        await fs.promises.writeFile(texPath, Buffer.from(buffer));
    }

    const texturesPath = path.join("textures", name);
    await fs.promises.mkdir(texturesPath, { recursive: true });

    const tex = await fs.promises.readFile(texPath);

    let cursor = 0;
    const end = tex.length;

    while (cursor !== end) {
        const meta = tex.subarray(cursor, cursor + 6);
        cursor += 6;

        const fileNameLength = meta[1];
        const imageDataLength = meta[2] | meta[3] << 8 | meta[4] << 16 | meta[5] << 24;

        const fileName = tex.toString("utf8", cursor, cursor + fileNameLength);
        cursor += fileNameLength;

        const imageData = tex.subarray(cursor, cursor + imageDataLength);
        cursor += imageDataLength;

        const type = 1 & meta[0] ? "jpeg" : "png";
        const imagePath = path.join(texturesPath, `${fileName}.${type}`);

        // Write files concurrently for performance.
        fs.promises.writeFile(imagePath, imageData);
    }
}

for (const name of ["init", "game"]) {
    // Extract textures concurrently for performance.
    extractTextures(name);
}
