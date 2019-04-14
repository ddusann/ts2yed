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

import Import, { IImport } from './Import';

import Attribute from './Attribute';
import Class from './Class';
import Constructor from './Constructor';
import Enum from './Enum';
import Export from './Export';
import FunctionDefinition from './Function';
import Getter from './Getter';
import Interface from './Interface';
import Member from './Member';
import Method from './Method';
import ModifierType from './IModifier';
import NotDefinedType from './types/NotDefinedType';
import Parameter from './Parameter';
import ParsedFile from './ParsedFile';
import ReferenceType from './types/ReferenceType';
import Setter from './Setter';
import Type from './types/Type';
import TypeDefinition from './TypeDefinition';
import TypeParser from './types/TypeParser';
import _ from 'lodash';
import ts from 'typescript';

export default abstract class FileParser {
    static parse(node: any): ParsedFile {
        const file = new ParsedFile();
        if (!node || !Array.isArray(node.statements)) {
            return file;
        }

        node.statements.forEach((statement: any) => {
            this._parseExport(statement, file);

            switch (statement.kind) {
                case ts.SyntaxKind.ImportDeclaration:
                    file.addImport(FileParser._parseImport(statement));
                    break;
                case ts.SyntaxKind.TypeAliasDeclaration:
                    file.addType(FileParser._parseTypeDefinition(statement));
                    break;
                case ts.SyntaxKind.EnumDeclaration:
                    file.addEnum(FileParser._parseEnum(statement));
                    break;
                case ts.SyntaxKind.InterfaceDeclaration:
                    file.addInterface(FileParser._parseInterface(statement));
                    break;
                case ts.SyntaxKind.ClassDeclaration:
                    file.addClass(FileParser._parseClass(statement));
                    break;
                case ts.SyntaxKind.FunctionDeclaration:
                    file.addFunction(FileParser._parseFunction(statement));
                    break;
            }
        });

        return file;
    }

    private static _findReferenceTypes(obj: any): ReferenceType[] {
        const references: ReferenceType[] = [];
        const findNestedReferenceTypes = (item: any): ReferenceType[] => {
            if (!TypeParser.isTypeNode(item)) {
                return FileParser._findReferenceTypes(item);
            } else {
                const rfcs: ReferenceType[] = [];
                const type = TypeParser.parse(item);
                rfcs.splice(rfcs.length, 0, ...type.getReferenceTypes() as ReferenceType[]);

                if (TypeParser.isExpressionNode(item)) {
                    rfcs.splice(rfcs.length, 0, ...FileParser._findReferenceTypes(item));
                }
                return rfcs;
            }
        };

        if (Array.isArray(obj)) {
            references.splice(references.length, 0, ..._.flatten(obj.map(item => {
                return findNestedReferenceTypes(item);
            })));
        } else if (typeof obj === 'object') {
            for (const propertyName in obj) {
                if (propertyName === 'parent') {
                    continue;
                }

                references.splice(references.length, 0, ...findNestedReferenceTypes(obj[propertyName]));
            }
        } else {
            return [];
        }

        return Type.makeReferenceTypeUnique(references) as ReferenceType[];
    }

    private static _parseClass(node: any): Class {
        const className = node.name.text;
        const typeParameters = this._parseTypeParameters(node);
        const members = Array.isArray(node.members)
            ? node.members.map((member: any) => this._parseMember(member))
            : [];
        const extensions = FileParser._parseHeritage(node, ts.SyntaxKind.ExtendsKeyword);
        const implementations = FileParser._parseHeritage(node, ts.SyntaxKind.ImplementsKeyword);
        const modifiers = FileParser._parseModifiers(node);
        const allReferences = FileParser._findReferenceTypes(node);

        return new Class(className, members, modifiers, allReferences, extensions, implementations, typeParameters);
    }

    private static _parseEnum(node: any): Enum {
        const values = node.members.map((member: any) => member.name.text);
        return new Enum(node.name.text, values);
    }

    private static _parseExport(node: any, file: ParsedFile): void {
        if (!node
            || ((!node.modifiers || !Array.isArray(node.modifiers)) && node.kind !== ts.SyntaxKind.ExportAssignment)
        ) {
            return;
        }

        let isDefault = !!(node.kind === ts.SyntaxKind.ExportAssignment);
        let isExport = !!(node.kind === ts.SyntaxKind.ExportAssignment);
        let names: any[] = [];

        if (node.kind === ts.SyntaxKind.ExportAssignment) {
            names = [node.expression.text];
        } else {
            node.modifiers.find((modifier: any) => {
                if (node.declarationList && Array.isArray(node.declarationList.declarations)) {
                    names = node.declarationList.declarations.map((declaration: any) => declaration.name.text);
                } else if (node.name) {
                    names = [node.name.text];
                }

                if (modifier.kind === ts.SyntaxKind.ExportKeyword) {
                    isExport = true;
                } else if (modifier.kind === ts.SyntaxKind.DefaultKeyword) {
                    isDefault = true;
                }
            });
        }

        if (isExport) {
            if (isDefault) {
                if (names.length === 0) {
                    throw new Error('Unknown default export');
                }
                file.addDefaultExport(new Export(names[0]));
            } else {
                names.forEach((name: string) => {
                    file.addExport(new Export(name));
                });
            }
        }
    }

    private static _parseFunction(node: any): FunctionDefinition {
        const name = node.name ? node.name.text : undefined;
        const parameters = FileParser._parseParameters(node);
        const typeParameters = FileParser._parseTypeParameters(node);
        const type = TypeParser.parse(node.type);

        return new FunctionDefinition(parameters, type, typeParameters, name);
    }

    private static _parseHeritage(
        node: any,
        heritageType: ts.SyntaxKind.ImplementsKeyword|ts.SyntaxKind.ExtendsKeyword
    ): ReferenceType[] {
        if (!node || !node.heritageClauses) {
            return [];
        }

        const heritage = node.heritageClauses.find((clause: any) => clause.token === heritageType);
        if (!heritage) {
            return [];
        }

        return heritage.types.map((type: any) =>
            new ReferenceType(type.expression.text, Array.isArray(type.typeArguments)
                ? type.typeArguments.map((arg: any) => TypeParser.parse(arg))
                : []));
    }

    private static _parseImport(node: any): Import {
        const fileName = node.moduleSpecifier.text;
        const defaultImport = node.importClause.name ? node.importClause.name.text : undefined;
        const imports = node.importClause.namedBindings
            ? Array.isArray(node.importClause.namedBindings.elements)
                ? node.importClause.namedBindings.elements.map(FileParser._parseNamedImport)
                : [FileParser._parseNamedImport(node.importClause.namedBindings)]
            : [];
        return new Import(fileName, defaultImport, imports);
    }

    private static _parseInterface(node: any): Interface {
        const ifcName = node.name.text;
        const members = node.members
            ? node.members.map((member: any) => FileParser._parseMember(member))
            : [];
        const extensions = (node.heritageClauses
            ? node.heritageClauses.map((clause: any) => Array.isArray(clause.types)
                ? clause.types.map((type: any) => {
                    const typeName = type.expression.text;
                    const types = Array.isArray(type.typeArguments)
                        ? type.typeArguments.map((arg: any) => TypeParser.parse(arg))
                        : [];
                    return new ReferenceType(typeName, types);
                })
                : [])
            : []).reduce((acc: string[], item: string[]) => acc.concat(...item), []);
        const typeParameters = FileParser._parseTypeParameters(node);

        return new Interface(ifcName, members, extensions, typeParameters);
    }

    private static _parseMember(node: any): Member {
        const modifiers = FileParser._parseModifiers(node);
        const type = node.type ? TypeParser.parse(node.type) : new NotDefinedType();

        switch (node.kind) {
            case ts.SyntaxKind.MethodSignature:
            case ts.SyntaxKind.MethodDeclaration:
                return new Method(
                    node.name.text,
                    modifiers,
                    FileParser._parseParameters(node),
                    type,
                    FileParser._parseTypeParameters(node)
                );
            case ts.SyntaxKind.GetAccessor: return new Getter(node.name.text, modifiers, type);
            case ts.SyntaxKind.SetAccessor:
                return new Setter(node.name.text, modifiers, FileParser._parseParameters(node));
            case ts.SyntaxKind.Constructor:
                return new Constructor(
                    modifiers,
                    FileParser._parseParameters(node),
                    FileParser._parseTypeParameters(node)
                );
            case ts.SyntaxKind.PropertySignature:
            case ts.SyntaxKind.PropertyDeclaration:
                return new Attribute(node.name.text, modifiers, type);
            case ts.SyntaxKind.IndexSignature:
                return new Attribute({
                    name: node.parameters[0].name.text,
                    type: TypeParser.parse(node.parameters[0].type)
                }, modifiers, type, true);
            default: throw new Error('Unknown member!');
        }
    }

    private static _parseModifiers(node: any): ModifierType[] {
        const modifiers = node.questionToken ? [ModifierType.OPTIONAL] : [];

        if (!node || !Array.isArray(node.modifiers)) {
            return modifiers;
        }

        return node.modifiers.map((modifier: any): ModifierType|null => {
            switch (modifier.kind) {
                case ts.SyntaxKind.PrivateKeyword: return ModifierType.PRIVATE;
                case ts.SyntaxKind.ProtectedKeyword: return ModifierType.PROTECTED;
                case ts.SyntaxKind.PublicKeyword: return ModifierType.PUBLIC;
                case ts.SyntaxKind.StaticKeyword: return ModifierType.STATIC;
                case ts.SyntaxKind.AbstractKeyword: return ModifierType.ABSTRACT;
                case ts.SyntaxKind.ReadonlyKeyword: return ModifierType.READONLY;
                default: return null;
            }
        }).filter((modifier: ModifierType|null) => modifier !== null).concat(modifiers);
    }

    private static _parseNamedImport(node: any): IImport {
        return {
            originalName: node.propertyName ? node.propertyName.text : node.name.text,
            usedName: node.name.text
        };
    }

    private static _parseParameters(node: any): Parameter[] {
        return node.parameters.map((parameter: any) => {
            return new Parameter(parameter.name.text, TypeParser.parse(parameter.type));
        });
    }

    private static _parseTypeDefinition(node: any): TypeDefinition {
        return new TypeDefinition(node.name.text, TypeParser.parse(node.type), FileParser._parseTypeParameters(node));
    }

    private static _parseTypeParameters(node: any): ReferenceType[] {
        if (!node || !node.typeParameters) {
            return [];
        }

        return node.typeParameters.map((param: any) =>
            new ReferenceType(param.name.text, FileParser._parseTypeParameters(param)));
    }
}
