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

export interface IImport {
    originalName: string;
    usedName: string;
}

export default class Import {
    private _defaultImport?: string;
    private _fileName: string;
    private _imports: IImport[];

    constructor(fileName: string, defaultImport?: string, imports: IImport[] = []) {
        this._fileName = fileName;
        this._defaultImport = defaultImport;
        this._imports = imports;
    }

    getDefaultImport(): string|undefined {
        return this._defaultImport;
    }

    getExportedNames(): string[] {
        return this._imports.map(importNames => importNames.originalName);
    }

    getFileName(): string {
        return this._fileName;
    }

    getNames(): string[] {
        return this._imports.map(importNames => importNames.usedName);
    }

    unalias(name: string): string {
        const importWithName = this._imports.find(imp => imp.usedName === name);
        return importWithName ? importWithName.originalName : name;
    }
}
