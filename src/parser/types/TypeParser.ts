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

import Attribute, { PropertyType } from '../Attribute';

import ArrayType from './ArrayType';
import BooleanType from './BooleanType';
import FunctionType from './FunctionType';
import NumberType from './NumberType';
import ObjectType from './ObjectType';
import Parameter from '../Parameter';
import ReferenceType from './ReferenceType';
import StringType from './StringType';
import Type from './Type';
import ts from 'typescript';

export default abstract class TypeParser {
    static parse(node: any): Type {
        switch (node.kind) {
            case ts.SyntaxKind.NumberKeyword: return new NumberType();
            case ts.SyntaxKind.StringKeyword: return new StringType();
            case ts.SyntaxKind.BooleanKeyword: return new BooleanType();
            case ts.SyntaxKind.ArrayType: return new ArrayType(this._parseArray(node));
            case ts.SyntaxKind.TypeLiteral: return new ObjectType(this._parseAttributes(node));
            case ts.SyntaxKind.FunctionType: return new FunctionType(
                this._parseParameters(node),
                TypeParser.parse(node.type),
                this._parseTypeParameters(node)
            );
            case ts.SyntaxKind.TypeReference: return new ReferenceType(node.name.text);
            default: throw new Error('Unknown type!');
        }
    }

    private static _parseArray(node: any): Type {
        return TypeParser.parse(node.elementType);
    }

    private static _parseAttributes(node: any): Attribute[] {
        return node.members.map((member: any) => {
            const name = member.name.text;
            const optional = !!member.questionToken;
            const type = TypeParser.parse(member.type);
            const flags = optional ? [PropertyType.OPTIONAL] : [];
            return new Attribute(name, flags, type);
        });
    }

    private static _parseParameters(node: any): Parameter[] {
        return node.parameters.map((parameter: any) => {
            return new Parameter(parameter.name.text, TypeParser.parse(parameter.type));
        });
    }

    private static _parseTypeParameters(node: any): Type[] {
        if (!Array.isArray(node.typeParameters) && !Array.isArray(node.typeArguments)) {
            return [];
        }

        const parameters = Array.isArray(node.typeParameters)
            ? node.typeParameters
            : node.typeArguments;

        return parameters.map((parameter: any) => {
            return TypeParser.parse(parameter);
        });
    }
}
