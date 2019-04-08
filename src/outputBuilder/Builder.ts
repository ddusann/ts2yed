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

import Folder, { IFolder } from '../objectStructure/Folder';

import Class from '../objectStructure/Class';
import ClassNode from './ClassNode';
import Edge from './Edge';
import Enum from '../objectStructure/Enum';
import FunctionDef from '../objectStructure/Function';
import GenericObject from '../objectStructure/GenericObject';
import Graph from './Graph';
import Interface from '../objectStructure/Interface';
import Node from './Node';
import NoteNode from './NoteNode';
import Property from './Property';
import Settings from './Settings';
import TypeAlias from '../objectStructure/TypeAlias';
import VisibilityType from '../VisibilityType';

type GraphNodeAssociation = Map<GenericObject, Node>;

export default class Builder {
    private _folder: Folder;

    constructor(entities: Folder) {
        this._folder = entities;
    }

    getGraph(): Graph {
        const graph = new Graph();
        const graphNodes = this._createGraphNodes(this._folder.getFolderData(), graph);

        this._getGenericObjects(this._folder.getFolderData()).forEach(entity => {
            entity.getUsages().forEach(usage => {
                const entityGraphNode = graphNodes.get(entity);
                const usageGraphNode = graphNodes.get(usage);
                if (!entityGraphNode || !usageGraphNode) {
                    throw new Error('Graph node not found!');
                }

                graph.addEdge(new Edge(entityGraphNode, usageGraphNode, 'usage'));
            });

            entity.getExtensions().forEach(extension => {
                const entityGraphNode = graphNodes.get(entity);
                const extensionGraphNode = graphNodes.get(extension);
                if (!entityGraphNode || !extensionGraphNode) {
                    throw new Error('Graph node not found!');
                }

                graph.addEdge(new Edge(entityGraphNode, extensionGraphNode, 'inheritance'));
            });

            entity.getImplementations().forEach(implementation => {
                const entityGraphNode = graphNodes.get(entity);
                const implementationGraphNode = graphNodes.get(implementation);
                if (!entityGraphNode || !implementationGraphNode) {
                    throw new Error('Graph node not found!');
                }

                graph.addEdge(new Edge(entityGraphNode, implementationGraphNode, 'implementation'));
            });
        });

        return graph;
    }

    private _createClassGraphNode(cls: Class): ClassNode {
        const node = new ClassNode(cls.getName(), cls.getStereotype());
        const settings = Settings.getSettings();

        cls.getAttributes()
            .forEach(attribute => {
                if (settings.getHidePrivateMembers() && attribute.getVisibility() === VisibilityType.PRIVATE) {
                    return;
                }

                return node.addAttribute(new Property(
                    attribute.getName(),
                    attribute.getVisibility(),
                    attribute.getType()
                ));
            });

        cls.getMethods().forEach(method => {
            if (settings.getHidePrivateMembers() && method.getVisibility() === VisibilityType.PRIVATE) {
                return;
            }

            const parameters = method.getParameters()
                .map(parameter => `${parameter.name}: ${parameter.type}`)
                .join(', ');

            node.addMethod(
                new Property(`${method.getName()}(${parameters})`,
                method.getVisibility(),
                method.getType()
            ));
        });

        return node;
    }

    private _createEnumGraphNode(enm: Enum): ClassNode {
        const node = new ClassNode(enm.getName(), enm.getStereotype());

        enm.getValues().forEach(value => {
            node.addLine(value);
        });

        return node;
    }

    private _createFunctionGraphNode(func: FunctionDef): NoteNode {
        const parameters = func.getParameters().map(parameter => {
            return `${parameter.name}: ${parameter.type}`;
        }).join(', ');
        const typeParameters = func.getTypeParameters().length > 0
            ? '<' + func.getTypeParameters().join(', ') + '>'
            : '';
        return new NoteNode(`${func.getName()} = function(${parameters})${typeParameters}: ${func.getType()}`);
    }

    private _createGraphNodes(folder: IFolder, graph: Graph): GraphNodeAssociation {
        const associations: GraphNodeAssociation = this._createGroupGraphNodes(folder.objects, graph);

        folder.folders.forEach(subfolder => {
            if (subfolder.objects.length + subfolder.folders.length > 1) {
                const subgraph = new Graph();
                this._mergeAssociations(associations, this._createGraphNodes(subfolder, subgraph));
                graph.addGroup(subfolder.name, subgraph);
            } else {
                this._mergeAssociations(associations, this._createGraphNodes(subfolder, graph));
            }
        });

        return associations;
    }

    private _createGroupGraphNodes(objects: GenericObject[], graph: Graph): GraphNodeAssociation {
        const graphNodes = new Map<GenericObject, Node>();

        this._getClasses(objects).forEach(cls => {
            const graphClass = this._createClassGraphNode(cls);
            graph.addNode(graphClass);
            graphNodes.set(cls, graphClass);
        });
        this._getInterfaces(objects).forEach(ifc => {
            const graphIfc = this._createInterfaceGraphNode(ifc);
            graph.addNode(graphIfc);
            graphNodes.set(ifc, graphIfc);
        });
        this._getEnums(objects).forEach(enm => {
            const graphIfc = this._createEnumGraphNode(enm);
            graph.addNode(graphIfc);
            graphNodes.set(enm, graphIfc);
        });
        this._getFunctions(objects).forEach(func => {
            const graphType = this._createFunctionGraphNode(func);
            graph.addNote(graphType);
            graphNodes.set(func, graphType);
        });
        this._getTypes(objects).forEach(type => {
            const graphType = this._createTypeGraphNode(type);
            graph.addNote(graphType);
            graphNodes.set(type, graphType);
        });

        return graphNodes;
    }

    private _createInterfaceGraphNode(ifc: Interface): ClassNode {
        const node = new ClassNode(ifc.getName(), ifc.getStereotype());

        ifc.getAttributes().forEach(attribute =>
            node.addAttribute(new Property(
                attribute.getName(),
                attribute.getVisibility(),
                attribute.getType()
            ))
        );

        ifc.getMethods().forEach(method => {
            const parameters = method.getParameters()
                .map(parameter => `${parameter.name}: ${parameter.type}`)
                .join(', ');

            node.addMethod(
                new Property(`${method.getName()}(${parameters})`,
                method.getVisibility(),
                method.getType()
            ));
        });

        return node;
    }

    private _createTypeGraphNode(type: TypeAlias): NoteNode {
        return new NoteNode(`${type.getName()} = ${type.getValue()}`);
    }

    private _getClasses(objects: GenericObject[]): Class[] {
        return objects.filter((entity: GenericObject): entity is Class => entity instanceof Class);
    }

    private _getEnums(objects: GenericObject[]): Enum[] {
        return objects.filter((entity: GenericObject): entity is Enum => entity instanceof Enum);
    }

    private _getFunctions(objects: GenericObject[]): FunctionDef[] {
        return objects.filter((entity: GenericObject): entity is FunctionDef => entity instanceof FunctionDef);
    }

    private _getGenericObjects(folder: IFolder): GenericObject[] {
        const objects = folder.objects;

        folder.folders.forEach(subfolder => {
            objects.splice(objects.length, 0, ...this._getGenericObjects(subfolder));
        });

        return objects;
    }

    private _getInterfaces(objects: GenericObject[]): Interface[] {
        return objects.filter((entity: GenericObject): entity is Interface => entity instanceof Interface);
    }

    private _getTypes(objects: GenericObject[]): TypeAlias[] {
        return objects.filter((entity: GenericObject): entity is TypeAlias => entity instanceof TypeAlias);
    }

    private _mergeAssociations(destination: GraphNodeAssociation, newAssociation: GraphNodeAssociation): void {
        for (const [genericObject, node] of newAssociation) {
            if (destination.has(genericObject)) {
                throw new Error('Association already exists!');
            }

            destination.set(genericObject, node);
        }
    }
}
