/**
 * Copyright (c) 2019 Dušan Kováčik
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

import Parser, { IParsedFile } from '../parser/Parser';

import Class from './Class';
import fs from 'fs';
import path from 'path';

export default class Builder {
    private _classes: Class[];
    private _directory: string;
    private _files: IParsedFile[];

    constructor(directory: string) {
        this._classes = [];
        this._directory = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
        this._files = [];
    }

    async parse(): Promise<void> {
        const fileList = await this._getFileList(this._directory);
        this._files = await new Parser(fileList).getFiles();
    }

    private async _getFileList(directory: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(new Error(err.message));
                    return;
                }

                const dirNames = files.filter(file => file.isDirectory()).map(file => path.join(directory, file.name));
                const fileNames = files.filter(file => file.isFile()).map(file => path.join(directory, file.name));
                const subFileNamePromises = dirNames.map(subDirectory => this._getFileList(subDirectory));

                Promise.all(subFileNamePromises).then(subFileNamesByDir => {
                    subFileNamesByDir.forEach(subFileNames => fileNames.splice(fileNames.length, 0, ...subFileNames));
                }).then(() => {
                    resolve(fileNames);
                });
            });
        });
    }
}
