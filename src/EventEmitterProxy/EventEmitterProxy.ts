import { EventEmitterProxyBase } from './EventEmitterProxyBase';

import type TypedEvents from '../TypedEvents';

/**
 * Proxy that exposes event methods (on, once, onRace, onceRace, wait, off)
 * by delegating to a TypedEvents instance passed into the constructor.
 *
 * Use when your class receives or creates the events instance and you want
 * to expose it as the public API. Extends {@link EventEmitterProxyBase}.
 *
 * @template TEventMap - Map of event names to payload types, e.g. `{ success: void; error: Error }`
 *
 * @example Pass events in constructor
 * type TEventMap = { success: void; error: Error };
 * class MyManager extends EventEmitterProxy<TEventMap> {
 *   public constructor() {
 *     super(createEvents<TEventMap>());
 *   }
 * }
 */
export abstract class EventEmitterProxy<
  TEventMap extends Record<string, unknown>,
> extends EventEmitterProxyBase<TEventMap> {
  protected readonly events: TypedEvents<TEventMap>;

  public constructor(events: TypedEvents<TEventMap>) {
    super();
    this.events = events;
  }
}
