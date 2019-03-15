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

type EdgeType = 'usage'|'implementation'|'inheritance';

export default class Edge implements INode {
    private _edgeType: EdgeType;
    private _id: string;
    private _points: Point[];
    private _source: Node;
    private _sourceDPoint: Point;
    private _target: Node;
    private _targetDPoint: Point;

    constructor(source: Node, target: Node, edgeType: EdgeType = 'usage') {
        this._id = IdGenerator.get('e');
        this._source = source;
        this._sourceDPoint = new Point(0, 0);
        this._target = target;
        this._targetDPoint = new Point(0, 0);
        this._points = [];
        this._edgeType = edgeType;
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

    setSourceDPoint(dPoint: Point): void {
        this._sourceDPoint = dPoint;
    }

    setTargetDPoint(dPoint: Point): void {
        this._targetDPoint = dPoint;
    }

    private _generatePath(parent: AbstractNode): AbstractNode {
        const path = parent.addNode('y:Path');
        path.setAttribute('sx', this._sourceDPoint.x.toString());
        path.setAttribute('sy', this._sourceDPoint.y.toString());
        path.setAttribute('tx', this._targetDPoint.x.toString());
        path.setAttribute('ty', this._targetDPoint.y.toString());
        this._points.forEach(point => {
            path.addNode('y:Point').setAttribute('x', point.x.toString()).setAttribute('y', point.y.toString());
        });
        return path;
    }

    private _generatePolyLine(parent: AbstractNode): AbstractNode {
        const polyLine = parent.addNode('y:PolyLineEdge');
        this._generatePath(polyLine);
        polyLine.addNode('y:LineStyle')
            .setAttribute('color', this._getArrowColor())
            .setAttribute('type', this._getArrowStyle())
            .setAttribute('width', '1.0');
        polyLine.addNode('y:Arrows')
            .setAttribute('source', 'none')
            .setAttribute('target', this._getArrowType());
        polyLine.addNode('y:BendStyle')
            .setAttribute('smoothed', 'false');
        return polyLine;
    }

    private _getArrowColor(): string {
        switch (this._edgeType) {
            case 'implementation': return '#0000FF';
            case 'inheritance': return '#FF0000';
            default: return '#000000';
        }
    }

    private _getArrowStyle(): string {
        switch (this._edgeType) {
            case 'implementation': return 'dashed';
            default: return 'line';
        }
    }

    private _getArrowType(): string {
        switch (this._edgeType) {
            case 'implementation': return 'white_delta';
            case 'inheritance': return 'white_delta';
            default: return 'standard';
        }
    }
}
