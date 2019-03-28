import MyExtraType from './MyType';

type MyType = string|number;

export class ClassOne {
    type: MyType|MyExtraType;

    constructor(type: MyType|MyExtraType) {
        this.type = type;
    }
}

export class ClassTwo extends ClassOne {
    constructor(type: MyType) {
        super(type);
    }
}
