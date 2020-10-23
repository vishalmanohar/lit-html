/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
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
 * LitElement support for hydration of content rendered using lit-ssr.
 *
 * @packageDocumentation
 */

// Types only
import {PropertyValues} from 'updating-element';
import {render, RenderOptions} from 'lit-html';

import {hydrate} from 'lit-html/hydrate.js';

interface PatchableLitElement extends HTMLElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-misused-new
  new (...args: any[]): PatchableLitElement;
  connectedCallback: void;
  _needsHydration: boolean;
  hasUpdated: boolean;
  $onHydrationCallbacks: (() => void)[] | undefined;
  enableUpdating(): void;
  render(): unknown;
  renderRoot: HTMLElement | ShadowRoot;
  _renderOptions: RenderOptions;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any)['litElementHydrateSupport'] = ({
  LitElement,
}: {
  LitElement: PatchableLitElement;
}) => {
  const observedAttributes = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(LitElement),
    'observedAttributes'
  )!.get!;

  // Add `defer-hydration` to observedAttributes
  Object.defineProperty(LitElement, 'observedAttributes', {
    get() {
      return [...observedAttributes.call(this), 'defer-hydration'];
    },
  });

  // Enable element when 'defer-hydration' attribute is removed
  const attributeChangedCallback =
    LitElement.prototype.attributeChangedCallback;
  LitElement.prototype.attributeChangedCallback = function (
    name: string,
    old: string | null,
    value: string | null
  ) {
    if (name === 'defer-hydration' && value === null) {
      this.enableUpdating();
    } else {
      attributeChangedCallback.call(this, name, old, value);
    }
  };

  // Override `connectedCallback` to capture whether we need hydration, and
  // defer `enableUpdate()` if the 'defer-hydration' attribute is set
  LitElement.prototype.connectedCallback = function (
    this: PatchableLitElement
  ) {
    if (this.shadowRoot) {
      this._needsHydration = true;
    }
    // If the outer scope of this element has not yet been hydrated, wait until
    // 'defer-hydration' attribute has been removed to enable
    if (!this.hasAttribute('defer-hydration')) {
      this.enableUpdating();
    }
  };

  // If we've been server-side rendered, just return `this.shadowRoot`, don't
  // call the base implementation, which would also adopt styles (for now)
  const createRenderRoot = LitElement.prototype.createRenderRoot;
  LitElement.prototype.createRenderRoot = function (this: PatchableLitElement) {
    if (this._needsHydration) {
      return this.shadowRoot;
    } else {
      return createRenderRoot.call(this);
    }
  };

  // Hydrate on first update when needed
  const update = Object.getPrototypeOf(LitElement.prototype).update;
  LitElement.prototype.update = function (
    this: PatchableLitElement,
    changedProperties: PropertyValues
  ) {
    const value = this.render();
    // Since this is a patch, we can't call super.update(), so we capture
    // it off the proto chain and call it instead
    update.call(this, changedProperties);
    if (this._needsHydration) {
      this._needsHydration = false;
      hydrate(value, this.renderRoot, this._renderOptions);
      // Flush queue of children pending hydration
      if (this.$onHydrationCallbacks) {
        this.$onHydrationCallbacks.forEach((cb) => cb());
        this.$onHydrationCallbacks = undefined;
      }
    } else {
      render(value, this.renderRoot, this._renderOptions);
    }
  };
};
