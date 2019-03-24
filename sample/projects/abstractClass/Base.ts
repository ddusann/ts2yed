export abstract class Base<T> {
    static counter: number = 0;
    protected _smth: number;
    private _optional?: boolean;

    constructor() {
        ++Base.counter;
        this._smth = 42;
    }

    abstract getNumber(): number;
}
