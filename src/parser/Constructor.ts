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

import Member, { IKeyName } from './Member';

import IModifier from './IModifier';
import MemberWithParameters from './MemberWithParameters';
import NotDefinedType from './types/NotDefinedType';
import Parameter from './Parameter';
import ReferenceType from './types/ReferenceType';
import Type from './types/Type';

export default class Constructor extends MemberWithParameters {
    private _typeParameters: ReferenceType[];

    constructor(
        modifiers: IModifier[],
        parameters: Parameter[],
        typeParameters: ReferenceType[]
    ) {
        super('constructor', modifiers, parameters, new NotDefinedType());
        this._typeParameters = typeParameters;
    }

    getReferenceTypes(): ReferenceType[] {
        const superTypes = super.getReferenceTypes();
        const constructorTypes = this.getParameters().map(param => param.getReferenceTypes())
            .concat(this._typeParameters.map(param => param.getReferenceTypes()))
            .reduce((acc, types) => acc.concat(types), [])
            .filter((type: Type): type is ReferenceType => type instanceof ReferenceType);

        return superTypes.concat(constructorTypes);
    }
}
