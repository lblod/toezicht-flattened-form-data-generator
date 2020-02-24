import fs from 'fs-extra';

/**
 * Returns the file for the given path.
 *
 * @param path
 * @returns {Promise<*>}
 */
async function getFile(path) {
    return await fs.readFile(path);
}

export {
    getFile
}