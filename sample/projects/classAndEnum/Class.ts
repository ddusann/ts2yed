import Color from './Enum';

enum Position {
    FIRST,
    SECOND,
    THIRD
}

export class Class {
    protected _position?: Position;
    private _color?: Color;
}
