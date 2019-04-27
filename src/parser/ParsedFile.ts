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

import Class from './Class';
import Enum from './Enum';
import Export from './Export';
import FunctionDefinition from './Function';
import Import from './Import';
import Interface from './Interface';
import Type from './types/Type';
import TypeDefinition from './TypeDefinition';

export type FileEntity = Class|Enum|FunctionDefinition|Import|Interface|TypeDefinition;

export interface IExport {
    exportInstance: Export;
    exportType: Type|undefined;
}

export default class ParsedFile {
    private _aliases: Map<string, string>;
    private _classes: Class[];
    private _defaultExport?: Type;
    private _enums: Enum[];
    private _exports: Export[];
    private _functions: FunctionDefinition[];
    private _imports: Import[];
    private _interfaces: Interface[];
    private _mappedObjects: Map<string, FileEntity>;
    private _types: TypeDefinition[];

    constructor() {
        this._aliases = new Map<string, string>();
        this._classes = [];
        this._imports = [];
        this._enums = [];
        this._exports = [];
        this._functions = [];
        this._interfaces = [];
        this._mappedObjects = new Map<string, FileEntity>();
        this._types = [];
    }

    addClass(classStatement: Class): void {
        this._classes.push(classStatement);
        this._mappedObjects.set(classStatement.getName(), classStatement);
    }

    addDefaultExport(defaultExport: Type): void {
        this._defaultExport = defaultExport;
    }

    addEnum(enumStatement: Enum): void {
        this._enums.push(enumStatement);
        this._mappedObjects.set(enumStatement.getName(), enumStatement);
    }

    addExport(exportStatement: Export): void {
        this._exports.push(exportStatement);
    }

    addFunction(functionStatement: FunctionDefinition): void {
        this._functions.push(functionStatement);
        this._mappedObjects.set(functionStatement.getName(), functionStatement);
    }

    addImport(importStatement: Import): void {
        this._imports.push(importStatement);
        const defaultImport = importStatement.getDefaultImport();
        if (defaultImport) {
            this._mappedObjects.set(defaultImport, importStatement);
        }

        importStatement.getExportedNames()
            .map(name => this._aliases.has(name) ? this._aliases.get(name)! : name)
            .forEach(name => this._mappedObjects.set(name, importStatement));
    }

    addInterface(interfaceStatement: Interface) {
        this._interfaces.push(interfaceStatement);
        this._mappedObjects.set(interfaceStatement.getName(), interfaceStatement);
    }

    addType(type: TypeDefinition): void {
        this._types.push(type);
        this._mappedObjects.set(type.getName(), type);
    }

    getClasses(): Class[] {
        return this._classes;
    }

    getDefaultExport(): Type|undefined {
        return this._defaultExport ? this._defaultExport : undefined;
    }

    getDependencyFiles(): string[] {
        return this._imports.map(i => i.getFileName());
    }

    getEntity(name: string, checkAliases: boolean = false): FileEntity|undefined {
        return this._mappedObjects.get((!checkAliases && this._aliases.has(name)) ? this._aliases.get(name)! : name);
    }

    getExportedSymbols(): string[] {
        return Array.from(this._exports).map(exp => exp.getName());
    }

    getImports(): Import[] {
        return this._imports;
    }
}
