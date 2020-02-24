import fs from 'fs-extra';

class File {

    content;

    get content() {
        if (this.content) {
            throw "no content for this file. " +
            "If you are trying to read a file, use the function `read(path)`."
        }
        return this.content;
    }

    async read(path){
        this.content = await fs.readFile(path);
    }
}