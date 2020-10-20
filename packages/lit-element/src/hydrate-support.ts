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

import {PropertyValues, UpdatingElement} from 'updating-element';
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

  // Override `connectedCallback` to capture whether we need hydration, and
  // defer `enableUpdate()` if we are in a host that has not yet updated
  LitElement.prototype.connectedCallback = function(this: PatchableLitElement) {
    if (this.shadowRoot) {
      this._needsHydration = true;
      // If element is pending hydration, in a shadow root, and it's host has
      // not yet updated, add self to host's `$onHydrationCallbacks` list
      // and wait for host to enable
      const root = this.getRootNode();
      if (root instanceof ShadowRoot) {
        // This assumes hydration host is always another LitElement (or
        // a base class implementing the `$onHydrationCallbacks` protocol)
        const host = root.host as PatchableLitElement;
        if (!host.hasUpdated) {
          if (!host.$onHydrationCallbacks) {
            host.$onHydrationCallbacks = [];
          }
          // Note there's an assumption that the only thing that the base
          // connectedCallback does is call `enableUpdating()`; if that
          // assumption changes we may want to just defer the entire
          // `connectedCallback` via $onHydrationCallbacks queue.
          host.$onHydrationCallbacks.push(() => this.enableUpdating());
          return;
        }
      }
    }
    this.enableUpdating();
  };

  // If we've been server-side rendered, just return `this.shadowRoot`, don't
  // the base implementation, which would also adopt styles (for now)
  const createRenderRoot = LitElement.prototype.createRenderRoot;
  LitElement.prototype.createRenderRoot = function (this: PatchableLitElement) {
    if (this._needsHydration) {
      return this.shadowRoot;
    } else {
      return createRenderRoot.call(this);
    }
  };

  // Hydrate on first update when needed
  LitElement.prototype.update = function (this: PatchableLitElement, changedProperties: PropertyValues) {
    const value = this.render();
    // Since this is a patch, we can't call super.update()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (UpdatingElement.prototype as any).update.call(this, changedProperties);
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
