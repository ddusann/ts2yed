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

import AnyObjectType from './AnyObjectType';
import AnyType from './AnyType';
import ArrayType from './ArrayType';
import Attribute from '../Attribute';
import BooleanType from './BooleanType';
import ConditionType from './ConditionType';
import ConstructorFunctionType from './ConstructorFunctionType';
import FunctionType from './FunctionType';
import { IKeyName } from '../Member';
import IntersectionType from './IntersectionType';
import IsType from './IsType';
import ModifierType from '../IModifier';
import NullType from './NullType';
import NumberType from './NumberType';
import ObjectType from './ObjectType';
import OptionalType from './OptionalType';
import Parameter from '../Parameter';
import ParenthesizedType from './ParenthesizedType';
import ReferenceType from './ReferenceType';
import StringLiteralType from './StringLiteralType';
import StringType from './StringType';
import TupleType from './TupleType';
import Type from './Type';
import TypeOfType from './TypeOfType';
import UndefinedType from './UndefinedType';
import UnionType from './UnionType';
import VoidType from './VoidType';
import ts from 'typescript';

export default abstract class TypeParser {
    static isExpressionNode(node: any): boolean {
        return node && node.kind && [
            ts.SyntaxKind.NewExpression,
            ts.SyntaxKind.CallExpression
        ].includes(node.kind);
    }

    static isTypeNode(node: any): boolean {
        return node && node.kind && [
            ts.SyntaxKind.NumberKeyword,
            ts.SyntaxKind.StringKeyword,
            ts.SyntaxKind.BooleanKeyword,
            ts.SyntaxKind.ArrayType,
            ts.SyntaxKind.TypeLiteral,
            ts.SyntaxKind.FunctionType,
            ts.SyntaxKind.TypeReference,
            ts.SyntaxKind.UnionType,
            ts.SyntaxKind.IntersectionType,
            ts.SyntaxKind.ConditionalType,
            ts.SyntaxKind.VoidKeyword,
            ts.SyntaxKind.NullKeyword,
            ts.SyntaxKind.UndefinedKeyword,
            ts.SyntaxKind.TypeParameter,
            ts.SyntaxKind.ParenthesizedType,
            ts.SyntaxKind.TypeQuery,
            ts.SyntaxKind.LiteralType,
            ts.SyntaxKind.AnyKeyword,
            ts.SyntaxKind.NewExpression,
            ts.SyntaxKind.CallExpression,
            ts.SyntaxKind.ObjectKeyword,
            ts.SyntaxKind.TupleType,
            ts.SyntaxKind.OptionalType
        ].includes(node.kind);
    }

    static parse(node: any): Type {
        switch (node.kind) {
            case ts.SyntaxKind.NumberKeyword: return new NumberType();
            case ts.SyntaxKind.StringKeyword: return new StringType();
            case ts.SyntaxKind.BooleanKeyword: return new BooleanType();
            case ts.SyntaxKind.ArrayType: return new ArrayType(TypeParser._parseArray(node));
            case ts.SyntaxKind.TypeLiteral: return new ObjectType(TypeParser._parseAttributes(node));
            case ts.SyntaxKind.FunctionType: return new FunctionType(
                TypeParser._parseParameters(node),
                TypeParser.parse(node.type),
                TypeParser._parseTypeParameters(node)
            );
            case ts.SyntaxKind.TypeReference: return new ReferenceType(
                TypeParser._parseName(node.typeName),
                TypeParser._parseTypeParameters(node)
            );
            case ts.SyntaxKind.UnionType: return new UnionType(TypeParser._parseUnionTypes(node));
            case ts.SyntaxKind.IntersectionType: return new IntersectionType(TypeParser._parseIntersectionTypes(node));
            case ts.SyntaxKind.ConditionalType: return TypeParser._parseConditionType(node);
            case ts.SyntaxKind.VoidKeyword: return new VoidType();
            case ts.SyntaxKind.NullKeyword: return new NullType();
            case ts.SyntaxKind.UndefinedKeyword: return new UndefinedType();
            case ts.SyntaxKind.TypeParameter: return new ReferenceType(
                node.name.text,
                TypeParser._parseTypeParameters(node)
            );
            case ts.SyntaxKind.ParenthesizedType: return new ParenthesizedType(TypeParser.parse(node.type));
            case ts.SyntaxKind.TypeQuery: return new TypeOfType(new ReferenceType(node.exprName.text, []));
            case ts.SyntaxKind.TypePredicate: return new IsType(
                node.parameterName.text,
                TypeParser.parse(node.type)
            );
            case ts.SyntaxKind.LiteralType: return new StringLiteralType(node.literal.text);
            case ts.SyntaxKind.AnyKeyword: return new AnyType();
            case ts.SyntaxKind.NewExpression: return new ReferenceType(
                node.expression.text,
                TypeParser._parseTypeParameters(node)
            );
            case ts.SyntaxKind.CallExpression: return TypeParser._parseCallExpression(node);
            case ts.SyntaxKind.ObjectKeyword: return new AnyObjectType();
            case ts.SyntaxKind.TupleType: return TypeParser._parseTuple(node);
            case ts.SyntaxKind.OptionalType: return new OptionalType(TypeParser.parse(node.type));
            case ts.SyntaxKind.ConstructorType: return new ConstructorFunctionType(
                TypeParser._parseParameters(node),
                TypeParser.parse(node.type),
                TypeParser._parseTypeParameters(node)
            );
            default: throw new Error('Unknown type!');
        }
    }

    private static _parseArray(node: any): Type {
        return TypeParser.parse(node.elementType);
    }

    private static _parseAttributes(node: any): Attribute[] {
        return node.members.map((member: any) => {
            let name: string|IKeyName;
            if (member.kind === ts.SyntaxKind.IndexSignature) {
                name = {
                    name: member.parameters[0].name.text,
                    type: TypeParser.parse(member.parameters[0].type)
                };
            } else {
                name = member.name.text;
            }

            const optional = !!member.questionToken;
            const type = TypeParser.parse(member.type);
            const flags = optional ? [ModifierType.OPTIONAL] : [];
            return new Attribute(name, flags, type);
        });
    }

    private static _parseCallExpression(node: any): ReferenceType {
        let expression = node.expression;
        while (expression.kind === ts.SyntaxKind.PropertyAccessExpression
            || expression.kind === ts.SyntaxKind.NewExpression) {
            expression = expression.expression;
        }

        return new ReferenceType(
            expression.text,
            TypeParser._parseTypeParameters(expression)
        );
    }

    private static _parseConditionType(node: any): ConditionType {
        if (!node.extendsType) {
            throw new Error('Unknown condition type');
        }

        const checkedType = TypeParser.parse(node.checkType);
        const extendedType = TypeParser.parse(node.extendsType);
        const trueType = TypeParser.parse(node.trueType);
        const falseType = TypeParser.parse(node.falseType);

        return new ConditionType(checkedType, extendedType, falseType, trueType);
    }

    private static _parseIntersectionTypes(node: any): Type[] {
        if (!node || !Array.isArray(node.types)) {
            return [];
        }

        return node.types.map((type: any) => TypeParser.parse(type));
    }

    private static _parseName(node: any): string {
        if (node.kind === ts.SyntaxKind.QualifiedName) {
            const left = TypeParser._parseName(node.left);
            const right = TypeParser._parseName(node.right);
            return `${left}.${right}`;
        }

        return node.text;
    }

    private static _parseParameters(node: any): Parameter[] {
        return node.parameters.map((parameter: any) => {
            return new Parameter(parameter.name.text, TypeParser.parse(parameter.type));
        });
    }

    private static _parseTuple(node: any): TupleType {
        const types = Array.isArray(node.elementTypes)
            ? node.elementTypes.map((type: any) => TypeParser.parse(type))
            : [];
        return new TupleType(types);
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

    private static _parseUnionTypes(node: any): Type[] {
        if (!node || !Array.isArray(node.types)) {
            return [];
        }

        return node.types.map((type: any) => TypeParser.parse(type));
    }
}
