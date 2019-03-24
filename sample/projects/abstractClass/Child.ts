import { Base } from './Base';

export class Child extends Base<boolean> {
    private readonly _type: string;

    constructor() {
        super();

        this._type = 'abc';
    }

    getNumber(): number {
        return 43;
    }
}
