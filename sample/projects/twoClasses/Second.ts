import FFF from './First';

export default class Second {
    private _anything: boolean;
    private _first: FFF;

    constructor(first: FFF) {
        this._first = first;
        this._anything = false;
    }
}
