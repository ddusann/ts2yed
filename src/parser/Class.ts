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

import Attribute from './Attribute';
import Constructor from './Constructor';
import Getter from './Getter';
import Member from './Member';
import Method from './Method';
import ModifierType from './IModifier';
import ReferenceType from './types/ReferenceType';
import Setter from './Setter';
import Type from './types/Type';

export default class Class {
    private _extensions: ReferenceType[];
    private _implementations: ReferenceType[];
    private _members: Member[];
    private _modifiers: ModifierType[];
    private _name: string;
    private _typeParameters: ReferenceType[];

    constructor(
        name: string,
        members: Member[],
        modifiers: ModifierType[],
        extensions: ReferenceType[],
        implementations: ReferenceType[],
        typeParameters: ReferenceType[]
    ) {
        this._name = name;
        this._members = members;
        this._modifiers = modifiers;
        this._extensions = extensions;
        this._implementations = implementations;
        this._typeParameters = typeParameters;
    }

    getAttributes(): Attribute[] {
        return this._members.filter((member: Member): member is Attribute => member instanceof Attribute);
    }

    getConstructor(): Constructor|undefined {
        return this._members.find((member: Member): member is Constructor => member instanceof Constructor);
    }

    getExtensions(): ReferenceType[] {
        return this._extensions;
    }

    getGetters(): Getter[] {
        return this._members.filter((member: Member): member is Getter => member instanceof Getter);
    }

    getImplementations(): ReferenceType[] {
        return this._implementations;
    }

    getMethods(): Method[] {
        return this._members.filter((member: Member): member is Method => member instanceof Method);
    }

    getName(): string {
        return this._name;
    }

    getSetters(): Setter[] {
        return this._members.filter((member: Member): member is Setter => member instanceof Setter);
    }

    getTypeParameters(): ReferenceType[] {
        return this._typeParameters;
    }

    getUsages(): ReferenceType[] {
        return Type.makeReferenceTypeUnique(
            this._members.map(member => member.getReferenceTypes()).reduce((acc, types) => acc.concat(types), [])
        ) as ReferenceType[];
    }

    isAbstract(): boolean {
        return this._modifiers.includes(ModifierType.ABSTRACT);
    }
}
