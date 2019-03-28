interface IXY {
    start(): void;
}

function abc(param: IXY): void {
    return;
}

export interface IMyInterface {
    fn1: typeof abc;
}
