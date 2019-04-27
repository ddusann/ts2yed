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
import Folder from './Folder';
import GenericObject from './GenericObject';
import _ from 'lodash';

type FileName = string;

interface IGenericObject {
    isLink: boolean;
    obj: GenericObject;
}

export default class Store {
    private _entities: Map<FileName, Map<string, IGenericObject>>;

    constructor() {
        this._entities = new Map<FileName, Map<string, IGenericObject>>();
    }

    get(fileName: FileName, entityName: string): GenericObject|undefined {
        const file = this._entities.get(fileName);
        if (!file || !file.has(entityName)) {
            return undefined;
        }

        return (file.get(entityName)!.obj);
    }

    getAllEntities(): GenericObject[] {
        return _.uniq(_.flatten(Array.from(this._entities.values())
            .map(file => Array.from(file.values())))
            .map(iObj => iObj.obj));
    }

    getAllNonLinkEntities(): GenericObject[] {
        return _.uniq(_.flatten(Array.from(this._entities.values())
            .map(file => Array.from(file.values())))
            .filter(iObj => !iObj.isLink)
            .map(iObj => iObj.obj));
    }

    getClasses(): Class[] {
        return this.getAllEntities().filter((entity: GenericObject): entity is Class => entity instanceof Class);
    }

    getEntitiesInFolders(): Folder {
        const filteredEntities = new Map<FileName, Map<string, GenericObject>>();
        for (const [fileName, namedObj] of this._entities) {
            if (!filteredEntities.has(fileName)) {
                filteredEntities.set(fileName, new Map<string, GenericObject>());
            }

            for (const [objName, iObj] of namedObj) {
                if (!iObj.isLink) {
                    filteredEntities.get(fileName)!.set(objName, iObj.obj);
                }
            }

            if (filteredEntities.size === 0) {
                filteredEntities.delete(fileName);
            }
        }

        return new Folder(filteredEntities);
    }

    has(fileName: FileName, entityName: string): boolean {
        return this._entities.has(fileName) && this._entities.get(fileName)!.has(entityName);
    }

    put(fileName: FileName, entityName: string, entity: GenericObject): void {
        this._put(fileName, entityName, entity, false);
    }

    putLink(fileName: FileName, entityName: string, entity: GenericObject): void {
        this._put(fileName, entityName, entity, true);
    }

    private _put(fileName: FileName, entityName: string, entity: GenericObject, isLink: boolean): void {
        let file = this._entities.get(fileName);
        if (!file) {
            file = new Map<string, IGenericObject>();
            this._entities.set(fileName, file);
        }

        file.set(entityName, {
            obj: entity,
            isLink
        });
    }
}
