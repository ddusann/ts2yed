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

import Parameter from './Parameter';
import ReferenceType from './types/ReferenceType';
import Type from './types/Type';
import _ from 'lodash';

export interface IKeyName {
    name: string;
    type: Type;
}

export default class Function {
    private static _anonymousCounter = 0;

    private _name: string;
    private _parameters: Parameter[];
    private _type: Type;
    private _typeParameters: ReferenceType[];

    constructor(
        parameters: Parameter[],
        type: Type,
        typeParameters: ReferenceType[],
        name?: string
    ) {
        this._name = name ? name : `_anonymous_${++Function._anonymousCounter}_`;
        this._type = type;
        this._parameters = parameters;
        this._typeParameters = typeParameters;
    }

    getAllReferences(): ReferenceType[] {
        return this.getUsages();
    }

    getName(): string {
        return this._name;
    }

    getParameters(): Parameter[] {
        return this._parameters;
    }

    getType(): Type {
        return this._type;
    }

    getTypeParameters(): ReferenceType[] {
        return this._typeParameters;
    }

    getUsages(): ReferenceType[] {
        return Type.makeReferenceTypeUnique(this._type.getReferenceTypes()
            .concat(_.flatten(this._parameters.map(param => param.getReferenceTypes())))
            .concat(_.flatten(this._typeParameters.map(param => param.getReferenceTypes())))) as ReferenceType[];
    }
}
