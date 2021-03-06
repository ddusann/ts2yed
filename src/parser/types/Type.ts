/**
 * Copyright (c) 2019-2020 Dušan Kováčik
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

export enum TypeCategory {
    NUMBER,
    STRING,
    BOOLEAN,
    ARRAY,
    OBJECT,
    FUNCTION,
    REFERENCE,
    VOID,
    UNION,
    INTERSECTION,
    CONDITION,
    NOT_DEFINED,
    NULL,
    UNDEFINED,
    PARENTHESIS,
    TYPEOF,
    IS,
    STRING_LITERAL,
    ANY,
    ANY_OBJECT,
    TUPLE,
    OPTIONAL,
    CONSTRUCTOR_FUNCTION,
    SYMBOL
}

export interface IReplacement {
    from: string;
    to: string;
}

export default abstract class Type {
    static makeReferenceTypeUnique(references: Type[], hideTypeParameters: boolean = false) {
        const usedTypes: string[] = [];

        return references.filter(reference => {
            const referenceTypeName = reference.getTypeName([], hideTypeParameters);
            if (usedTypes.includes(referenceTypeName)) {
                return false;
            }

            usedTypes.push(referenceTypeName);
            return true;
        });
    }

    abstract getReferenceTypes(): Type[];
    abstract getType(): TypeCategory;
    abstract getTypeName(replacements: IReplacement[], hideTypeParameters: boolean): string;
}
