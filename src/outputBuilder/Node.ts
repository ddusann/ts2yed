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
import Attribute from './Attribute';
import ElementDescriptions from './ElementDescriptions';
import INode from '../common/INode';
import IdGenerator from './IdGenerator';
import Method from './Method';
import Point from '../common/Point';

export default class Node implements INode {
    private _attributes: Attribute[];
    private _id: string;
    private _methods: Method[];
    private _name: string;
    private _position: Point;

    constructor(name: string) {
        this._id = IdGenerator.get('n');
        this._attributes = [];
        this._methods = [];
        this._name = name;
        this._position = new Point(0, 0);
    }

    addAttribute(attribute: Attribute): void {
        this._attributes.push(attribute);
    }

    addMethod(method: Method): void {
        this._methods.push(method);
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('node');
        node.setAttribute('id', this._id);

        const data = node.addNode('data');
        data.setAttribute('key', ElementDescriptions.get('nodeGraphics')!.getId());
        this._generateUmlNode(data);

        return node;
    }

    getId(): string {
        return this._id;
    }

    getPosition(): Point {
        return this._position;
    }

    private _generateUmlContent(parent: AbstractNode): AbstractNode {
        const umlContent = parent.addNode('y:UML')
            .setAttribute('clipContent', 'true')
            .setAttribute('constraint', '')
            .setAttribute('hasDetailsColor', 'false')
            .setAttribute('omitDetails', 'false')
            .setAttribute('stereotype', '')
            .setAttribute('use3DEffect', 'true');
        umlContent.addNode('y:AttributeLabel').setValue(this._attributes.map(attr => attr.getLabel()).join('\n'));
        umlContent.addNode('y:MethodLabel').setValue(this._methods.map(method => method.getLabel()).join('\n'));

        return umlContent;
    }

    private _generateUmlNode(parent: AbstractNode): AbstractNode {
        const umlNode = parent.addNode('y:UMLClassNode');
        umlNode.addNode('y:Geometry')
            .setAttribute('height', this._getHeight().toString())
            .setAttribute('width', this._getWidth().toString())
            .setAttribute('x', this._position.x.toString())
            .setAttribute('y', this._position.y.toString());
        umlNode.addNode('y:Fill')
            .setAttribute('color', '#FF9900')
            .setAttribute('transparent', 'false');
        umlNode.addNode('y:BorderStyle')
            .setAttribute('color', '#000000')
            .setAttribute('type', 'line')
            .setAttribute('width', '1.0');

        this._generateUmlNodeLabel(umlNode);
        this._generateUmlContent(umlNode);

        return umlNode;
    }

    private _generateUmlNodeLabel(parent: AbstractNode): AbstractNode {
        const nodeLabel = parent.addNode('y:NodeLabel')
            .setAttribute('alignment', 'center')
            .setAttribute('autoSizePolicy', 'content')
            .setAttribute('fontFamily', 'FreeMono')
            .setAttribute('fontSize', '13')
            .setAttribute('fontStyle', 'bold')
            .setAttribute('hasBackgroundColor', 'false')
            .setAttribute('hasLineColor', 'false')
            .setAttribute('height', '19')
            .setAttribute('horizontalTextPosition', 'center')
            .setAttribute('iconTextGap', '4')
            .setAttribute('modelName', 'custom')
            .setAttribute('textColor', '#000000')
            .setAttribute('underlinedText', 'true')
            .setAttribute('verticalTextPosition', 'bottom')
            .setAttribute('visible', 'true')
            .setAttribute('width', '60')
            .setAttribute('x', '0')
            .setAttribute('y', '0');
        nodeLabel.setValue(this._name);
        nodeLabel.addNode('y:LabelModel').addNode('y:SmartNodeLabelModel').setAttribute('distance', '4.0');
        nodeLabel.addNode('y:ModelParameter').addNode('y:SmartNodeLabelModelParameter')
            .setAttribute('labelRatioX', '0.0')
            .setAttribute('labelRatioY', '0.0')
            .setAttribute('nodeRatioX', '0.0')
            .setAttribute('nodeRatioY', '0.0')
            .setAttribute('offsetX', '0.0')
            .setAttribute('offsetY', '0.0')
            .setAttribute('upX', '0.0')
            .setAttribute('upY', '-1.0');

        return nodeLabel;
    }

    private _getHeight(): number {
        return 46 + 14 * (this._attributes.length + this._methods.length);
    }

    private _getWidth(): number {
        const attributeSize = Math.max(...this._attributes.map(attr => attr.getPixelWidth()));
        const methodSize = Math.max(...this._methods.map(attr => attr.getPixelWidth()));
        const titleSize = this._name.length * 8 + 20;

        return Math.max(attributeSize, methodSize, titleSize, 50);
    }
}
