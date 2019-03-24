export default class First {
    private _name: string;

    get name(): string {
        return this._name;
    }

    set name(name: string) {
        this._name = name;
    }

    constructor(name: string) {
        this._name = name;
    }

    getName(): string {
        return this._name;
    }
}
