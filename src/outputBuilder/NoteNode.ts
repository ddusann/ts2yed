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
import Node from './Node';

export default class NoteNode extends Node {
    private _content: string;

    constructor(content: string) {
        super();

        this._content = content;
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('node');
        node.setAttribute('id', this.getId());

        const data = node.addNode('data');
        data.setAttribute('key', ElementDescriptions.get('nodeGraphics')!.getId());
        this._generateUmlNode(data);

        return node;
    }

    getHeight(): number {
        return 28;
    }

    getWidth(): number {
        return this._content.length * 7.25 + 40;
    }

    private _generateUmlNode(parent: AbstractNode): AbstractNode {
        const umlNode = parent.addNode('y:UMLNoteNode');
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
        return umlNode;
    }

    private _generateUmlNodeLabel(parent: AbstractNode): AbstractNode {
        const nodeLabel = parent.addNode('y:NodeLabel')
            .setAttribute('alignment', 'center')
            .setAttribute('autoSizePolicy', 'content')
            .setAttribute('fontFamily', 'FreeMono')
            .setAttribute('fontSize', '12')
            .setAttribute('fontStyle', 'plain')
            .setAttribute('hasBackgroundColor', 'false')
            .setAttribute('hasLineColor', 'false')
            .setAttribute('height', '18')
            .setAttribute('horizontalTextPosition', 'center')
            .setAttribute('iconTextGap', '4')
            .setAttribute('modelName', 'custom')
            .setAttribute('textColor', '#000000')
            .setAttribute('verticalTextPosition', 'bottom')
            .setAttribute('visible', 'true')
            .setAttribute('width', '32')
            .setAttribute('x', '0')
            .setAttribute('y', '0');
        nodeLabel.setValue(this._content);
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
}
