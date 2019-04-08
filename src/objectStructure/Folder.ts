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

import GenericObject from './GenericObject';
import path from 'path';

type FileName = string;

export interface IFolder {
    folders: IFolder[];
    name: string;
    objects: GenericObject[];
    path: string;
}

export default class Folder {
    private _folder: IFolder;

    constructor(objects: Map<FileName, Map<string, GenericObject>>) {
        this._folder = {
            folders: [],
            name: '/',
            objects: [],
            path: '/'
        };

        const fileNames = objects.keys();
        for (const fileName of fileNames) {
            const pathParts = this._getPathParts(process.platform === 'win32' ? fileName.toLowerCase() : fileName);
            let currentPath = '';
            let currentFolder = this._folder;
            for (const pathPart of pathParts) {
                currentPath += path.sep + pathPart;
                let folder = currentFolder.folders.find(subfolder => subfolder.name === pathPart);
                if (!folder) {
                    folder = this._createNewFolder(currentPath);
                    currentFolder.folders.push(folder);
                }
                currentFolder = folder;
            }

            currentFolder.objects.splice(
                currentFolder.objects.length,
                0,
                ...Array.from(objects.get(fileName)!.values())
            );
        }

        this._optimizeFolders();
    }

    getFolderData(): IFolder {
        return this._folder;
    }

    private _createNewFolder(folderPath: string): IFolder {
        return {
            folders: [],
            name: path.basename(folderPath),
            objects: [],
            path: folderPath
        };
    }

    private _getPathParts(fileName: string): string[] {
        const parts = fileName.split(path.sep);
        while (parts[0].trim().length === 0) {
            parts.shift();
        }
        return parts;
    }

    private _optimizeFolder(folder: IFolder): void {
        if (folder.folders.length === 0) {
            return;
        }

        while (folder.folders.length === 1 && folder.objects.length === 0) {
            const folderName = folder.name !== '/' ? folder.name : folder.name.substr(1);
            folder.path = folder.folders[0].path;
            folder.name = folderName + path.sep + folder.folders[0].name;
            folder.objects = folder.folders[0].objects;
            folder.folders = folder.folders[0].folders;
        }

        folder.folders.forEach(subfolder => this._optimizeFolder(subfolder));
    }

    private _optimizeFolders(): void {
        this._optimizeFolder(this._folder);
    }
}
