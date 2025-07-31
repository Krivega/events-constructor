import EventsBase from './Events';

/**
 * Strongly-typed wrapper around `Events` that binds payload types to event names.
 *
 * @example
 * type EventMap = {
 *   userLoaded: { id: string; name: string };
 *   logout: void;
 * };
 *
 * const events = new TypedEvents<EventMap>(['userLoaded', 'logout'] as const);
 *
 * events.on('userLoaded', (payload) => {
 *   // payload is { id: string; name: string }
 * });
 *
 * events.trigger('logout'); // payload is inferred as void
 */
type StringKeyOf<T> = Extract<keyof T, string>;
type TTrigger<T = unknown> = (data: T) => void;

class TypedEvents<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  M extends Record<string, any>,
  EN extends readonly StringKeyOf<M>[] = readonly StringKeyOf<M>[],
> extends EventsBase<EN> {
  public override on<K extends EN[number]>(eventName: K, handler: (data: M[K]) => void) {
    return super.on<M[K]>(eventName, handler);
  }

  public override once<K extends EN[number]>(eventName: K, handler: (data: M[K]) => void) {
    return super.once<M[K]>(eventName, handler);
  }

  public override onceRace<K extends EN[number]>(
    eventNames: K[],
    handler: (data: M[K], eventName: K) => void,
  ) {
    const wrapped = (data: M[K], name: string) => {
      handler(data, name as K);
    };

    return super.onceRace<M[K]>(eventNames, wrapped);
  }

  public override async wait<K extends EN[number]>(eventName: K): Promise<M[K]> {
    return super.wait<M[K]>(eventName);
  }

  public override off<K extends EN[number]>(eventName: K, handler: (data: M[K]) => void) {
    super.off<M[K]>(eventName, handler);
  }

  // Overload for events with payload
  public override trigger<K extends EN[number]>(eventName: K, data: M[K]): void;
  // Overload for events without payload (never/void)
  public trigger<K extends EN[number]>(eventName: K & (M[K] extends never ? K : never)): void;
  public override trigger<K extends EN[number]>(eventName: K, data?: M[K]): void {
    if (data === undefined) {
      super.trigger(eventName, undefined as M[K]);
    } else {
      super.trigger(eventName, data);
    }
  }

  // Overload for events with payload
  public override emit<K extends EN[number]>(eventName: K, data: M[K]): void;
  // Overload for events without payload (never/void)
  public emit<K extends EN[number]>(eventName: K & (M[K] extends never ? K : never)): void;
  public override emit<K extends EN[number]>(eventName: K, data?: M[K]): void {
    if (data === undefined) {
      super.emit(eventName, undefined as M[K]);
    } else {
      super.emit(eventName, data);
    }
  }

  // Overloaded method with better typing based on EventMap
  public eachTriggersTyped(
    handler: <K extends EN[number]>(trigger: TTrigger<M[K]>, eventName: K) => void,
  ): void {
    // Implementation that provides typed triggers
    const typedHandler = (trigger: TTrigger, eventName: EN[number]) => {
      handler(trigger as TTrigger<M[typeof eventName]>, eventName);
    };

    super.eachTriggers(typedHandler);
  }
}

export default TypedEvents;
