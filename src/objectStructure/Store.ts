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
import GenericObject from './GenericObject';

type FileName = string;

export default class Store {
    private _entities: Map<FileName, Map<string, GenericObject>>;

    constructor() {
        this._entities = new Map<FileName, Map<string, GenericObject>>();
    }

    get(fileName: FileName, entityName: string): GenericObject|undefined {
        const file = this._entities.get(fileName);
        if (!file) {
            return undefined;
        }

        return file.get(entityName);
    }

    getAllEntities(): GenericObject[] {
        return Array.from(this._entities.values())
            .map(file => Array.from(file.values()))
            .reduce((acc, val) => acc.concat(val), []);
    }

    getClasses(): Class[] {
        return this.getAllEntities().filter((entity: GenericObject): entity is Class => entity instanceof Class);
    }

    put(fileName: FileName, entityName: string, entity: GenericObject) {
        let file = this._entities.get(fileName);
        if (!file) {
            file = new Map<string, GenericObject>();
            this._entities.set(fileName, file);
        }

        file.set(entityName, entity);
    }
}
