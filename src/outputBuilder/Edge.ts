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
import IdGenerator from './IdGenerator';
import Node from './Node';
import Point from '../common/Point';

export default class Edge implements INode {
    private _id: string;
    private _points: Point[];
    private _source: Node;
    private _sourcePoint: Point;
    private _target: Node;
    private _targetPoint: Point;

    constructor(source: Node, target: Node) {
        this._id = IdGenerator.get('e');
        this._source = source;
        this._sourcePoint = source.getPosition();
        this._target = target;
        this._targetPoint = target.getPosition();
        this._points = [];
    }

    addPoint(point: Point): Edge {
        this._points.push(point);
        return this;
    }

    generateNode(parent: AbstractNode): AbstractNode {
        const edge = parent.addNode('edge');
        edge.setAttribute('id', this._id);
        edge.setAttribute('source', this._source.getId());
        edge.setAttribute('target', this._target.getId());

        const data = edge.addNode('data');
        data.setAttribute('key', ElementDescriptions.get('edgeGraphics')!.getId());

        this._generatePolyLine(data);

        return edge;
    }

    private _generatePath(parent: AbstractNode): AbstractNode {
        const path = parent.addNode('y:Path');
        path.setAttribute('sx', this._sourcePoint.x.toString());
        path.setAttribute('sy', this._sourcePoint.y.toString());
        path.setAttribute('tx', this._targetPoint.x.toString());
        path.setAttribute('ty', this._targetPoint.y.toString());
        this._points.forEach(point => {
            path.addNode('y:Point').setAttribute('x', point.x.toString()).setAttribute('y', point.y.toString());
        });
        return path;
    }

    private _generatePolyLine(parent: AbstractNode): AbstractNode {
        const polyLine = parent.addNode('y:PolyLineEdge');
        this._generatePath(polyLine);
        polyLine.addNode('y:LineStyle')
            .setAttribute('color', '#000000')
            .setAttribute('type', 'line')
            .setAttribute('width', '1.0');
        polyLine.addNode('y:Arrows')
            .setAttribute('source', 'none')
            .setAttribute('target', 'standard');
        polyLine.addNode('y:BendStyle')
            .setAttribute('smoothed', 'false');
        return polyLine;
    }
}
