/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
type THandler<T = unknown> = (data: T) => void;
type TTrigger<T = unknown> = (data: T) => void;
type THandlerRace<T = unknown> = (data: T, eventName: string) => void;
type TEventHandlers<T extends string, U = unknown> = Record<T, THandler<U>[] | undefined>;
type TTriggers<T extends string, U = unknown> = Record<T, TTrigger<U> | undefined>;

const errorNotSupported = <T extends string = string>(eventName: T): Error => {
  const error = new Error(`Event ${eventName} not supported`);

  return error;
};

const validateEventNames = <T extends readonly string[]>(eventsNames: T) => {
  const set = new Set(eventsNames);

  if (set.size !== eventsNames.length) {
    throw new Error('Event names must be unique');
  }
};

class Events<T extends readonly string[] = string[]> {
  public triggers: TTriggers<T[number]>;

  private active = true;

  private eventHandlers: TEventHandlers<T[number]>;

  private readonly eventNames: T;

  private readonly debug?: (error: unknown) => void;

  public constructor(eventNames: T, { debug }: { debug?: (error: unknown) => void } = {}) {
    validateEventNames(eventNames);

    this.eventNames = eventNames;
    this.debug = debug;

    this.eventHandlers = {} as TEventHandlers<T[number]>;
    this.triggers = {} as TTriggers<T[number]>;

    this.initEventHandlers(this.eventNames);
  }

  public on<U = unknown>(eventName: T[number], handler: THandler<U>) {
    const handlers = this.getHandlers<U>(eventName);

    handlers.push(handler);

    return () => {
      this.off(eventName, handler);
    };
  }

  public once<U = unknown>(eventName: T[number], handler: THandler<U>) {
    const onceHandler = (data: U) => {
      this.off(eventName, onceHandler);
      handler(data);
    };

    return this.on(eventName, onceHandler);
  }

  public onceRace<U = unknown>(eventNames: T[number][], handler: THandlerRace<U>) {
    let unsubscribes: (() => void)[] = [];

    const unsubscribe = () => {
      for (const unsubscribeItem of unsubscribes) {
        unsubscribeItem();
      }
    };

    unsubscribes = eventNames.map((eventName: string) => {
      return this.once(eventName, (data: U) => {
        unsubscribe();
        handler(data, eventName);
      });
    });

    return unsubscribe;
  }

  public async wait<U = unknown>(eventName: T[number]): Promise<U> {
    return new Promise<U>((resolve) => {
      this.once<U>(eventName, resolve);
    });
  }

  public off<U = unknown>(eventName: T[number], handler: THandler<U>) {
    const handlers = this.getHandlers<U>(eventName);

    // @ts-expect-error
    this.eventHandlers[eventName] = handlers.filter((item) => {
      return item !== handler;
    });
  }

  public trigger<U = unknown>(eventName: T[number], data: U) {
    const trigger = this.getTrigger<U>(eventName);

    trigger(data);
  }

  public emit<U = unknown>(eventName: T[number], data: U) {
    this.trigger(eventName, data);
  }

  public eachTriggers(handler: (trigger: TTrigger, eventName: T[number]) => void) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const triggersEntries: [T[number], TTrigger][] = Object.entries(this.triggers);

    for (const [eventName, trigger] of triggersEntries) {
      handler(trigger, eventName);
    }
  }

  public removeEventHandlers() {
    this.initEventHandlers(this.eventNames);
  }

  public activate() {
    this.active = true;
  }

  public deactivate() {
    this.active = false;
  }

  public hasHandlers(eventName: T[number]): boolean {
    return this.getHandlers(eventName).length > 0;
  }

  private getHandlers<U = unknown>(eventName: T[number]) {
    const handlers = this.eventHandlers[eventName];

    if (!handlers) {
      throw errorNotSupported(eventName);
    }

    return handlers as THandler<U>[];
  }

  private getTrigger<U = unknown>(eventName: T[number]) {
    const trigger = this.triggers[eventName];

    if (!trigger) {
      throw errorNotSupported(eventName);
    }

    return this.triggers[eventName] as TTrigger<U>;
  }

  private initEventHandlers(eventsNames: T) {
    for (const eventName of eventsNames) {
      this.eventHandlers[eventName as T[number]] = [] as THandler[];
      this.triggers[eventName as T[number]] = this.resolveTrigger(eventName);
    }
  }

  private readonly resolveTrigger = (eventName: T[number]) => {
    const trigger: TTrigger = (data: unknown) => {
      if (!this.active) {
        return;
      }

      const eventHandlers: THandler[] = this.getHandlers(eventName);

      for (const eventHandler of eventHandlers) {
        try {
          eventHandler(data);
        } catch (error) {
          if (this.debug) {
            this.debug(error);
          } else {
            throw error;
          }
        }
      }
    };

    return trigger;
  };
}

export default Events;
