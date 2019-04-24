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

import Parser, { IParsedFile } from '../parser/Parser';

import Attribute from '../parser/Attribute';
import Class from './Class';
import Constructor from '../parser/Constructor';
import Enum from './Enum';
import FileDependency from './FileDependency';
import { FileEntity } from '../parser/ParsedFile';
import FileEntityDependency from './FileEntityDependency';
import Folder from './Folder';
import Function from './Function';
import GenericObject from './GenericObject';
import GenericObjectDeclaration from './GenericObjectDeclaration';
import Getter from '../parser/Getter';
import IParameter from './IParameter';
import { IReplacement } from '../parser/types/Type';
import Interface from './Interface';
import Method from '../parser/Method';
import ParsedClass from '../parser/Class';
import ParsedEnum from '../parser/Enum';
import ParsedInterface from '../parser/Interface';
import ParserFunction from '../parser/Function';
import Property from './Property';
import ReferenceType from '../parser/types/ReferenceType';
import Setter from '../parser/Setter';
import Store from './Store';
import TypeAlias from './TypeAlias';
import TypeDefinition from '../parser/TypeDefinition';
import VisibilityType from '../VisibilityType';
import _ from 'lodash';
import fs from 'fs';
import path from 'path';

type FileName = string;

interface IAlias {
    from: string;
    to: string;
}

export default class Builder {
    private _aliases: IAlias[];
    private _entityStore: Store;
    private _files: IParsedFile[];
    private _paths: string[];

    constructor(paths: string|string[]) {
        if (!Array.isArray(paths)) {
            paths = [paths];
        }

        this._entityStore = new Store();
        this._files = [];
        this._aliases = [];

        this._paths = paths
            .filter(userPath => fs.existsSync(userPath))
            .map(userPath => path.isAbsolute(userPath) ? userPath : path.join(process.cwd(), userPath));
    }

    addAlias(alias: string, realPath: string): void {
        if (!path.isAbsolute(realPath)) {
            throw new Error('Alias must have an absolute path!');
        }

        this._aliases.push({ from: alias, to: realPath });
    }

    getAlias(alias: string): string|undefined {
        const storedObj = this._aliases.find(storedAlias => storedAlias.from === alias);
        return storedObj ? storedObj.to : undefined;
    }

    async parse(): Promise<Folder> {
        if (this._paths.length === 0) {
            return this._entityStore.getEntitiesInFolders();
        }

        const sourceFileList = await this._getFileList(this._paths);
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
            const parsedFile = this._files.find(file => file.fileName === fileName);
            if (!parsedFile) {
                console.debug(`'${fileName}' was not selected to be parsed!`);
                continue;
            }

            const replacements = this._addImportsIntoStore(fileName);
            const fileEntityDependencies = new FileEntityDependency(parsedFile.file);
            while (fileEntityDependencies.hasSymbols()) {
                const fileEntitySymbol = fileEntityDependencies.getSymbol();
                const entity = parsedFile.file.getEntity(fileEntitySymbol);
                if (!entity) {
                    throw new Error('Unknown entity!');
                }

                this._addEntity(fileName, entity, replacements);
            }
        }

        return this._entityStore.getEntitiesInFolders();
    }

    private _addAttributes(
        attributes: Attribute[],
        objDeclaration: GenericObjectDeclaration,
        replacements: IReplacement[]
    ): void {
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

            objDeclaration.addAttribute(new Property(
                name,
                attribute.getVisibilityType() || VisibilityType.PUBLIC,
                attribute.getType().getTypeName(replacements, false))
            );
        });
    }

    private _addClass(fileName: FileName, parsedClass: ParsedClass, replacements: IReplacement[] = []): void {
        const newClass = new Class(this._getNameWithTypeParameters(parsedClass), parsedClass.isAbstract());
        this._entityStore.put(fileName, parsedClass.getName(), newClass);

        replacements = this._removeOverlappedReplacements(parsedClass.getTypeParameters(), replacements);

        const ctor = parsedClass.getConstructor();
        if (ctor) {
            this._addConstructorIntoClass(ctor, newClass, replacements);
        }

        this._addAttributes(parsedClass.getAttributes(), newClass, replacements);
        this._addGettersIntoClass(parsedClass.getGetters(), newClass, replacements);
        this._addSettersIntoClass(parsedClass.getSetters(), newClass, replacements);
        this._addMethods(parsedClass.getMethods(), newClass, replacements);

        this._addUsages(parsedClass.getUsages(), newClass, fileName);
        this._addImplementations(parsedClass.getImplementations(), newClass, fileName);
        this._addExtensions(parsedClass.getExtensions(), newClass, fileName);
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

    private _addEntity(fileName: FileName, entity: FileEntity, replacements: IReplacement[] = []): void {
        if (entity instanceof ParsedClass) {
            this._addClass(fileName, entity, replacements);
        } else if (entity instanceof ParsedInterface) {
            this._addInterface(fileName, entity, replacements);
        } else if (entity instanceof ParsedEnum) {
            this._addEnum(fileName, entity);
        } else if (entity instanceof TypeDefinition) {
            this._addTypeDefinition(fileName, entity, replacements);
        } else if (entity instanceof ParserFunction) {
            this._addFunction(fileName, entity, replacements);
        }
    }

    private _addEnum(fileName: FileName, parsedEnum: ParsedEnum): void {
        const newEnum = new Enum(parsedEnum.getName());
        this._entityStore.put(fileName, parsedEnum.getName(), newEnum);

        parsedEnum.getValues().forEach(value => newEnum.addValue(value));
    }

    private _addExtensions(extensions: ReferenceType[], obj: GenericObject, fileName: FileName): void {
        extensions.forEach(extension => {
            const usageObject = this._entityStore.get(fileName, extension.getTypeName([], true));
            if (!usageObject) {
                return;
            }

            obj.addExtension(usageObject);
        });
    }

    private _addFunction(fileName: FileName, parsedFunc: ParserFunction, replacements: IReplacement[] = []): void {
        const parameters = parsedFunc.getParameters().map<IParameter>(parameter => ({
            name: parameter.getName(),
            type: parameter.getType().getTypeName(replacements, false)
        }));
        const typeParameters = parsedFunc.getTypeParameters().map(parameter => {
            return parameter.getTypeName(replacements, false);
        });
        const type = parsedFunc.getType().getTypeName(replacements, false);
        const newFunction = new Function(parsedFunc.getName(), parameters, typeParameters, type);
        this._entityStore.put(fileName, parsedFunc.getName(), newFunction);

        this._addUsages(parsedFunc.getUsages(), newFunction, fileName);
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

    private _addImplementations(implementations: ReferenceType[], obj: GenericObject, fileName: FileName): void {
        implementations.forEach(extension => {
            const implementedObject = this._entityStore.get(fileName, extension.getTypeName([], true));
            if (!implementedObject) {
                return;
            }

            obj.addImplementation(implementedObject);
        });
    }

    private _addImportsIntoStore(fileName: string): IReplacement[] {
        const replacements: IReplacement[] = [];
        const parsedFile = this._files.find(file => file.fileName === fileName)!.file;
        parsedFile.getImports().forEach(imp => {
            let importFileName = imp.getFileName();
            if (importFileName[0] !== '.') {
                const alias = importFileName.split(path.sep)[0];
                const aliasedPath = this.getAlias(alias);
                if (!aliasedPath) {
                    if (importFileName[0] === '@') {
                        console.warn(`Path "${importFileName}" looks like an aliased path, but without real path set!`);
                    }
                    return;
                }
                importFileName = `${aliasedPath}${path.sep}${importFileName.substring(alias.length + 1)}`;
            }

            const importFilePath = this._getAbsolutePaths(path.dirname(fileName), [importFileName])[0];
            const importedParsedFileObj = this._files.find(file => file.fileName === importFilePath);
            if (!importedParsedFileObj) {
                console.debug(`'${importFilePath}' was not selected to be parsed!`);
                return;
            }

            const importedParsedFile = importedParsedFileObj.file;
            const defaultImport = imp.getDefaultImport();
            if (defaultImport) {
                const importedParsedFileDefaultExport = importedParsedFile.getDefaultExport();
                if (importedParsedFileDefaultExport) {
                    const importedDefaultExportType = importedParsedFileDefaultExport.getReferenceTypes()[0];
                    const importedDefaultExportTypeName = importedDefaultExportType.getTypeName(replacements, true);
                    const builtObject = this._entityStore.get(importFilePath, importedDefaultExportTypeName);
                    if (!builtObject) {
                        throw new Error('Default export not found!');
                    }
                    replacements.push({
                        from: defaultImport,
                        to: importedParsedFileDefaultExport.getTypeName(replacements, false)
                    });
                    this._entityStore.putLink(fileName, defaultImport, builtObject);
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
                this._entityStore.putLink(fileName, importName, builtObject);
            });
        });

        return replacements;
    }

    private _addInterface(fileName: FileName, parsedIfc: ParsedInterface, replacements: IReplacement[] = []): void {
        const newIfc = new Interface(this._getNameWithTypeParameters(parsedIfc));
        this._entityStore.put(fileName, parsedIfc.getName(), newIfc);

        replacements = this._removeOverlappedReplacements(parsedIfc.getTypeParameters(), replacements);

        this._addAttributes(parsedIfc.getAttributes(), newIfc, replacements);
        this._addMethods(parsedIfc.getMethods(), newIfc, replacements);

        this._addUsages(parsedIfc.getUsages(), newIfc, fileName);
        this._addExtensions(parsedIfc.getExtensions(), newIfc, fileName);
    }

    private _addMethods(
        methods: Method[],
        objDeclaration: GenericObjectDeclaration,
        replacements: IReplacement[]
    ): void {
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

            objDeclaration.addMethod(new Property(
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

    private _addTypeDefinition(fileName: FileName, parsedType: TypeDefinition, replacements: IReplacement[]): void {
        replacements = this._removeOverlappedReplacements(parsedType.getTypeParameters(), replacements);
        const typeAlias = parsedType.getType().getTypeName(replacements, false);
        const name = this._getNameWithTypeParameters(parsedType);
        const newTypeAlias = new TypeAlias(name, typeAlias);

        this._addUsages(parsedType.getUsages(), newTypeAlias, fileName);
        this._entityStore.put(fileName, parsedType.getName(), newTypeAlias);
    }

    private _addUsages(usages: ReferenceType[], obj: GenericObject, fileName: FileName): void {
        const objName = obj.getName();

        usages.forEach(usage => {
            const usageObjectName = usage.getTypeName([], true);
            if (objName === usageObjectName) {
                return;
            }

            const usageObject = this._entityStore.get(fileName, usageObjectName);
            if (!usageObject) {
                return;
            }

            obj.addUsage(usageObject);
        });
    }

    private _getAbsolutePaths(fileDirectory: string, paths: string[]): string[] {
        return paths.map(usedPath => {
            const alias = usedPath.split(path.sep)[0];
            const aliasedPath = this.getAlias(alias);
            if (aliasedPath) {
                usedPath = `${aliasedPath}${path.sep}${usedPath.substring(alias.length + 1)}`;
            } else if (usedPath[0] === '@') {
                console.warn(`Path "${usedPath}" looks like an aliased path, but without real path set!`);
            }

            return this._getRealFileName(path.isAbsolute(usedPath) ? usedPath : path.join(fileDirectory, usedPath));
        }).filter((usedPath): usedPath is string => usedPath !== undefined);
    }

    private async _getFileList(paths: string[]): Promise<string[]> {
        interface IPathIsDir {
            filePath: string;
            isDir: boolean;
        }

        const isDirPromises = paths.map(filePath => new Promise<IPathIsDir>((resolve, reject) => {
            fs.stat(filePath, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }

                resolve({
                    filePath,
                    isDir: stats.isDirectory()
                });
            });
        }));

        const dirFilePathPromises = isDirPromises.map(isDirPromise => {
            return isDirPromise.then(result => {
                if (!result.isDir) {
                    return [result.filePath];
                }

                return new Promise<string[]>((resolve, reject) => {
                    fs.readdir(result.filePath, { withFileTypes: true }, (err, files) => {
                        if (err) {
                            reject(new Error(err.message));
                            return;
                        }

                        const dirNames = files
                            .filter(file => file.isDirectory())
                            .map(file => path.join(result.filePath, file.name));
                        const fileNames = files
                            .filter(file => file.isFile() && path.extname(file.name) === '.ts')
                            .map(file => path.join(result.filePath, file.name));
                        const subFileNamePromises = dirNames.map(subDirectory => this._getFileList([subDirectory]));

                        Promise.all(subFileNamePromises).then(subFileNamesByDir => {
                            subFileNamesByDir.forEach(subFileNames => {
                                return fileNames.splice(fileNames.length, 0, ...subFileNames);
                            });
                        }).then(() => {
                            resolve(fileNames);
                        });
                    });
                });
            });
        });

        const uniqFilePaths = new Set<string>();
        return Promise.all(dirFilePathPromises).then(dirFilePaths => {
            dirFilePaths.forEach(filePaths => {
                filePaths.forEach(filePath => {
                    uniqFilePaths.add(filePath);
                });
            });
        }).then(() => {
            return Array.from(uniqFilePaths);
        });
    }

    private _getNameWithTypeParameters(cls: ParsedClass|ParsedInterface|TypeDefinition): string {
        const typeList = cls.getTypeParameters().map(tp => tp.getTypeName([], false));
        const typeListInString = typeList.length > 0 ? `<${typeList.join(', ')}>` : '';
        return cls.getName() + typeListInString;
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

    private _removeOverlappedReplacements(
        parameters: ReferenceType[],
        replacements: IReplacement[]
    ): IReplacement[] {
        const classTypeParameterReferences = _.chain(parameters)
            .map(tp => tp.getReferenceTypes())
            .flatten()
            .uniq()
            .map(type => type.getTypeName([], false))
            .value();

        return replacements.filter(replacement => !classTypeParameterReferences.includes(replacement.from));
    }
}
