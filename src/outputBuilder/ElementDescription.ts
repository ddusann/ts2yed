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

import AbstractNode from '../xml/AbstractNode';
import INode from '../common/INode';
import IdGenerator from './IdGenerator';

export default class ElementDescription implements INode {
    private _attrName?: string;
    private _attrType?: string;
    private _forElement: string;
    private _id: string;
    private _yFilesType?: string;

    constructor(forElement: string, attrName?: string, attrType?: string, yFilesType?: string) {
        this._id = IdGenerator.get('d');
        this._forElement = forElement;
        this._attrName = attrName;
        this._attrType = attrType;
        this._yFilesType = yFilesType;
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('key');
        node.setAttribute('id', this._id);
        node.setAttribute('for', this._forElement);
        if (this._attrName) {
            node.setAttribute('attr.name', this._attrName);
        }
        if (this._attrType) {
            node.setAttribute('attr.type', this._attrType);
        }
        if (this._yFilesType) {
            node.setAttribute('yfiles.type', this._yFilesType);
        }
        return node;
    }

    getId(): string {
        return this._id;
    }
}
