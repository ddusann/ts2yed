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

import Type, { IReplacement } from './types/Type';

import ModifierType from './IModifier';
import ReferenceType from './types/ReferenceType';
import VisibilityType from '../VisibilityType';

export interface IKeyName {
    name: string;
    type: Type;
}

export default abstract class Member {
    private _isKey: boolean;
    private _memberTypes: ModifierType[];
    private _name: string|IKeyName;
    private _type: Type;

    constructor(name: string|IKeyName, modifiers: ModifierType[], type: Type, isKey: boolean = false) {
        this._name = name;
        this._memberTypes = modifiers;
        this._type = type;
        this._isKey = isKey;
    }

    getName(replacements: IReplacement[]): string {
        return typeof this._name === 'string'
            ? this._name
            : `[${this._name.name}: ${this._name.type.getTypeName(replacements, false)}]`;
    }

    getReferenceTypes(): ReferenceType[] {
        return this._type.getReferenceTypes()
            .filter((type: Type): type is ReferenceType => type instanceof ReferenceType);
    }

    getType(): Type {
        return this._type;
    }

    getVisibilityType(): VisibilityType|undefined {
        if (this._memberTypes.includes(ModifierType.PRIVATE)) {
            return VisibilityType.PRIVATE;
        } else if (this._memberTypes.includes(ModifierType.PROTECTED)) {
            return VisibilityType.PROTECTED;
        } else if (this._memberTypes.includes(ModifierType.PUBLIC)) {
            return VisibilityType.PUBLIC;
        } else {
            return undefined;
        }
    }

    isOptional(): boolean {
        return this._memberTypes.includes(ModifierType.OPTIONAL);
    }
}
