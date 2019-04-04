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
import INode from '../common/INode';
import IdGenerator from './IdGenerator';
import Point from '../common/Point';
import Rectangle from '../common/Rectangle';

export default abstract class Node implements INode {
    private _id: string;
    private _position: Point;
    private _prefix: string;

    constructor() {
        this._id = IdGenerator.get('n');
        this._prefix = '';
        this._position = new Point(0, 0);
    }

    abstract generateNode(parent: AbstractNode): AbstractNode;

    getBoundingRectangle(): Rectangle {
        const width = this.getWidth();
        const height = this.getHeight();
        return new Rectangle(this._position.move(-width / 2, -height / 2), width, height);
    }

    abstract getHeight(): number;

    getId(): string {
        return `${this._prefix}${this._id}`;
    }

    getPosition(): Point {
        return this._position;
    }
    abstract getWidth(): number;

    setPosition(point: Point): void {
        this._position = point;
    }

    setPrefix(prefix: string): void {
        this._prefix = `${prefix}:`;
    }
}
