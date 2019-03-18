export function sum<T>(x: number): number {
    return x + x;
}

const x = function(a: string): boolean {
    return true;
};

export const y = x;

export default () => {
    return 42;
};
