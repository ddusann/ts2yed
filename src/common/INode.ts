import AbstractNode from '../xml/AbstractNode';

export default interface INode {
    generateNode(parent: AbstractNode): AbstractNode;
}
