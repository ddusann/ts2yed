/**
 * Copyright (c) 2019-2020 Dušan Kováčik
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

export default class Settings {
    private static _settings?: Settings;

    static getSettings(): Settings {
        if (!Settings._settings) {
            Settings._settings = new Settings();
        }

        return Settings._settings;
    }

    private _classNamesOnly: boolean;
    private _fontFamily: string;
    private _hidePrivateMembers: boolean;

    private constructor() {
        this._classNamesOnly = false;
        this._hidePrivateMembers = true;
        this._fontFamily = 'FreeMono';
    }

    getClassNamesOnly(): boolean {
        return this._classNamesOnly;
    }

    getFontFamily(): string {
        return this._fontFamily;
    }

    getHidePrivateMembers(): boolean {
        return this._hidePrivateMembers;
    }

    setClassNamesOnly(classNamesOnly: boolean): void {
        this._classNamesOnly = classNamesOnly;
    }

    setFontFamily(font: string): void {
        this._fontFamily = font;
    }

    setHidePrivateMembers(hide: boolean): void {
        this._hidePrivateMembers = hide;
    }
}
