// tslint:disable
type inter = number&string;

type union = number|boolean;

type TYP<T> = T extends Array<number> ? inter : union;

export default TYP;
