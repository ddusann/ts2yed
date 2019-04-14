import One, { IOneIfc } from './One';
import Two, { TwoType, TwoType2 } from './Two';

export class Main {
    start() {
        const x: IOneIfc[] = [];
        ([14 as TwoType2]).forEach(n => console.log(n));
        console.log(new One<TwoType>().toString());
        console.log(Two.start());
    }
}
