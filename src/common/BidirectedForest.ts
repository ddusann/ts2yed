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

interface INode<NodeType> {
    leaves: INode<NodeType>[];
    node: NodeType;
    parents: INode<NodeType>[];
}

export default class BidirectedForest<NodeType> {
    private _allNodes: Map<NodeType, INode<NodeType>>;
    private _noChildNodes: INode<NodeType>[];

    constructor() {
        this._allNodes = new Map<NodeType, INode<NodeType>>();
        this._noChildNodes = [];
    }

    addNode(node: NodeType): void {
        if (!this._allNodes.has(node)) {
            this._createNode(node);
        }
    }

    addRelation(parent: NodeType, child: NodeType): void {
        if (parent === child) {
            throw new Error('Self relations are not allowed!');
        }

        if (!this._allNodes.has(parent)) {
            this._addParent(parent, child);
        } else {
            this._addChild(parent, child);
        }
    }

    hasNodes(): boolean {
        return this._allNodes.size > 0;
    }

    takeCycledChildNode(): NodeType {
        const allNodes = Array.from(this._allNodes.keys());
        const childNode = this._allNodes.get(allNodes[0])!;

        childNode.parents.forEach(parent => {
            const childNodeIndex = parent.leaves.findIndex(leaf => leaf === childNode);
            parent.leaves.splice(childNodeIndex, 1);

            if (parent.leaves.length === 0) {
                this._noChildNodes.push(parent);
            }
        });

        childNode.leaves.forEach(leaf => {
            const childNodeIndex = leaf.parents.findIndex(parent => parent === childNode);
            leaf.parents.splice(childNodeIndex, 1);
        });

        this._allNodes.delete(childNode.node);

        return childNode.node;
    }

    takeNoChildNode(): NodeType|undefined {
        const childNode = this._noChildNodes.pop();
        if (!childNode) {
            if (this._allNodes.size > 0) {
                return this.takeCycledChildNode();
            }
            return undefined;
        }

        childNode.parents.forEach(parent => {
            const childNodeIndex = parent.leaves.findIndex(leaf => leaf === childNode);
            parent.leaves.splice(childNodeIndex, 1);

            if (parent.leaves.length === 0) {
                this._noChildNodes.push(parent);
            }
        });

        this._allNodes.delete(childNode.node);

        return childNode.node;
    }

    toString(): string {
        const items: string[] = [];

        this._allNodes.forEach(node => {
            const title = node.node.toString();
            const parents = node.parents.map(parent => parent.node.toString()).join(', ');
            const children = node.leaves.map(leaf => leaf.node.toString()).join(', ');
            items.push(title + '\n    PARENTS: ' + parents + '\n    CHILDREN: ' + children + '\n');
        });

        const noChildNodes = this._noChildNodes.map(node => node.node.toString()).join(', ');

        return 'NO CHILD NODES: ' + noChildNodes + '\n\n' + items.join('\n');
    }

    private _addChild(parent: NodeType, child: NodeType): void {
        const parentNode = this._allNodes.get(parent)!;
        const childNode = this._allNodes.get(child) || this._createNode(child);

        if (!parentNode.leaves.includes(childNode)) {
            if (parentNode.leaves.length === 0) {
                const index = this._noChildNodes.findIndex(node => node === parentNode);
                this._noChildNodes.splice(index, 1);
            }

            parentNode.leaves.push(childNode);
            childNode.parents.push(parentNode);
        }
    }

    private _addParent(parent: NodeType, child: NodeType): void {
        this._createNode(parent);
        this._addChild(parent, child);
    }

    private _createNode(nodeType: NodeType): INode<NodeType> {
        const nodeTypeNode: INode<NodeType> = {
            leaves: [],
            node: nodeType,
            parents: []
        };

        this._allNodes.set(nodeType, nodeTypeNode);
        this._noChildNodes.push(nodeTypeNode);

        return nodeTypeNode;
    }
}
