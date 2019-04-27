import First from './First';

export default class Second {
    private _first: First;

    constructor(f: First) {
        this._first = f;
    }
}
