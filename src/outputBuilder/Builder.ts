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

import Class from '../objectStructure/Class';
import ClassNode from './ClassNode';
import Edge from './Edge';
import Enum from '../objectStructure/Enum';
import GenericObject from '../objectStructure/GenericObject';
import Graph from './Graph';
import Interface from '../objectStructure/Interface';
import Node from './Node';
import Property from './Property';

export default class Builder {
    private _entities: GenericObject[];

    constructor(entities: GenericObject[]) {
        this._entities = entities;
    }

    getGraph(): Graph {
        const graph = new Graph();
        const graphNodes = new Map<GenericObject, Node>();
        this._getClasses().forEach(cls => {
            const graphClass = this._createClassGraphNode(cls);
            graph.addNode(graphClass);
            graphNodes.set(cls, graphClass);
        });
        this._getInterfaces().forEach(ifc => {
            const graphIfc = this._createInterfaceGraphNode(ifc);
            graph.addNode(graphIfc);
            graphNodes.set(ifc, graphIfc);
        });
        this._getEnums().forEach(enm => {
            const graphIfc = this._createEnumGraphNode(enm);
            graph.addNode(graphIfc);
            graphNodes.set(enm, graphIfc);
        });

        this._entities.forEach(entity => {
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

        cls.getAttributes()
            .forEach(attribute =>
                node.addAttribute(new Property(
                    attribute.getName(),
                    attribute.getVisibility(),
                    attribute.getType()
                )));

        cls.getMethods().forEach(method => {
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

    private _getClasses(): Class[] {
        return this._entities.filter((entity: GenericObject): entity is Class => entity instanceof Class);
    }

    private _getEnums(): Enum[] {
        return this._entities.filter((entity: GenericObject): entity is Enum => entity instanceof Enum);
    }

    private _getInterfaces(): Interface[] {
        return this._entities.filter((entity: GenericObject): entity is Interface => entity instanceof Interface);
    }
}
