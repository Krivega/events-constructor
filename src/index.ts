type TEvent = string;
type THandler = (...args: any[]) => void;
type TTrigger = (...args: any[]) => void;

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

  _events: TEvent[];

  _debug?: (error: Error) => void;

  constructor(events: TEvent[], { debug }: { debug?: (error: Error) => void } = {}) {
    this._events = events;
    this._debug = debug;

    this._initEventHandlers(this._events);
  }

  on(eventName: TEvent, handler: THandler) {
    const handlers = this._eventHandlers[eventName];

    if (handlers) {
      handlers.push(handler);
    } else {
      throw errorNotSupported(eventName);
    }
  }

  once(eventName: TEvent, handler: THandler) {
    const onceHandler = (...args: any[]) => {
      this.off(eventName, onceHandler);
      handler(...args);
    };

    this.on(eventName, onceHandler);
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

  eachTriggers(handler: THandler) {
    Object.entries(this._triggers).forEach(([eventName, trigger]) => {
      handler(trigger, eventName);
    });
  }

  removeEventHandlers() {
    this._initEventHandlers(this._events);
  }

  _initEventHandlers(eventsNames: TEvent[]) {
    eventsNames.forEach((eventName) => {
      this._eventHandlers[eventName] = [];
      this._triggers[eventName] = this._resolveHandleEvent(eventName);
    });
  }

  activate() {
    this._active = true;
  }

  deactivate() {
    this._active = false;
  }

  _resolveHandleEvent = (eventName: TEvent) => (...args: any[]) => {
    if (!this._active) {
      return undefined;
    }

    const eventHandlers = this._eventHandlers[eventName];

    eventHandlers.forEach((eventHandler) => {
      try {
        eventHandler(...args);
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
}

export default Events;
