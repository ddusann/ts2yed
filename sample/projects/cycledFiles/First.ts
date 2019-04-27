import Second from './Second';

export default class First {
    private _second: Second|null;

    constructor(s: Second|null) {
        this._second = s;
    }
}
