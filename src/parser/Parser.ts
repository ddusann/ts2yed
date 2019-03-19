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

import * as fs from 'fs';

import FileParser from './FileParser';
import ParsedFile from './ParsedFile';
import ts from 'typescript';

type FileName = string;
type FileContent = string;

interface IFileContent {
    fileContent: FileContent;
    fileName: FileName;
}

export interface IParsedFile {
    file: ParsedFile;
    fileName: FileName;
}

export default class Parser {
    private _parsedFiles: Promise<IParsedFile[]>;

    constructor(fileNames: string[]) {
        this._parsedFiles = this._loadFiles(fileNames).then(files => this._parseFiles(files));
    }

    getFiles(): Promise<IParsedFile[]> {
        return this._parsedFiles;
    }

    private _loadFiles(fileNameList: FileName[]): Promise<IFileContent[]> {
        return Promise.all(fileNameList.map(fileName => this._readFile(fileName)));
    }

    private _parseFile(file: IFileContent): ParsedFile {
        const node = ts.createSourceFile(file.fileName, file.fileContent, ts.ScriptTarget.ESNext);
        return FileParser.parse(node);
    }

    private _parseFiles(files: IFileContent[]): IParsedFile[] {
        return files.map(file => ({ file: this._parseFile(file), fileName: file.fileName }));
    }

    private _readFile(fileName: FileName): Promise<IFileContent> {
        return new Promise((resolve, reject) => {
            fs.readFile(fileName, { encoding: 'utf8' }, (err, fileContent) => {
                if (err) {
                    reject(new Error(err.message));
                    return;
                }

                resolve({ fileName, fileContent });
            });
        });
    }
}
