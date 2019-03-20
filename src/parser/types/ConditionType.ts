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

import Type, { IReplacement, TypeCategory } from './Type';

export default class ConditionType extends Type {
    private _checkedType: Type;
    private _extendsType: Type;
    private _falseType: Type;
    private _trueType: Type;

    constructor(checkedType: Type, extendsType: Type, falseType: Type, trueType: Type) {
        super();

        this._checkedType = checkedType;
        this._extendsType = extendsType;
        this._falseType = falseType;
        this._trueType = trueType;
    }

    getReferenceTypes(): Type[] {
        const checked = this._checkedType.getReferenceTypes();
        const referenceTypes = this._extendsType.getReferenceTypes()
            .concat(this._trueType.getReferenceTypes())
            .concat(this._falseType.getReferenceTypes());
        return Type.makeReferenceTypeUnique(referenceTypes.filter(type => !checked.includes(type)));
    }

    getType(): TypeCategory {
        return TypeCategory.CONDITION;
    }

    getTypeName(replacements: IReplacement[]): string {
        return `${this._checkedType.getTypeName(replacements)} extends ` +
            `${this._extendsType.getTypeName(replacements)} ` +
            `? ${this._trueType.getTypeName(replacements)} : ${this._falseType.getTypeName(replacements)}`;
    }
}
