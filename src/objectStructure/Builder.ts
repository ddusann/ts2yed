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

import Parser, { IParsedFile } from '../parser/Parser';

import Attribute from '../parser/Attribute';
import Class from './Class';
import Constructor from '../parser/Constructor';
import Edge from '../outputBuilder/Edge';
import FileDependency from './FileDependency';
import { FileEntity } from '../parser/ParsedFile';
import FileEntityDependency from './FileEntityDependency';
import GenericObject from './GenericObject';
import Getter from '../parser/Getter';
import Graph from '../outputBuilder/Graph';
import { IReplacement } from '../parser/types/Type';
import Method from '../parser/Method';
import Node from '../outputBuilder/Node';
import OutputBuilderProperty from '../outputBuilder/Property';
import ParsedClass from '../parser/Class';
import Property from './Property';
import ReferenceType from '../parser/types/ReferenceType';
import Setter from '../parser/Setter';
import Store from './Store';
import VisibilityType from '../VisibilityType';
import fs from 'fs';
import path from 'path';

type FileName = string;

export default class Builder {
    private _directory: string;
    private _entityStore: Store;
    private _files: IParsedFile[];

    constructor(directory: string) {
        this._directory = path.isAbsolute(directory) ? directory : path.join(process.cwd(), directory);
        this._entityStore = new Store();
        this._files = [];
    }

    async parse(): Promise<Graph> {
        const sourceFileList = await this._getFileList(this._directory);
        this._files = await new Parser(sourceFileList).getFiles();
        const tsFileList = new FileDependency();
        this._files.forEach(file => {
            tsFileList.addDependencies(
                file.fileName,
                this._getAbsolutePaths(path.dirname(file.fileName), file.file.getDependencyFiles())
            );
        });

        while (tsFileList.hasFile()) {
            const fileName = tsFileList.getFile();
            const replacements = this._addImportsIntoStore(fileName);
            const parsedFile = this._files.find(file => file.fileName === fileName)!.file;
            const fileEntityDependencies = new FileEntityDependency(parsedFile);
            while (fileEntityDependencies.hasSymbols()) {
                const fileEntitySymbol = fileEntityDependencies.getSymbol();
                const entity = parsedFile.getEntity(fileEntitySymbol);
                if (!entity) {
                    throw new Error('Unknown entity!');
                }

                this._addEntity(fileName, entity, replacements);
            }
        }

        const graph = new Graph();
        const graphNodes = new Map<GenericObject, Node>();
        this._entityStore.getClasses().forEach(cls => {
            const graphClass = this._createClassGraphNode(cls);
            graph.addNode(graphClass);
            graphNodes.set(cls, graphClass);
        });

        this._entityStore.getAllEntities().forEach(entity => {
            entity.getUsages().forEach(usage => {
                const entityGraphNode = graphNodes.get(entity);
                const usageGraphNode = graphNodes.get(usage);
                if (!entityGraphNode || !usageGraphNode) {
                    throw new Error('Graph nodes not found!');
                }

                graph.addEdge(new Edge(entityGraphNode, usageGraphNode, 'usage'));
            });

            entity.getExtensions().forEach(extension => {
                const entityGraphNode = graphNodes.get(entity);
                const usageGraphNode = graphNodes.get(extension);
                if (!entityGraphNode || !usageGraphNode) {
                    throw new Error('Graph nodes not found!');
                }

                graph.addEdge(new Edge(entityGraphNode, usageGraphNode, 'inheritance'));
            });
        });

        return graph;
    }

    private _addAttributesIntoClass(attributes: Attribute[], cls: Class, replacements: IReplacement[]): void {
        attributes.forEach(attribute => {
            let name = `${attribute.getName(replacements)}`;
            if (attribute.isStatic()) {
                name = `static ${name}`;
            }
            if (attribute.isReadOnly()) {
                name = `readonly ${name}`;
            }
            if (attribute.isOptional()) {
                name = `${name}?`;
            }

            cls.addAttribute(new Property(
                name,
                attribute.getVisibilityType() || VisibilityType.PUBLIC,
                attribute.getType().getTypeName(replacements, false))
            );
        });
    }

    private _addClassTypeParameters(
        parameters: ReferenceType[],
        cls: Class,
        replacements: IReplacement[]
    ): IReplacement[] {
        cls.setObjectParameters(parameters.map(tp => tp.getTypeName([], false)));
        const classTypeParameterReferences = _.chain(parameters)
            .map(tp => tp.getReferenceTypes())
            .flatten()
            .uniq()
            .map(type => type.getTypeName([], false))
            .value();

        return replacements.filter(replacement => !classTypeParameterReferences.includes(replacement.from));
    }

    private _addConstructorIntoClass(ctor: Constructor, cls: Class, replacements: IReplacement[]): void {
        cls.addMethod(new Property(
            'constructor',
            ctor.getVisibilityType() || VisibilityType.PUBLIC,
            '',
            ctor.getParameters().map(parameter => ({
                name: parameter.getName(),
                type: parameter.getType().getTypeName(replacements, false)
            }))
        ));
    }

    private _addEntity(fileName: FileName, entity: FileEntity, replacements: IReplacement[] = []) {
        if (entity instanceof ParsedClass) {
            const typeList = entity.getTypeParameters().map(tp => tp.getTypeName([], false));
            const typeListInString = typeList.length > 0 ? `<${typeList.join(', ')}>` : '';
            const newClass = new Class(entity.getName() + typeListInString, entity.isAbstract());

            this._entityStore.put(fileName, entity.getName(), newClass);

            replacements = this._addClassTypeParameters(entity.getTypeParameters(), newClass, replacements);

            this._addAttributesIntoClass(entity.getAttributes(), newClass, replacements);

            const ctor = entity.getConstructor();
            if (ctor) {
                this._addConstructorIntoClass(ctor, newClass, replacements);
            }

            this._addGettersIntoClass(entity.getGetters(), newClass, replacements);
            this._addSettersIntoClass(entity.getSetters(), newClass, replacements);
            this._addMethodsIntoClass(entity.getMethods(), newClass, replacements);

            this._addUsagesIntoClass(entity.getUsages(), newClass, fileName);
            this._addExtensionsIntoClass(entity.getExtensions(), newClass, fileName);
        }
    }

    private _addExtensionsIntoClass(extensions: ReferenceType[], cls: Class, fileName: FileName): void {
        extensions.forEach(extension => {
            const usageObject = this._entityStore.get(fileName, extension.getTypeName([], true));
            if (!usageObject) {
                return;
            }

            cls.addExtension(usageObject);
        });
    }

    private _addGettersIntoClass(getters: Getter[], cls: Class, replacements: IReplacement[]): void {
        getters.forEach(getter => {
            let name = `getter ${getter.getName(replacements)}`;
            if (getter.isStatic()) {
                name = `static ${name}`;
            }
            if (getter.isAbstract()) {
                name = `abstract ${name}`;
            }

            cls.addMethod(new Property(
                name,
                getter.getVisibilityType() || VisibilityType.PUBLIC,
                getter.getType().getTypeName(replacements, false))
            );
        });
    }

    private _addImportsIntoStore(fileName: string): IReplacement[] {
        const replacements: IReplacement[] = [];
        const parsedFile = this._files.find(file => file.fileName === fileName)!.file;
        parsedFile.getImports().forEach(imp => {
            const importFilePath = this._getAbsolutePaths(path.dirname(fileName), [imp.getFileName()])[0];
            const importedParsedFileObj = this._files.find(file => file.fileName === importFilePath);
            if (!importedParsedFileObj) {
                throw new Error(`Unknown file '${importFilePath}'!`);
            }

            const importedParsedFile = importedParsedFileObj.file;
            const defaultImport = imp.getDefaultImport();
            if (defaultImport) {
                const importedParsedFileDefaultExport = importedParsedFile.getDefaultExport();
                if (importedParsedFileDefaultExport) {
                    replacements.push({ from: defaultImport, to: importedParsedFileDefaultExport });
                    const builtObject = this._entityStore.get(importFilePath, importedParsedFileDefaultExport);
                    if (!builtObject) {
                        throw new Error('Default export not found!');
                    }
                    this._entityStore.put(fileName, defaultImport, builtObject);
                }
            }

            imp.getNames().forEach(importName => {
                const originalName = imp.unalias(importName);
                if (importName !== originalName) {
                    replacements.push({ from: importName, to: originalName });
                }

                const builtObject = this._entityStore.get(importFilePath, originalName);
                if (!builtObject) {
                    throw new Error('Exported symbol not found!');
                }
                this._entityStore.put(fileName, importName, builtObject);
            });
        });

        return replacements;
    }

    private _addMethodsIntoClass(methods: Method[], cls: Class, replacements: IReplacement[]): void {
        methods.forEach(method => {
            const methodTypeParameterReferences = _.chain(method.getTypeParameters())
                .map(tp => tp.getReferenceTypes())
                .flatten()
                .uniq()
                .map(type => type.getTypeName([], false))
                .value();
            const methodReplacements = replacements.filter(replacement =>
                !methodTypeParameterReferences.includes(replacement.from));

            const parameters = method.getParameters().map(parameter => ({
                name: parameter.getName(),
                type: parameter.getType().getTypeName(methodReplacements, false)
            }));

            let name = `${method.getName(replacements)}`;
            if (method.isStatic()) {
                name = `static ${name}`;
            }
            if (method.isAbstract()) {
                name = `abstract ${name}`;
            }

            cls.addMethod(new Property(
                name,
                method.getVisibilityType() || VisibilityType.PUBLIC,
                method.getType().getTypeName(methodReplacements, false),
                parameters)
            );
        });
    }

    private _addSettersIntoClass(setters: Setter[], cls: Class, replacements: IReplacement[]): void {
        setters.forEach(setter => {
            const parameters = setter.getParameters().map(parameter => ({
                name: parameter.getName(),
                type: parameter.getType().getTypeName(replacements, false)
            }));

            let name = `setter ${setter.getName(replacements)}`;
            if (setter.isStatic()) {
                name = `static ${name}`;
            }
            if (setter.isAbstract()) {
                name = `abstract ${name}`;
            }

            cls.addMethod(new Property(
                name,
                setter.getVisibilityType() || VisibilityType.PUBLIC,
                setter.getType().getTypeName(replacements, false),
                parameters));
        });
    }

    private _addUsagesIntoClass(usages: ReferenceType[], cls: Class, fileName: FileName): void {
        usages.forEach(usage => {
            const usageObject = this._entityStore.get(fileName, usage.getTypeName([], true));
            if (!usageObject) {
                return;
            }

            cls.addUsage(usageObject);
        });
    }

    private _createClassGraphNode(cls: Class): Node {
        const node = new Node(cls.getName(), cls.getStereotype());

        cls.getAttributes()
            .forEach(attribute =>
                node.addAttribute(new OutputBuilderProperty(
                    attribute.getName(),
                    attribute.getVisibility(),
                    attribute.getType()
                )));

        cls.getMethods().forEach(method => {
            const parameters = method.getParameters()
                .map(parameter => `${parameter.name}: ${parameter.type}`)
                .join(', ');

            node.addMethod(
                new OutputBuilderProperty(`${method.getName()}(${parameters})`,
                method.getVisibility(),
                method.getType()
            ));
        });

        return node;
    }

    private _getAbsolutePaths(fileDirectory: string, paths: string[]): string[] {
        return paths.map(usedPath => {
            return this._getRealFileName(path.isAbsolute(usedPath) ? usedPath : path.join(fileDirectory, usedPath));
        }).filter((usedPath): usedPath is string => usedPath !== undefined);
    }

    private async _getFileList(directory: string): Promise<string[]> {
        return new Promise((resolve, reject) => {
            fs.readdir(directory, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(new Error(err.message));
                    return;
                }

                const dirNames = files.filter(file => file.isDirectory()).map(file => path.join(directory, file.name));
                const fileNames = files.filter(file => file.isFile()).map(file => path.join(directory, file.name));
                const subFileNamePromises = dirNames.map(subDirectory => this._getFileList(subDirectory));

                Promise.all(subFileNamePromises).then(subFileNamesByDir => {
                    subFileNamesByDir.forEach(subFileNames => fileNames.splice(fileNames.length, 0, ...subFileNames));
                }).then(() => {
                    resolve(fileNames);
                });
            });
        });
    }

    private _getRealFileName(fileName: string): string|undefined {
        const supportedExtensions = ['.ts'];
        if (fs.existsSync(fileName)) {
            return fileName;
        }

        const fileNameObject = path.parse(fileName);
        delete fileNameObject.base;
        const correctExtension = supportedExtensions.find(extension => {
            fileNameObject.ext = extension;
            return fs.existsSync(path.format(fileNameObject));
        });

        if (!correctExtension) {
            return undefined;
        }

        fileNameObject.ext = correctExtension;
        return path.format(fileNameObject);
    }
}
