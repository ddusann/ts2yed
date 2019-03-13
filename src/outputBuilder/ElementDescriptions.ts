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

import ElementDescription from './ElementDescription';

type ElementDescriptionKey =
    'edgeDescription'
    | 'edgeGraphics'
    | 'edgeUrl'
    | 'graphDescription'
    | 'nodeDescription'
    | 'nodeGraphics'
    | 'nodeUrl'
    | 'portGeometry'
    | 'portGraphics'
    | 'portUserData'
    | 'resources';

export default abstract class ElementDescriptions {
    private static _descriptions: Map<ElementDescriptionKey, ElementDescription>;

    static generate(): void {
        ElementDescriptions._descriptions = new Map<ElementDescriptionKey, ElementDescription>();

        ElementDescriptions._descriptions.set(
            'graphDescription', new ElementDescription('graph', 'Description', 'string'));
        ElementDescriptions._descriptions.set(
            'portGraphics', new ElementDescription('port', undefined, undefined, 'portgraphics'));
        ElementDescriptions._descriptions.set(
            'portGeometry', new ElementDescription('port', undefined, undefined, 'portgeometry'));
        ElementDescriptions._descriptions.set(
            'portUserData', new ElementDescription('port', undefined, undefined, 'portuserdata'));
        ElementDescriptions._descriptions.set(
            'nodeUrl', new ElementDescription('node', 'url', 'string'));
        ElementDescriptions._descriptions.set(
            'nodeDescription', new ElementDescription('node', 'description', 'string'));
        ElementDescriptions._descriptions.set(
            'nodeGraphics', new ElementDescription('node', undefined, undefined, 'nodegraphics'));
        ElementDescriptions._descriptions.set(
            'resources', new ElementDescription('graphml', undefined, undefined, 'resources'));
        ElementDescriptions._descriptions.set(
            'edgeUrl', new ElementDescription('edge', 'url', 'string'));
        ElementDescriptions._descriptions.set(
            'edgeDescription', new ElementDescription('edge', 'description', 'string'));
        ElementDescriptions._descriptions.set(
            'edgeGraphics', new ElementDescription('edge', undefined, undefined, 'edgegraphics'));
    }

    static get(key: ElementDescriptionKey): ElementDescription|undefined {
        return this._descriptions.get(key);
    }

    static getAll(): Map<ElementDescriptionKey, ElementDescription> {
        return ElementDescriptions._descriptions;
    }
}
