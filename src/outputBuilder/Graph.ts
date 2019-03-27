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
import ClassNode from './ClassNode';
import Edge from './Edge';
import INode from '../common/INode';
import NoteNode from './NoteNode';

export default class Graph implements INode {
    private _edges: Edge[];
    private _nodes: ClassNode[];
    private _noteNodes: NoteNode[];

    constructor() {
        this._edges = [];
        this._nodes = [];
        this._noteNodes = [];
    }

    addEdge(edge: Edge): void {
        this._edges.push(edge);
    }

    addNode(node: ClassNode): void {
        this._nodes.push(node);
    }

    addNote(noteNode: NoteNode): void {
        this._noteNodes.push(noteNode);
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const graph = parent.addNode('graph');
        graph.setAttribute('edgedefault', 'directed');
        graph.setAttribute('id', 'G');

        this._nodes.forEach(node => {
            node.generateNode(graph);
        });

        this._edges.forEach(edge => {
            edge.generateNode(graph);
        });

        this._noteNodes.forEach(note => {
            note.generateNode(graph);
        });

        return graph;
    }
}
