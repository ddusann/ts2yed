// tslint:disable
export class MyClass {
    private static _privateStaticAttribute: string;
    _publicAttribute: string;
    protected _protectedAttribute: string;
    private readonly _privateAttribute: string;

    get smth(): number { return 42; }
    set smth(v: number) { this._publicAttribute = v.toString(); }

    constructor(a: string) {
        this._publicAttribute = a;
        this._protectedAttribute = '';
        this._privateAttribute = '';
    }

    setMe(x: string): boolean {
        this._protectedAttribute = x;
        return false;
    }

    another(): void {
        this._publicAttribute = 's';
    }

    another2() {
        this._publicAttribute = 's';
        return false;
    }
}

interface IIfc {
    another: () => void;
}

export abstract class MyAbstractClass<T> extends Promise<T> implements IIfc {
    abstract _abstractPrivateAttribute: string;

    constructor() {
        super(() => {});
    }

    another() {
        
    }
}
