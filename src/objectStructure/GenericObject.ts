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

interface IReplacement {
    from: string;
    to: string;
}

export default abstract class GenericObject {
    private _extensions: GenericObject[];
    private _replacements: IReplacement[];
    private _stereotype: string;
    private _usages: GenericObject[];

    constructor(stereotype: string) {
        this._usages = [];
        this._extensions = [];
        this._replacements = [];
        this._stereotype = stereotype;
    }

    addExtension(cls: GenericObject): void {
        this._extensions.push(cls);
    }

    addReplacements(replacements: IReplacement[]): void {
        this._replacements.splice(this._replacements.length, 0, ...replacements);
    }

    addUsage(obj: GenericObject): void {
        this._usages.push(obj);
    }

    getExtensions(): GenericObject[] {
        return this._extensions;
    }

    getReplacements(): IReplacement[] {
        return this._replacements;
    }

    getStereotype(): string {
        return this._stereotype;
    }

    getUsages(): GenericObject[] {
        return this._usages;
    }
}
