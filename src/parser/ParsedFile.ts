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

import Export from './Export';
import Import from './Import';
import TypeDefinition from './TypeDefinition';

export default class ParsedFile {
    private _defaultExport?: Export;
    private _exports: Export[];
    private _imports: Import[];
    private _types: TypeDefinition[];

    constructor() {
        this._imports = [];
        this._exports = [];
        this._types = [];
    }

    addDefaultExport(defaultExport: Export): void {
        this._defaultExport = defaultExport;
    }

    addExport(exportStatement: Export): void {
        this._exports.push(exportStatement);
    }

    addImport(importStatement: Import): void {
        this._imports.push(importStatement);
    }

    addType(type: TypeDefinition): void {
        this._types.push(type);
    }
}
