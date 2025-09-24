/* eslint-disable valid-jsdoc */
/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
type THandler<T = unknown> = (data: T) => void;
type TTrigger<T = unknown> = (data: T) => void;
type THandlerRace<T = unknown> = (data: T, eventName: string) => void;
type TEventHandlers<T extends string, U = unknown> = Record<T, Set<THandler<U>> | undefined>;
type TTriggers<T extends string, U = unknown> = Record<T, TTrigger<U> | undefined>;

const errorNotSupported = <T extends string = string>(eventName: T): Error => {
  const error = new Error(`Event ${eventName} not supported`);

  return error;
};

const validateEventNames = <T extends readonly string[]>(eventsNames: T) => {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const name of eventsNames) {
    if (seen.has(name)) {
      duplicates.add(name);
    }

    seen.add(name);
  }

  if (duplicates.size > 0) {
    throw new Error(`Event names must be unique: ${[...duplicates].join(', ')}`);
  }
};

class Events<T extends readonly string[] = string[]> {
  public triggers: TTriggers<T[number]>;

  private active = true;

  private eventHandlers: TEventHandlers<T[number]>;

  private readonly eventNames: T;

  private readonly debug?: (error: unknown) => void;

  private readonly maxListeners?: number;

  public constructor(
    eventNames: T,
    { debug, maxListeners }: { debug?: (error: unknown) => void; maxListeners?: number } = {},
  ) {
    validateEventNames(eventNames);

    this.eventNames = eventNames;
    this.debug = debug;
    this.maxListeners = maxListeners;

    this.eventHandlers = {} as TEventHandlers<T[number]>;
    this.triggers = {} as TTriggers<T[number]>;

    this.initEventHandlers(this.eventNames);
  }

  public on<U = unknown>(eventName: T[number], handler: THandler<U>) {
    const handlers = this.getHandlers<U>(eventName);

    if (this.maxListeners !== undefined && handlers.size >= this.maxListeners) {
      throw new Error(`Max listeners (${this.maxListeners}) for event ${eventName} exceeded`);
    }

    handlers.add(handler);

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

  public race<U = unknown>(eventNames: T[number][], handler: THandlerRace<U>) {
    let unsubscribes: (() => void)[] = [];

    const unsubscribe = () => {
      for (const unsubscribeItem of unsubscribes) {
        unsubscribeItem();
      }
    };

    unsubscribes = eventNames.map((eventName: string) => {
      return this.on(eventName, (data: U) => {
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

    handlers.delete(handler as THandler);
  }

  /**
   * Remove all handlers. If eventName is provided – only handlers of that
   * event will be removed, otherwise handlers of all events will be cleared.
   */
  public offAll(eventName?: T[number]) {
    if (eventName !== undefined) {
      this.getHandlers(eventName).clear();

      return;
    }

    for (const name of this.eventNames) {
      this.getHandlers(name).clear();
    }
  }

  /**
   * Deactivate emitter and remove all references to handlers and triggers.
   * After destroy the instance becomes inert – любые вызовы `on/trigger` не дадут эффекта.
   */
  public destroy() {
    // Отключаем активность
    this.deactivate();

    // Очищаем все обработчики
    this.offAll();

    // Удаляем ссылки на триггеры, чтобы экземпляр полностью освободил обработчики
    for (const name of this.eventNames) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete this.triggers[name as T[number]];
    }
  }

  // Overload for events with payload
  public trigger<U = unknown>(eventName: T[number], data: U): void;
  // Overload for events without payload
  public trigger(eventName: T[number]): void;
  public trigger<U = unknown>(eventName: T[number], data?: U) {
    const trigger = this.triggers[eventName] as TTrigger<U> | undefined;

    if (!trigger) {
      // Неизвестное событие – сохраняем старое поведение и бросаем ошибку
      if (!this.eventNames.includes(eventName)) {
        throw errorNotSupported(eventName);
      }

      // Событие известно, но экземпляр уничтожен → молча игнорируем
      return;
    }

    trigger(data as U);
  }

  // Alias for trigger to match Node.js EventEmitter API
  // Overload for events with payload
  public emit<U = unknown>(eventName: T[number], data: U): void;
  // Overload for events without payload
  public emit(eventName: T[number]): void;
  public emit<U = unknown>(eventName: T[number], data?: U) {
    this.trigger(eventName, data as U);
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
    return this.getHandlers(eventName).size > 0;
  }

  private getHandlers<U = unknown>(eventName: T[number]) {
    const handlers = this.eventHandlers[eventName];

    if (!handlers) {
      throw errorNotSupported(eventName);
    }

    return handlers as Set<THandler<U>>;
  }

  private initEventHandlers(eventsNames: T) {
    for (const eventName of eventsNames) {
      this.eventHandlers[eventName as T[number]] = new Set<THandler>();
      this.triggers[eventName as T[number]] = this.resolveTrigger(eventName);
    }
  }

  private readonly resolveTrigger = (eventName: T[number]) => {
    const trigger: TTrigger = (data: unknown) => {
      if (!this.active) {
        return;
      }

      // Создаём снимок текущих обработчиков. Он позволит корректно обходить
      // массив, даже если во время обхода обработчики будут добавляться или
      // удаляться.
      const handlersReference = this.getHandlers(eventName);
      const snapshotHandlers: THandler[] = [...handlersReference];

      for (const eventHandler of snapshotHandlers) {
        // Если обработчик был удалён до того, как настала его очередь —
        // пропускаем вызов.
        if (!handlersReference.has(eventHandler)) {
          // eslint-disable-next-line no-continue
          continue;
        }

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
