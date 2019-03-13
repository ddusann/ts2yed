/**
 * Copyright (c) 2019 Dušan Kováčik
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

export default class IdGenerator {
    private static _generator: IdGenerator;

    static get(prefix: string): string {
        if (!IdGenerator._generator) {
            IdGenerator._create();
        }

        return IdGenerator._generator.getId(prefix);
    }

    static reset(): void {
        IdGenerator._create();
    }

    private static _create(): void {
        this._generator = new IdGenerator();
    }

    private _generatedIds: Map<string, number>;

    private constructor() {
        this._generatedIds = new Map<string, number>();
    }

    getId(prefix: string): string {
        if (!this._generatedIds.has(prefix)) {
            this._generatedIds.set(prefix, 0);
        }

        const newIdValue = this._generatedIds.get(prefix)!;
        const newId = `${prefix}${newIdValue}`;
        this._generatedIds.set(prefix, newIdValue + 1);
        return newId;
    }
}
