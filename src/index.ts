type TEvent = string;
type TEvents = Readonly<TEvent[]>;
type THandler<T = any> = (data: T) => void;
type TTrigger<T = any> = (data: T) => void;

const errorNotSupported = (eventName: TEvent): Error => {
  const error = new Error(`Event ${eventName} not supported`);

  return error;
};

class Events {
  _active = true;

  _eventHandlers: {
    [key: string]: THandler[];
  } = {};

  _triggers: {
    [key: string]: TTrigger;
  } = {};

  _events: TEvents;

  _debug?: (error: Error) => void;

  constructor(events: TEvents, { debug }: { debug?: (error: Error) => void } = {}) {
    this._events = events;
    this._debug = debug;

    this._initEventHandlers(this._events);
  }

  on<T = any>(eventName: TEvent, handler: THandler<T>) {
    const handlers = this._eventHandlers[eventName];

    if (handlers) {
      handlers.push(handler);
    } else {
      throw errorNotSupported(eventName);
    }
  }

  once<T = any>(eventName: TEvent, handler: THandler<T>) {
    const onceHandler = (data: any) => {
      this.off(eventName, onceHandler);
      handler(data);
    };

    this.on(eventName, onceHandler);
  }

  wait<T = any>(eventName: TEvent): Promise<T> {
    return new Promise<T>((resolve) => {
      this.once<T>(eventName, resolve);
    });
  }

  off(eventName: TEvent, handler: THandler) {
    const handlers = this._eventHandlers[eventName];

    this._eventHandlers[eventName] = handlers.filter((item) => item !== handler);
  }

  trigger(eventName: TEvent, data: any) {
    const trigger = this._triggers[eventName];

    if (trigger) {
      trigger(data);
    } else {
      throw errorNotSupported(eventName);
    }
  }

  get triggers() {
    return this._triggers;
  }

  eachTriggers(handler: (trigger: TTrigger, eventName: TEvent) => void) {
    Object.entries(this._triggers).forEach(([eventName, trigger]) => {
      handler(trigger, eventName);
    });
  }

  removeEventHandlers() {
    this._initEventHandlers(this._events);
  }

  _initEventHandlers(eventsNames: TEvents) {
    eventsNames.forEach((eventName) => {
      this._eventHandlers[eventName] = [];
      this._triggers[eventName] = this._resolveTrigger(eventName);
    });
  }

  activate() {
    this._active = true;
  }

  deactivate() {
    this._active = false;
  }

  _resolveTrigger = (eventName: TEvent) => {
    const trigger: TTrigger = (data: any) => {
      if (!this._active) {
        return undefined;
      }

      const eventHandlers = this._eventHandlers[eventName];

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
