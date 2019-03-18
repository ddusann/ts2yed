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

import Export from './Export';
import ParsedFile from './ParsedFile';
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
            }
        });

        return file;
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
                file.addDefaultExport(names[0]);
            } else {
                names.forEach((name: string) => {
                    file.addExport(new Export(name));
                });
            }
        }
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

    private static _parseNamedImport(node: any): IImport {
        return {
            originalName: node.propertyName ? node.propertyName.text : node.name.text,
            usedName: node.name.text
        };
    }
}
