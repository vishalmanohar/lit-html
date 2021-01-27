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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  new (...args: Array<any>): C;
};

class ReactControllerHost<C extends ReactiveController>
  implements ReactiveControllerHost {
  _primaryController!: C;
  private _controllers: Array<ReactiveController> = [];
  private _updateCompletePromise: Promise<boolean>;
  _updatePending = true;
  _resolveUpdate!: (value: boolean | PromiseLike<boolean>) => void;
  // _rejectUpdate!: (reason?: any) => void;

  kickCount: number;
  kick: (k: number) => void;

  constructor(kickCount: number, kick: (k: number) => void) {
    this.kickCount = kickCount;
    this.kick = kick;
    this._updateCompletePromise = new Promise((res, _rej) => {
      this._resolveUpdate = res;
      // this._rejectUpdate = rej;
    });
  }

  addController(controller: ReactiveController): void {
    this._controllers.push(controller);
  }

  requestUpdate(): void {
    if (!this._updatePending) {
      this._updatePending = true;
      // Trigger a React update by updating some state
      Promise.resolve().then(() => this.kick(this.kickCount + 1));
    }
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
    this._updatePending = false;
    const resolve = this._resolveUpdate;
    this._updateCompletePromise = new Promise((res, _rej) => {
      this._resolveUpdate = res;
      // this._rejectUpdate = rej;
    });
    this._controllers.forEach((c) => c.updated?.());
    resolve(this._updatePending);
  }
}

/**
 * Creates and stores a stateful ReactiveController instance and provides it
 * with a ReactiveControllerHost that drives the controller lifecycle.
 *
 * Use this hook to convert ReactiveController into a React hook.
 *
 * @param React the React module that provides the base hooks. Must provide
 * `useState` and `useLayoutEffect`.
 * @param createController A function that creates a controller instance. This
 * function is given a ReactiveController to pass to the controller. The create
 * function is only called once per component.
 */
export const useController = <C extends ReactiveController>(
  React: React,
  createController: (host: ReactiveControllerHost) => C
): C => {
  const {useState, useLayoutEffect} = React;
  const [kickCount, kick] = useState(0);

  // Create and store the controller instance. We use useState() instead of
  // useMemo() because React does not gaurentee that it will preserve values
  // created with useMemo().
  // TODO: since this controller are mutable, this may cause issues such as
  // "shearing" with React concurrent mode. The solution there will likely be
  // to shapshot the controller state with something like `useMutableSource`:
  // https://github.com/reactjs/rfcs/blob/master/text/0147-use-mutable-source.md
  // We can address this when concurrent mode is closer to shipping.
  const [host] = useState(() => {
    const host = new ReactControllerHost<C>(kickCount, kick);
    const controller = createController(host);
    host._primaryController = controller;
    host.connected();
    return host;
  });

  host._updatePending = true;

  useLayoutEffect(() => () => host.disconnected(), []);
  useLayoutEffect(() => host.updated());
  host.willUpdate();
  // TODO: don't call in SSR
  host.update();

  return host._primaryController;
};
