/**
 * Copyright (c) 2019-2020 Dušan Kováčik
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
            file = this._printCycleDependencyError();
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

    private _findDependency(): IFileNode[]|undefined {
        const allNodePaths = Array.from(this._allNodes.keys());
        let dependency: IFileNode[]|undefined;

        allNodePaths.find(nodePath => {
            const node = this._allNodes.get(nodePath)!;
            const passedChildren: IFileNode[] = [];
            const passedChildrenWithPosition: [IFileNode, number][] = [];
            let currentNode = node;
            let currentNodeLeafPosition = 0;
            let found = false;
            while (true) {
                // dependency check
                if (passedChildren.includes(currentNode)) {
                    found = true;
                    dependency = passedChildren.slice(passedChildren.indexOf(currentNode));
                    dependency.push(currentNode);
                    break;
                }

                // there are some children which need to be checked
                if (currentNode.leaves.length > currentNodeLeafPosition) {
                    passedChildren.push(currentNode);
                    passedChildrenWithPosition.push([currentNode, currentNodeLeafPosition]);
                    currentNode = currentNode.leaves[currentNodeLeafPosition];
                    currentNodeLeafPosition = 0;

                    continue;
                }

                // there are no more children, go back
                while (passedChildrenWithPosition.length > 0) {
                    [currentNode, currentNodeLeafPosition] = passedChildrenWithPosition.pop()!;
                    passedChildren.pop();
                    ++ currentNodeLeafPosition;

                    if (currentNode.leaves.length === currentNodeLeafPosition) {
                        continue;
                    }

                    passedChildren.push(currentNode);
                    passedChildrenWithPosition.push([currentNode, currentNodeLeafPosition]);
                    currentNode = currentNode.leaves[currentNodeLeafPosition];
                    currentNodeLeafPosition = 0;
                }

                if (passedChildrenWithPosition.length === 0 && currentNode.leaves.length === currentNodeLeafPosition) {
                    break;
                }
            }

            return found;
        });

        return dependency;
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

    private _printCycleDependencyError(): never {
        const cycle = this._findDependency();
        if (!cycle) {
            throw new Error('Unknown cycle dependency detected!');
        }

        console.log('Found cycled dependencies:');
        cycle.forEach(node => console.log('  =>', node.name));
        throw new Error('The dependencies must not be cycled!');
    }
}
