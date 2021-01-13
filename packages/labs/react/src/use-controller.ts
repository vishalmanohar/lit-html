/**
 * @license
 * Copyright (c) 2021 The Polymer Project Authors. All rights reserved.
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

import type * as ReactModule from 'react';
import {
  ReactiveController,
  ReactiveControllerHost,
} from '@lit/reactive-element/reactive-controller.js';

type React = typeof ReactModule;

export type ControllerConstructor<C extends ReactiveController> = {
  new (...args: Array<unknown>): C;
};

export const useController = <C>(
  React: React,
  ctor: ControllerConstructor<C>
) => (...args: ConstructorParameters<typeof ctor>) => {
  const {useState, useEffect} = React;

  const [kickCount, kick] = useState(0);

  class ReactControllerHost<C extends ReactiveController>
    implements ReactiveControllerHost {
    _primaryController: C;
    private _controllers: Array<ReactiveController> = [];
    private _updateCompletePromise: Promise<boolean>;
    _updatePending = true;
    _resolveUpdate!: (value: boolean | PromiseLike<boolean>) => void;
    // _rejectUpdate!: (reason?: any) => void;

    constructor(controller: C) {
      this._primaryController = controller;
      this._updateCompletePromise = new Promise((res, _rej) => {
        this._resolveUpdate = res;
        // this._rejectUpdate = rej;
      });
    }

    addController(controller: ReactiveController): void {
      this._controllers.push(controller);
    }

    requestUpdate(): void {
      if (this._updatePending === true) {
        return;
      }
      this._updatePending = true;

      // Trigger a React update by updating some state
      kick(kickCount + 1);

      this._updateCompletePromise = new Promise((res, _rej) => {
        this._resolveUpdate = res;
        // this._rejectUpdate = rej;
      });
    }

    get updateComplete(): Promise<boolean> {
      return this._updateCompletePromise;
    }

    connected() {
      this._controllers.forEach((c) => c.connected?.());
    }

    disconnected() {
      this._controllers.forEach((c) => c.disconnected?.());
    }

    willUpdate() {
      this._controllers.forEach((c) => c.willUpdate?.());
    }

    update() {
      this._controllers.forEach((c) => c.update?.());
    }

    updated() {
      this._controllers.forEach((c) => c.updated?.());
    }
  }

  const [host] = useState(() => {
    const host = new ReactControllerHost(new ctor(...args));
    // is this right, or should it be the first layout effect?
    host.connected();
    return host;
  });

  host.willUpdate();
  host.update();

  useEffect(() => {
    host.updated();
    if (host._updatePending) {
      host._resolveUpdate(false);
      host._updatePending = false;
    }
    return () => host.disconnected();
  });

  // For now, just return the controller instance
  // It would be very interesting to be able to customize the hook args
  // and return value so that an OOP controller API, with settable properties,
  // could be converted to idomatic hooks-style.
  // Idea: two functions provided to useController. One separates constructor
  // args from per-render props. Another customizes the return value so it
  // could return setter functions that set instance properties, etc.
  return host._primaryController;
};
