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

import xmlbuilder from 'xmlbuilder';

interface IAttribute {
    attributeName: string;
    attributeValue: string;
}

interface IXmlAttributes {
    [attributeName: string]: string;
}

export default class Node {
    protected readonly _tagName: string;
    private _attributes: IAttribute[];
    private _children: Node[];
    private _value?: string;

    constructor(tagName: string) {
        this._tagName = tagName;
        this._attributes = [];
        this._children = [];
    }

    addNode(tagName: string): Node {
        const newNode = new Node(tagName);
        this._children.push(newNode);
        return newNode;
    }

    setAttribute(key: string, value: string): Node {
        this._attributes.push({
            attributeName: key,
            attributeValue: value
        });
        return this;
    }

    setValue(value: string) {
        this._value = value;
    }

    protected _generateChildren(xmlElement: xmlbuilder.XMLElementOrXMLNode): void {
        this._children.forEach(child => {
            child._getElement(xmlElement);
        });
    }

    protected _getAttributes(): IXmlAttributes {
        const attributes: IXmlAttributes = {};
        this._attributes.forEach(attribute => {
            attributes[attribute.attributeName] = attribute.attributeValue;
        });
        return attributes;
    }

    protected _getElement(parent: xmlbuilder.XMLElementOrXMLNode): xmlbuilder.XMLElementOrXMLNode {
        const xmlElement = parent.ele(this._tagName, this._getAttributes(), this._value);
        this._generateChildren(xmlElement);
        return xmlElement;
    }
}
