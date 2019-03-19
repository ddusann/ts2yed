interface IBase {
    // tslint:disable-next-line
    arrValue: Array<string>;
    optional?: number;
    value: string[];
}

interface IAnotherBase {
    name: string;
    obj: { x: number };
}

interface ITyped<T> {
    name: T;
}

abstract class MyClass {
    abstract getString(): string;
}

export interface IExtended extends IBase, IAnotherBase, MyClass {
    funct: (c: MyClass) => IBase;
    anotherFunct(a: number, b: IAnotherBase): string;
    typedFn<T>(a: T): T;
}

export default interface ISecondExtended extends IExtended {
    sum: number;
    [key: number]: string;
}

export interface ITyped2 extends Promise<number> {}
