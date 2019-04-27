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

interface IFileNode {
    leaves: IFileNode[];
    name: string;
    parents: IFileNode[];
}

export default class FileDependency {
    private _allNodes: Map<string, IFileNode>;
    private _treeFinalLeaves: IFileNode[];

    constructor() {
        this._allNodes = new Map<string, IFileNode>();
        this._treeFinalLeaves = [];
    }

    addDependencies(sourceFile: string, dependencies: string[]): void {
        let fileNode: IFileNode;
        if (!this._allNodes.has(sourceFile)) {
            fileNode = {
                leaves: [],
                name: sourceFile,
                parents: []
            };
            this._allNodes.set(sourceFile, fileNode);
        } else {
            fileNode = this._allNodes.get(sourceFile)!;
        }

        if (!this._treeFinalLeaves.includes(fileNode)) {
            this._treeFinalLeaves.push(fileNode);
        }

        dependencies.forEach(dependency => this._addDependency(fileNode, dependency));
    }

    getFile(): string {
        let file = this._getFile();
        if (!file) {
            file = this._getCycledDependencyFile();
        }

        if (!file) {
            throw new Error('The file list is empty!');
        }

        return file;
    }

    hasFile(fileName?: string): boolean {
        return fileName ? this._allNodes.has(fileName) : this._allNodes.size > 0;
    }

    toString(): string {
        const items: string[] = [];

        this._allNodes.forEach((node, key) => {
            const title = node.name;
            const parents = node.parents.map(parent => parent.name).join('\n        ');
            const children = node.leaves.map(leaf => leaf.name).join('\n        ');
            items.push(title + '\n    PARENTS:\n        ' + parents + '\n    CHILDREN:\n        ' + children + '\n');
        });

        const noChildNodes = this._treeFinalLeaves.map(leaf => leaf.name).join('\n    ');

        return 'NO CHILD NODES:\n    '
            + noChildNodes
            + '\n\n'
            + items.join('\n----------------------------------------\n')
            + '========================================\n\n';
    }

    private _addDependency(sourceFileNode: IFileNode, dependency: string): void {
        let dependencyNode: IFileNode;
        if (!this._allNodes.has(dependency)) {
            dependencyNode = {
                leaves: [],
                name: dependency,
                parents: [sourceFileNode]
            };
            this._allNodes.set(dependency, dependencyNode);
            sourceFileNode.leaves.push(dependencyNode);
        } else {
            dependencyNode = this._allNodes.get(dependency)!;
            if (!sourceFileNode.leaves.includes(dependencyNode)) {
                sourceFileNode.leaves.push(dependencyNode);
                dependencyNode.parents.push(sourceFileNode);
            }
        }

        this._moveFinalLeafPropertyIfPossible(sourceFileNode, dependencyNode);
    }

    private _getCycledDependencyFile(): string {
        const allNodes = Array.from(this._allNodes.keys());
        const cycledNodeOwnerPath = allNodes.find(nodePath => {
            const node = this._allNodes.get(nodePath)!;
            const leafIndex = node.leaves.findIndex(leafNode => {
                return node.parents.map(parentNode => parentNode.name).includes(leafNode.name);
            });
            return leafIndex !== -1;
        });

        if (!cycledNodeOwnerPath) {
            throw new Error('No cycled dependency found');
        }

        const cycledNodeOwner = this._allNodes.get(cycledNodeOwnerPath)!;
        const cycledNode = cycledNodeOwner.leaves.find(leafNode => {
            return cycledNodeOwner.parents.map(parentNode => parentNode.name).includes(leafNode.name);
        })!;

        cycledNodeOwner.parents.splice(cycledNodeOwner.parents.indexOf(cycledNode), 1);
        cycledNode.leaves.splice(cycledNode.leaves.indexOf(cycledNodeOwner), 1);
        if (cycledNode.leaves.length === 0) {
            this._treeFinalLeaves.push(cycledNode);
        }

        return cycledNodeOwner.name;
    }

    private _getFile(): string|undefined {
        const finalLeaf = this._treeFinalLeaves.pop();
        if (!finalLeaf) {
            return undefined;
        }

        finalLeaf.parents.forEach(parent => {
            const leafIndex = parent.leaves.findIndex(leaf => leaf === finalLeaf);
            if (leafIndex >= 0) {
                parent.leaves.splice(leafIndex, 1);
            }
        });

        finalLeaf.parents
            .filter(parent => parent.leaves.length === 0)
            .forEach(parent => this._treeFinalLeaves.push(parent));

        this._allNodes.delete(finalLeaf.name);

        return finalLeaf.name;
    }

    private _moveFinalLeafPropertyIfPossible(from: IFileNode, to: IFileNode): void {
        const finalLeafIndex = this._treeFinalLeaves.findIndex(leaf => leaf === from);

        if (finalLeafIndex !== -1) {
            this._treeFinalLeaves.splice(finalLeafIndex, 1);
        }

        if (to.leaves.length === 0 && !this._treeFinalLeaves.includes(to)) {
            this._treeFinalLeaves.push(to);
        }
    }
}
