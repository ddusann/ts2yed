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

import ParsedFile, { FileEntity } from '../parser/ParsedFile';

import BidirectedForest from '../common/BidirectedForest';
import Class from '../parser/Class';
import Import from '../parser/Import';
import Interface from '../parser/Interface';
import ParsedFunction from '../parser/Function';
import TypeDefinition from '../parser/TypeDefinition';

export default class FileEntityDependency {
    private _dependencies: BidirectedForest<string>;

    constructor(parsedFile: ParsedFile) {
        this._dependencies = new BidirectedForest<string>();

        const checkedSymbols: string[] = [];
        const fileExports = parsedFile.getExportedSymbols();
        const fileDeafultExportType = parsedFile.getDefaultExport();
        if (fileDeafultExportType) {
            fileExports.splice(
                fileExports.length,
                0,
                ...fileDeafultExportType.getReferenceTypes().map(ref => ref.getTypeName([], false))
            );
        }
        const symbolsToCheck = Array.from(fileExports);
        while (symbolsToCheck.length > 0) {
            const fileExportSymbol = symbolsToCheck.pop()!;
            checkedSymbols.push(fileExportSymbol);
            this._dependencies.addNode(fileExportSymbol);
            const fileEntity = parsedFile.getEntity(fileExportSymbol);

            if (this._mayContainSubtypes(fileEntity)) {
                fileEntity.getAllReferences().forEach(entityReferences => {
                    entityReferences.getReferenceTypes().forEach(entityReference => {
                        const entitySymbol = entityReference.getTypeName([], true);
                        if (entitySymbol === fileExportSymbol) {
                            return;
                        }

                        const entity = parsedFile.getEntity(entitySymbol);

                        if (entity) {
                            this._dependencies.addRelation(fileExportSymbol, entitySymbol);

                            if (!(entity instanceof Import)) {
                                if (!checkedSymbols.includes(entitySymbol) && !symbolsToCheck.includes(entitySymbol)) {
                                    symbolsToCheck.push(entitySymbol);
                                }
                            }
                        }
                    });
                });
            }
        }
    }

    getSymbol(): string {
        const sym = this._dependencies.takeNoChildNode();
        if (!sym) {
            throw new Error('There\'s no more symbols!');
        }

        return sym;
    }

    hasSymbols(): boolean {
        return this._dependencies.hasNodes();
    }

    private _mayContainSubtypes(entity: FileEntity|undefined): entity is Class|Interface|TypeDefinition|ParsedFunction {
        return entity instanceof Class
            || entity instanceof Interface
            || entity instanceof TypeDefinition
            || entity instanceof ParsedFunction;
    }
}
