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
import ElementDescriptions from './ElementDescriptions';
import INode from '../common/INode';
import Node from './Node';
import Property from './Property';
import Rectangle from '../common/Rectangle';

export default class ClassNode extends Node implements INode {
    private _attributes: (Property|string)[];
    private _methods: Property[];
    private _name: string;
    private _stereotype: string;

    constructor(name: string, stereotype: string) {
        super();

        this._attributes = [];
        this._methods = [];
        this._name = name;
        this._stereotype = stereotype;
    }

    addAttribute(attribute: Property): void {
        this._attributes.push(attribute);
    }

    addLine(line: string): void {
        this._attributes.push(line);
    }

    addMethod(method: Property): void {
        this._methods.push(method);
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('node');
        node.setAttribute('id', this.getId());

        const data = node.addNode('data');
        data.setAttribute('key', ElementDescriptions.get('nodeGraphics')!.getId());
        this._generateUmlNode(data);

        return node;
    }

    getBoundingRectangle(): Rectangle {
        const width = this.getWidth();
        const height = this.getHeight();
        return new Rectangle(this.getPosition().move(-width / 2, -height / 2), width, height);
    }

    getHeight(): number {
        let height = 46 + 14 * (this._attributes.length + this._methods.length);
        if (this._stereotype !== '') {
            height += 20;
        }
        return height;
    }

    getWidth(): number {
        const attributeSize = Math.max(...this._attributes
            .map(attr => this._getPixelWidth(attr instanceof Property ? attr.getLabel() : attr))
        );
        const methodSize = Math.max(...this._methods.map(attr => this._getPixelWidth(attr.getLabel())));

        const titleSize = this._name.length * 8 + 20;
        const stereotypeSize = (this._stereotype.length + 4) * 7.5 + 20;

        return Math.max(attributeSize, methodSize, titleSize, stereotypeSize, 50);
    }

    private _generateUmlContent(parent: AbstractNode): AbstractNode {
        const umlContent = parent.addNode('y:UML')
            .setAttribute('clipContent', 'true')
            .setAttribute('constraint', '')
            .setAttribute('hasDetailsColor', 'false')
            .setAttribute('omitDetails', 'false')
            .setAttribute('stereotype', this._stereotype)
            .setAttribute('use3DEffect', 'true');
        umlContent.addNode('y:AttributeLabel').setValue(this._attributes.map(attr => { 
            return attr instanceof Property ? attr.getLabel() : attr;
        }).join('\n'));
        umlContent.addNode('y:MethodLabel').setValue(this._methods.map(method => method.getLabel()).join('\n'));

        return umlContent;
    }

    private _generateUmlNode(parent: AbstractNode): AbstractNode {
        const umlNode = parent.addNode('y:UMLClassNode');
        umlNode.addNode('y:Geometry')
            .setAttribute('height', this.getHeight().toString())
            .setAttribute('width', this.getWidth().toString())
            .setAttribute('x', this.getPosition().x.toString())
            .setAttribute('y', this.getPosition().y.toString());
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

    private _getPixelWidth(text: string): number {
        return 20 + text.length * 7.3;
    }
}
