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

import Document from '../xml/Document';
import ElementDescription from './ElementDescription';
import ElementDescriptions from './ElementDescriptions';
import Graph from './Graph';
import INode from '../common/INode';
import IdGenerator from './IdGenerator';
import Node from '../xml/Node';

export default class UMLFile implements INode {
    private _graph?: Graph;

    constructor() {
        ElementDescriptions.generate();
    }

    generateNode(): Document {
        IdGenerator.reset();

        const doc = new Document('graphml');
        this._setGraphmlAttributes(doc);
        ElementDescriptions.getAll().forEach((value: ElementDescription) => {
            value.generateNode(doc);
        });
        if (this._graph) {
            this._graph.generateNode(doc);
        }
        return doc;
    }

    setGraph(graph: Graph): void {
        this._graph = graph;
    }

    private _setGraphmlAttributes(node: Node): void {
        node.setAttribute('xmlns', 'http://graphml.graphdrawing.org/xmlns');
        node.setAttribute('xmlns:java', 'http://www.yworks.com/xml/yfiles-common/1.0/java');
        node.setAttribute('xmlns:sys', 'http://www.yworks.com/xml/yfiles-common/markup/primitives/2.0');
        node.setAttribute('xmlns:x', 'http://www.yworks.com/xml/yfiles-common/markup/2.0');
        node.setAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance');
        node.setAttribute('xmlns:y', 'http://www.yworks.com/xml/graphml');
        node.setAttribute('xmlns:yed', 'http://www.yworks.com/xml/yed/3');
        node.setAttribute(
            'xsi:schemaLocation',
            'http://graphml.graphdrawing.org/xmlns http://www.yworks.com/xml/schema/graphml/1.1/ygraphml.xsd'
        );
        node.addComment('Created by ts2yed');
    }
}
