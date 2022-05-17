type THandler<T = any> = (data: T) => void;
type TTrigger<T = any> = (data: T) => void;
type THandlerRace<T = any> = (data: T, eventName: string) => void;

const errorNotSupported = <T>(eventName: T): Error => {
  const error = new Error(`Event ${eventName} not supported`);

  return error;
};

class Events<T extends Readonly<string[]> = string[]> {
  _active = true;

  _eventHandlers: any;

  _triggers: any;

  _events: T;

  _debug?: (error: unknown) => void;

  constructor(events: T, { debug }: { debug?: (error: unknown) => void } = {}) {
    this._events = events;
    this._debug = debug;

    this._eventHandlers = {};
    this._triggers = {};
    this._initEventHandlers(this._events);
  }

  _initEventHandlers(eventsNames: T) {
    eventsNames.forEach((eventName) => {
      this._eventHandlers[eventName] = [];
      this._triggers[eventName] = this._resolveTrigger(eventName);
    });
  }

  on<U = any>(eventName: T[number], handler: THandler<U>) {
    const handlers = this._eventHandlers[eventName];

    if (!handlers) {
      throw errorNotSupported(eventName);
    }

    handlers.push(handler);

    return () => {
      this.off(eventName, handler);
    };
  }

  once<U = any>(eventName: T[number], handler: THandler<U>) {
    const onceHandler = (data: any) => {
      this.off(eventName, onceHandler);
      handler(data);
    };

    return this.on(eventName, onceHandler);
  }

  onceRace<U = any>(eventNames: T[number][], handler: THandlerRace<U>) {
    let unsubscribes: (() => void)[] = [];

    const unsubscribe = () => {
      unsubscribes.forEach((unsubscribeItem) => {
        unsubscribeItem();
      });
    };

    unsubscribes = eventNames.map((eventName: string) => {
      return this.once(eventName, (data: U) => {
        unsubscribe();
        handler(data, eventName);
      });
    });

    return unsubscribe;
  }

  wait<U = any>(eventName: T[number]): Promise<U> {
    return new Promise<U>((resolve) => {
      this.once<U>(eventName, resolve);
    });
  }

  off(eventName: T[number], handler: THandler) {
    const handlers: THandler[] = this._eventHandlers[eventName];

    this._eventHandlers[eventName] = handlers?.filter((item) => {
      return item !== handler;
    });
  }

  trigger(eventName: T[number], data: any) {
    const trigger = this._triggers[eventName];

    if (!trigger) {
      throw errorNotSupported(eventName);
    }

    trigger(data);
  }

  get triggers() {
    return this._triggers;
  }

  eachTriggers(handler: (trigger: TTrigger, eventName: T[number]) => void) {
    const triggersEntries: [T[number], TTrigger][] = Object.entries(this._triggers);

    triggersEntries.forEach(([eventName, trigger]) => {
      handler(trigger, eventName);
    });
  }

  removeEventHandlers() {
    this._initEventHandlers(this._events);
  }

  activate() {
    this._active = true;
  }

  deactivate() {
    this._active = false;
  }

  _resolveTrigger = (eventName: T[number]) => {
    const trigger: TTrigger = (data: any) => {
      if (!this._active) {
        return undefined;
      }

      const eventHandlers: THandler[] = this._eventHandlers[eventName];

      eventHandlers.forEach((eventHandler) => {
        try {
          eventHandler(data);
        } catch (error) {
          if (this._debug) {
            this._debug(error);
          } else {
            throw error;
          }
        }
      });

      return undefined;
    };

    return trigger;
  };
}

export default Events;
