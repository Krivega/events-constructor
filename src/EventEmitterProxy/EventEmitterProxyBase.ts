import type TypedEvents from '../TypedEvents';

type TStringKeyOf<T> = Extract<keyof T, string>;

/**
 * Base class that proxies event methods (on, once, onRace, onceRace, wait, off)
 * to a TypedEvents instance provided by subclasses via abstract `events`.
 *
 * Use when you need to expose the events API on your instance while delegating
 * to an internal events object. Subclasses must declare `protected readonly events`.
 *
 * @template TEventMap - Map of event names to payload types, e.g. `{ success: void; error: Error }`
 *
 * @example Extend and provide `events` yourself (no constructor)
 * type TEventMap = { success: void; error: Error };
 * class MyManager extends EventEmitterProxyBase<TEventMap> {
 *   protected readonly events = createEvents<TEventMap>();
 * }
 */
export abstract class EventEmitterProxyBase<TEventMap extends Record<string, unknown>> {
  protected abstract readonly events: TypedEvents<TEventMap>;

  public on<T extends TStringKeyOf<TEventMap>>(
    eventName: T,
    handler: (data: TEventMap[T]) => void,
  ) {
    return this.events.on(eventName, handler);
  }

  public once<T extends TStringKeyOf<TEventMap>>(
    eventName: T,
    handler: (data: TEventMap[T]) => void,
  ) {
    return this.events.once(eventName, handler);
  }

  public onRace<T extends TStringKeyOf<TEventMap>>(
    eventNames: T[],
    handler: (data: TEventMap[T], eventName: string) => void,
  ) {
    return this.events.onRace(eventNames, handler);
  }

  public onceRace<T extends TStringKeyOf<TEventMap>>(
    eventNames: T[],
    handler: (data: TEventMap[T], eventName: string) => void,
  ) {
    return this.events.onceRace(eventNames, handler);
  }

  public async wait<T extends TStringKeyOf<TEventMap>>(eventName: T): Promise<TEventMap[T]> {
    return this.events.wait(eventName);
  }

  public off<T extends TStringKeyOf<TEventMap>>(
    eventName: T,
    handler: (data: TEventMap[T]) => void,
  ) {
    this.events.off(eventName, handler);
  }
}
