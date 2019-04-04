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

import AbstractGraph from './AbstractGraph';
import AbstractNode from '../xml/AbstractNode';
import ElementDescriptions from './ElementDescriptions';
import Node from './Node';
import Settings from './Settings';

export default class GroupNode extends Node {
    private _graph: AbstractGraph;
    private _groupName: string;

    constructor(groupName: string, graph: AbstractGraph) {
        super();
        this._graph = graph;
        this._groupName = groupName;
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('node');
        node.setAttribute('id', this.getId());
        node.setAttribute('yfiles.foldertype', 'group');

        const data = node.addNode('data');
        data.setAttribute('key', ElementDescriptions.get('nodeGraphics')!.getId());
        this._generateAutoBoundsNodes(data);

        this._graph.setId(`${this.getId()}:`);
        this._graph.generateNode(node);

        return node;
    }

    getHeight(): number {
        return 1;
    }

    getWidth(): number {
        return 1;
    }

    private _generateAutoBoundsNodes(parent: AbstractNode): AbstractNode {
        const node = parent.addNode('y:ProxyAutoBoundsNode').addNode('y:Realizers');
        node.setAttribute('active', '0');

        this._generateGroupNode(node, false, 15);
        this._generateGroupNode(node, true, 5);

        return node;
    }

    private _generateGroupNode(parent: AbstractNode, closed: boolean, insets: number): AbstractNode {
        const node = parent.addNode('y:GroupNode');

        node.addNode('y:Geometry')
            .setAttribute('height', '1.0')
            .setAttribute('width', '1.0')
            .setAttribute('x', '0.0')
            .setAttribute('y', '0.0');
        node.addNode('y:Fill')
            .setAttribute('color', '#F5F5F5')
            .setAttribute('transparent', 'false');
        node.addNode('y:BorderStyle')
            .setAttribute('color', '#000000')
            .setAttribute('type', 'dashed')
            .setAttribute('width', '1.0');
        node.addNode('y:NodeLabel')
            .setAttribute('alignment', 'right')
            .setAttribute('autoSizePolicy', 'node width')
            .setAttribute('backgroundColor', '#EBEBEB')
            .setAttribute('borderDistance', '0.0')
            .setAttribute('fontFamily', Settings.getSettings().getFontFamily())
            .setAttribute('fontSize', '15')
            .setAttribute('fontStyle', 'plain')
            .setAttribute('hasLineColor', 'false')
            .setAttribute('height', '1.0')
            .setAttribute('horizontalTextPosition', 'center')
            .setAttribute('iconTextGap', '4')
            .setAttribute('modelName', 'internal')
            .setAttribute('modelPosition', 't')
            .setAttribute('textColor', '#000000')
            .setAttribute('verticalTextPosition', 'bottom')
            .setAttribute('visible', 'true')
            .setAttribute('width', '1.0')
            .setAttribute('x', '0.0')
            .setAttribute('y', '0.0')
            .setValue(this._groupName);
        node.addNode('y:Shape')
            .setAttribute('type', 'roundrectangle');
        node.addNode('y:State')
            .setAttribute('closed', closed.toString())
            .setAttribute('closedHeight', '50.0')
            .setAttribute('closedWidth', '50.0')
            .setAttribute('innerGraphDisplayEnabled', 'false');
        const insetsString = insets.toString();
        node.addNode('y:Insets')
            .setAttribute('bottom', insetsString)
            .setAttribute('bottomF', `${insetsString}.0`)
            .setAttribute('left', insetsString)
            .setAttribute('leftF', `${insetsString}.0`)
            .setAttribute('right', insetsString)
            .setAttribute('rightF', `${insetsString}.0`)
            .setAttribute('top', insetsString)
            .setAttribute('topF', `${insetsString}.0`);
        node.addNode('y:BorderInsets')
            .setAttribute('bottom', '0')
            .setAttribute('bottomF', '0.0')
            .setAttribute('left', '0')
            .setAttribute('leftF', '0.0')
            .setAttribute('right', '0')
            .setAttribute('rightF', '0.0')
            .setAttribute('top', '0')
            .setAttribute('topF', '0.0');

        return node;
    }
}
