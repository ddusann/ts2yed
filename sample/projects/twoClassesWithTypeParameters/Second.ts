import FFF from './First';
import GGG from './First';

const x: GGG = new GGG('d');

export default class Second<GGG> {
    private _anything: boolean;
    private _condition?: <FFF>(x: (FFF extends Array<number> ? number : string)) => void;
    private _first: FFF;
    private _gogo?: GGG;
    private _someFn: <FFF>(xx: FFF) => FFF|null;

    constructor(first: FFF) {
        this._first = first;
        this._anything = false;
        this._someFn = function<FFF>(xx: FFF) { return xx || null; };
    }

    doSomething<FFF>(): FFF|null {
        return null;
    }
}
