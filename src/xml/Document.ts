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

import Node from './Node';
import fs from 'fs';
import xmlbuilder from 'xmlbuilder';

interface IDocumentAttributes {
    [key: string]: string;
}

export default class Document extends Node {
    private _encoding: string;
    private _standalone: boolean;
    private _version: string;

    constructor(tagName: string, version: string = '1.0', encoding: string = 'UTF-8', standalone: boolean = false) {
        super(tagName);
        this._version = version;
        this._encoding = encoding;
        this._standalone = standalone;
    }

    save(filepath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const file = this._getElement().end({ pretty: false });
            fs.writeFile(filepath, file, { encoding: 'utf-8' }, (err => {
                if (err) {
                    reject(new Error(err.message));
                    return;
                }

                resolve();
            }));
        });
    }

    protected _getElement(): xmlbuilder.XMLElementOrXMLNode {
        const xmlElement = xmlbuilder.create(this._tagName).dec(this._version, this._encoding, this._standalone);
        const attributes = this._getAttributes();
        Object.keys(attributes).forEach(key => {
            xmlElement.attribute(key, attributes[key]);
        });
        this._generateChildren(xmlElement);
        return xmlElement;
    }
}
