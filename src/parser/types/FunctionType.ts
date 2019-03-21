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

import * as _ from 'lodash';

import Type, { IReplacement, TypeCategory } from './Type';

import Parameter from '../Parameter';

export default class FunctionType extends Type {
    private _parameters: Parameter[];
    private _returnType: Type;
    private _typeParameters: Type[];

    constructor(parameters: Parameter[], returnType: Type, typeParameters: Type[]) {
        super();

        this._parameters = parameters;
        this._returnType = returnType;
        this._typeParameters = typeParameters;
    }

    getReferenceTypes(): Type[] {
        return Type.makeReferenceTypeUnique(this._returnType.getReferenceTypes()
            .concat(this._typeParameters.map(param => param.getReferenceTypes())
                .concat(this._parameters.map(parameter => parameter.getReferenceTypes()))
                .reduce((acc, types) => acc.concat(types), [])
            )
        );
    }

    getType(): TypeCategory {
        return TypeCategory.FUNCTION;
    }

    getTypeName(replacements: IReplacement[], hideTypeParameters: boolean): string {
        const typeParameterReferences = _.chain(this._typeParameters)
            .map(tp => tp.getReferenceTypes())
            .flatten()
            .uniq()
            .map(type => type.getTypeName([], hideTypeParameters))
            .value();
        const functionReplacements = replacements.filter(replacement =>
            !typeParameterReferences.includes(replacement.from));

        const parameters = this._parameters
            .map(param => `${param.getName()}: ` +
                `${param.getType().getTypeName(functionReplacements, hideTypeParameters)}`)
            .join(', ');
        const typeParameterList =
            this._typeParameters.map(param => param.getTypeName(functionReplacements, hideTypeParameters)).join(', ');
        const typeParameters = typeParameterList ? `<${typeParameterList}>` : '';

        return `${typeParameters}(${parameters}) => ` +
            `${this._returnType.getTypeName(functionReplacements, hideTypeParameters)}`;
    }
}
