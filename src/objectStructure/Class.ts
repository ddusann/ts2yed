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
import Property from './Property';
import VisibilityType from './VisibilityType';

export default class Class extends GenericObject {
    private _attributes: Property[];
    private _isAbstract: boolean;
    private _isStatic: boolean;
    private _methods: Property[];
    private _name: string;
    private _visibility: VisibilityType;

    constructor(name: string) {
        super();

        this._attributes = [];
        this._methods = [];
        this._name = name;
        this._visibility = VisibilityType.PUBLIC;
        this._isAbstract = false;
        this._isStatic = false;
    }

    addAttribute(attribute: Property) {
        this._attributes.push(attribute);
    }

    addMethod(method: Property) {
        this._methods.push(method);
    }

    getAttributes(): Property[] {
        return this._attributes;
    }

    getMethods(): Property[] {
        return this._methods;
    }

    getName(): string {
        return this._name;
    }

    getVisibility(): VisibilityType {
        return this._visibility;
    }

    isAbstract(): boolean {
        return this._isAbstract;
    }

    isStatic(): boolean {
        return this._isStatic;
    }
}
