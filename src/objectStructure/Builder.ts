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

import Class from './Class';
import Edge from '../outputBuilder/Edge';
import FileDependency from './FileDependency';
import { FileEntity } from '../parser/ParsedFile';
import FileEntityDependency from './FileEntityDependency';
import GenericObject from './GenericObject';
import Graph from '../outputBuilder/Graph';
import { IReplacement } from '../parser/types/Type';
import Node from '../outputBuilder/Node';
import OutputBuilderProperty from '../outputBuilder/Property';
import ParsedClass from '../parser/Class';
import Property from './Property';
import Store from './Store';
import VisibilityType from './VisibilityType';
import fs from 'fs';
import path from 'path';

type FileName = string;

interface IDependency {
    dependencies: FileName[];
    entity: FileEntity;
}

export default class Builder {
    private _classes: Class[];
    private _directory: string;
    private _entityStore: Store;
    private _files: IParsedFile[];

    constructor(directory: string) {
        this._classes = [];
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
        });

        return graph;
    }

    private _addEntity(fileName: FileName, entity: FileEntity, replacements: IReplacement[] = []) {
        if (entity instanceof ParsedClass) {
            const newClass = new Class(entity.getName());
            this._entityStore.put(fileName, entity.getName(), newClass);

            newClass.setObjectParameters(entity.getTypeParameters().map(tp => tp.getTypeName([], false)));
            const classTypeParameterReferences = _.chain(entity.getTypeParameters())
                .map(tp => tp.getReferenceTypes())
                .flatten()
                .uniq()
                .map(type => type.getTypeName([], false))
                .value();

            replacements = replacements.filter(replacement => !classTypeParameterReferences.includes(replacement.from));

            entity.getAttributes().forEach(attribute => {
                newClass.addAttribute(new Property(
                    attribute.getName(replacements),
                    VisibilityType.PUBLIC,
                    attribute.getType().getTypeName(replacements, false))
                );
            });

            entity.getMethods().forEach(method => {
                const methodTypeParameterReferences = _.chain(method.getTypeParameters())
                    .map(tp => tp.getReferenceTypes())
                    .flatten()
                    .uniq()
                    .map(type => type.getTypeName([], false))
                    .value();
                const methodReplacements = replacements.filter(replacement =>
                    !methodTypeParameterReferences.includes(replacement.from));

                newClass.addMethod(new Property(
                    method.getName(methodReplacements),
                    VisibilityType.PUBLIC,
                    method.getType().getTypeName(methodReplacements, false))
                );
            });

            const usages = entity.getUsages();
            usages.forEach(usage => {
                const usageObject = this._entityStore.get(fileName, usage.getTypeName([], false));
                if (!usageObject) {
                    return;
                }

                newClass.addUsage(usageObject);
            });
        }
    }

    private _addImportsIntoStore(fileName: string): IReplacement[] {
        const replacements: IReplacement[] = [];
        const parsedFile = this._files.find(file => file.fileName === fileName)!.file;
        parsedFile.getImports().forEach(imp => {
            const importFilePath = this._getAbsolutePaths(path.dirname(fileName), [imp.getFileName()])[0];
            const defaultImport = imp.getDefaultImport();
            if (defaultImport) {
                const importedParsedFileObj = this._files.find(file => file.fileName === importFilePath);
                if (!importedParsedFileObj) {
                    throw new Error(`Unknown file '${importFilePath}'!`);
                }
                const importedParsedFile = importedParsedFileObj.file;
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
            // TODO aliased imports
        });

        return replacements;
    }

    private _createClassGraphNode(cls: Class): Node {
        const node = new Node(cls.getName());

        cls.getAttributes()
            .forEach(attribute =>
                node.addAttribute(new OutputBuilderProperty(attribute.getName(), 'public', attribute.getType())));

        cls.getMethods()
            .forEach(method => node.addMethod(new OutputBuilderProperty(method.getName(), 'public', method.getType())));

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
