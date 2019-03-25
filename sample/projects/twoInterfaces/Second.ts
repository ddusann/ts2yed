import { IGroup } from './First';

export interface IMission {
    date: Date;
    group: IGroup;
    start(): void;
}

export interface IAnother extends IGroup {}
