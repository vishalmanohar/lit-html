/**
 * @license
 * Copyright (c) 2020 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */

/**
 * Kitchen-sink benchmark for lit-html
 *
 * Features exercised:
 * - NodePart
 *   - value: string
 *   - value: Node
 *   - value: Array<TemplateResult>
 *   - value: directive: repeat
 *   - value: nothing
 * - AttributePart
 *   - value: string (single)
 *   - value: string (multiple)
 *   - value: directive: classMap
 *   - value: directive: styleMap
 * - PropertyPart
 *   - value: object
 * - EventPart
 *   - value: function
 * - Comment binding
 *   - value: string
 *
 * Available query params:
 * - width: number of items in each map/repeat per item
 * - depth: number of levels of item recursion
 * - updateCount: number of times to update with changed data after initial render
 * - nopUpdateCount: number of times to update with unchanged data after initial render
 *
 * The following performance measurements are recorded:
 * - `render` - time for initial render
 * - `update` - time for running through `updateCount` updates
 * - `nop-update` - time for running through `nopUpdateCount` nop-updates
 */

import {render, nothing} from 'lit-html';
import {_Σ} from 'lit-html/private-ssr-support.js';

const {AttributePart, PropertyPart, EventPart} = _Σ;

// TODO(kschaaf) use real repeat once landed
// import { repeat } from "lit-html/lib/directives/repeat.js";
const repeat = (items: any[], _kfn: (i: any) => any, tfn: (i: any) => any) =>
  items.map((i) => tfn(i));

// TODO(kschaaf) use real classMap once landed
// import { classMap } from "lit-html/lib/directives/class-map.js";
const classMap = (classes: {[key: string]: boolean}) =>
  Object.keys(classes)
    .filter((k) => classes[k])
    .join(' ');

// TODO(kschaaf) use real styleMap once landed
// import { styleMap } from "lit-html/lib/directives/style-map.js";
const styleMap = (style: {[key: string]: boolean}) =>
  Object.entries(style)
    .map(([k, v]) => `${k}: ${v}`)
    .join('; ');

// IE doesn't support URLSearchParams
const params = document.location.search
  .slice(1)
  .split('&')
  .map((p) => p.split('='))
  .reduce(
    (p: {[key: string]: any}, [k, v]) => ((p[k] = JSON.parse(v || 'true')), p),
    {}
  );

// Configurable params
const width = params.width ?? 4;
const depth = params.depth ?? 4;
const updateCount = params.updateCount ?? 10;
const nopUpdateCount = params.nopUpdateCount ?? 10;

// Data model
interface Data {
  key: number;
  text: string;
  property: {};
  classes: {};
  style: {};
  node: Node;
  handler: () => void;
  childData?: Data[];
  useRepeat?: boolean;
}

/**
 * Generates a data model for an item, recursively creating child data
 * models for the given width & depth.
 *
 * @param updateId Increment to ensure new data models for the given id
 *   create unique (non-dirty checking) values
 * @param id Id for item, unique amongst its peers
 * @param parent Parent moniker (to create unique text for each item)
 * @param currentDepth Current depth, used to stop recursion at REPEAT_DEPTH.
 */
const generateData = (
  updateId = 0,
  id = 0,
  parent: string | undefined = undefined,
  currentDepth = 0
): Data => {
  const moniker = `${parent ? `${parent}-` : ''}${id}`;
  return {
    key: id,
    text: `Item ${moniker}${updateId ? `#${updateId}` : ''}`,
    property: {},
    node: document.createElement('span'),
    classes: {
      foo: !!(updateId % 2),
      bar: !(updateId % 2),
      ziz: true,
      zaz: false,
    },
    style: {
      'border-top-width': `${updateId % 2}px`,
      'border-bottom-width': `${(updateId + 1) % 2}px`,
      'border-left-width': '0px',
      'border-right-width': '0px',
    },
    handler: () => {},
    ...(currentDepth < depth && {
      childData: new Array(width)
        .fill(0)
        .map((_, i) => generateData(updateId, i, moniker, currentDepth + 1)),
      useRepeat: !(id % 2),
    }),
  };
};

// These are "hand compiled" templates for the benchmark. This allows lit-html
// to skip the template parsing/prep steps for faster bootup.
const _$lit_template_1$ = {
  _element: document.createElement('template'),
  _parts: [
    {_type:1,_index:1,_name:"class",_strings:[""," static"], _constructor: AttributePart},
    {_type:1,_index:1,_name:"style",_strings:["",""], _constructor: AttributePart},
    {_type:2,_index:3},
    {_type:7,_index:5},
    {_type:1,_index:7,_name:"property",_strings:["",""], _constructor: PropertyPart},
    {_type:1,_index:7,_name:"attr",_strings:["",""], _constructor: AttributePart},
    {_type:1,_index:7,_name:"multi",_strings:["~","~","~","~"], _constructor: AttributePart},
    {_type:1,_index:9,_name:"click",_strings:["",""], _constructor: EventPart},
    {_type:2,_index:11},
    {_type:2,_index:32}],
};
_$lit_template_1$._element.innerHTML = "\n  <div>\n    <!--?lit$855196295$-->\n    <!-- Comment binding lit$855196295$ -->\n    <div></div>\n    <div></div>\n    <!--?lit$855196295$-->\n    <!-- Make sure to have a decent ratio of static:dynamic nodes  -->\n    <div class=\"foo bar baz\">\n      <div class=\"foo bar baz\"></div>\n      <div><span></span></div>\n      <div class=\"foo bar baz\"></div>\n      <div><span></span></div>\n      <div class=\"foo bar baz\"></div>\n    </div>\n    <div class=\"foo bar baz\"></div>\n    <!--?lit$855196295$-->\n    </div>\n  \n  ";

const _$lit_template_2$ = {
  _element: document.createElement('template'),
  _parts: [
    {_type:1,_index:0,_name:"mode",_strings:["",""], _constructor: AttributePart},
    {_type:2,_index:2}],
};
_$lit_template_2$._element.innerHTML = "<div>\n            <!--?lit$855196295$-->\n          </div>";

/**
 * Renders a lit-html template for the given data model; will recursively
 * create child items using either repeat or map, alternating between items.
 *
 * The goal here is to try to exercise each feature of lit-html at least once,
 * hence kitchen-sink.
 *
 * @param data Data model for item
 */
const renderItem: any = (data: Data) => {
  return {
    _$litType$: _$lit_template_1$,
    values: [
      classMap(data.classes),
      styleMap(data.style),
      data.text,
      data.text,
      data.property,
      data.text,
      data.text,
      data.text,
      data.text,
      data.handler,
      data.node,
      data.childData
        ? {
            _$litType$: _$lit_template_2$,
            values: [
              data.useRepeat ? 'repeat' : 'map',
              data.useRepeat
              ? repeat(
                  data.childData,
                  (item) => item.key,
                  (item) => renderItem(item)
                )
              : data.childData.map((item) => renderItem(item)),
            ],
          }
        : nothing
    ]
  };
};

let data = generateData(0);

// Initial render
performance.mark('render-start');
render(renderItem(data), document.body);
performance.measure('render', 'render-start');

// Update
performance.mark('update-start');
for (let i = 0; i < updateCount; i++) {
  data = generateData(i + 1);
  render(renderItem(data), document.body);
}
performance.measure('update', 'update-start');

// No-op update
performance.mark('nop-update-start');
for (let i = 0; i < nopUpdateCount; i++) {
  render(renderItem(data), document.body);
}
performance.measure('nop-update', 'nop-update-start');

// Log
console.log(
  Object.entries({width, depth, updateCount, nopUpdateCount})
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ')
);
console.log('===');
performance
  .getEntriesByType('measure')
  .forEach((m) => console.log(`${m.name}: ${m.duration.toFixed(3)}ms`));
