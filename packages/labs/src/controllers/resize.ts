import {ReactiveControllerHost} from '@lit/reactive-element/reactive-controller.js';
import {ElementPart, noChange} from 'lit-html';
import {DirectiveParameters} from 'lit-html/directive';
import {
  directive,
  DisconnectableDirective,
} from 'lit-html/disconnectable-directive.js';

/**
 * Observes the size of one or more elements, triggering an update of the host
 * when any observed element's size changes.
 *
 * ## Usage
 *
 * Create a ResizeController with the constructor and store it with the host:
 *
 * ```
 *   class MyElement extends LitElement {
 *     _resize = new ResizeController(this);
 *   }
 * ```
 *
 * To observe an element's size, add an element expression in the template with
 * this controllers `observe()` method:
 *
 * ```
 * render() {
 *   return html`<div ${this._resize.observe()}`></div>`;
 * }
 * ```
 *
 * Size information is stored in the controller's `borderBoxSize`,
 * `contentBoxSize`, and `contentRect` properties, similar to
 * ResizeObserverEntry:
 *
 * ```
 * render() {
 *   return html`
 *     <div ${this._resize.observe()}`>
 *       ${this._resize.contextRect?.width}
 *     </div>
 *   `;
 * }
 * ```
 *
 * @example
 *
 * ```ts
 * @customElement('resize-controller-demo')
 * class ResizeControllerDemoElement extends LitElement {
 *   _resize = new ResizeController(this);
 *
 *   render() {
 *     return html`
 *       <textarea ${this._resize.observe()}>Resize Me</textarea>
 *       <pre>
 *         Width: ${this._resize.contentRect?.width}
 *         Height: ${this._resize.contentRect?.height}
 *       </pre>
 *     `;
 *   }
 * }
 * ```
 */
export class ResizeController {
  private _host: ReactiveControllerHost & Element;
  private _entry?: ResizeObserverEntry;

  get borderBoxSize() {
    return this._entry?.borderBoxSize;
  }

  get contentBoxSize() {
    return this._entry?.contentBoxSize;
  }

  get contentRect() {
    return this._entry?.contentRect;
  }

  constructor(host: ReactiveControllerHost & Element) {
    this._host = host;
  }

  observe() {
    return resizeDirective(this);
  }

  protected onResize(entry: ResizeObserverEntry) {
    this._entry = entry;
    this._host.requestUpdate();
  }
}

interface ResizeControllerInternal {
  onResize(entry: ResizeObserverEntry): void;
}

class ResizeDirective extends DisconnectableDirective {
  private _observer = new ResizeObserver((entries: ResizeObserverEntry[]) => {
    for (const entry of entries) {
      if (entry.target === this._target) {
        ((this._controller as unknown) as ResizeControllerInternal)?.onResize(
          entry
        );
      }
    }
  });

  private _controller?: ResizeController;
  private _target?: Element;
  private _observing = false;

  render(_controller: ResizeController) {
    return noChange;
  }

  update(part: ElementPart, [controller]: DirectiveParameters<this>) {
    this._target ??= part.element;
    this._controller ??= controller;
    if (!this._observing) {
      this._observer.observe(this._target);
      this._observing = true;
    }
    return noChange;
  }

  disconnected() {
    if (this._observing) {
      this._observer.unobserve(this._target!);
      this._observing = false;
    }
  }

  reconnected() {
    if (!this._observing) {
      this._observer.unobserve(this._target!);
      this._observing = true;
    }
  }
}
const resizeDirective = directive(ResizeDirective);
