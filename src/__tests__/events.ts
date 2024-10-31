/// <reference types="jest" />
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/init-declarations */
import Events from '../index';

const initEventNames = ['event1', 'event2'] as const;
const [eventName0, eventName] = initEventNames;

describe('events', () => {
  let debug = jest.fn();
  let events: Events<typeof initEventNames>;
  let mockFunction = jest.fn();

  let argument: Record<string, never>;

  beforeEach(() => {
    debug = jest.fn();
    events = new Events(initEventNames, { debug });
    mockFunction = jest.fn();
    argument = {};
  });

  it('on', () => {
    events.on(eventName, mockFunction);

    // @ts-expect-error
    expect(events.eventHandlers[eventName][0]).toBe(mockFunction);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(1);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(2);
  });

  it('on: returns unsubscribe', () => {
    const unsubscribe = events.on(eventName, mockFunction);

    unsubscribe();

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(0);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  it('onceRace', () => {
    events.onceRace([eventName0, eventName], mockFunction);

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(1);

    const argument0 = 'arg0';

    events.trigger(eventName0, argument0);

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction.mock.calls[0][0]).toBe(argument0);
    expect(mockFunction.mock.calls[0][1]).toBe(eventName0);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(1);
  });

  it('onceRace: returns unsubscribe', () => {
    const unsubscribe = events.onceRace([eventName0, eventName], mockFunction);

    unsubscribe();

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(0);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  it('wait', async () => {
    type TTestData = { id: string };

    const testData: TTestData = { id: 'test' };
    const promise = events.wait<TTestData>(eventName);

    events.trigger(eventName, testData);

    return promise.then((data) => {
      expect(data).toBe(testData);
    });
  });

  it('once', () => {
    const mockTriggerOnceFunction = jest.fn();
    const mockTriggerOnceFunction2 = jest.fn();

    events.once(eventName, mockTriggerOnceFunction);
    events.once(eventName, mockTriggerOnceFunction2);
    events.on(eventName, mockFunction);

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(3);

    events.trigger(eventName, argument);

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(1);
    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);

    events.trigger(eventName, argument);

    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledTimes(2);
    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(1);
    // @ts-expect-error
    expect(events.eventHandlers[eventName][0]).toBe(mockFunction);
  });

  it('once: returns unsubscribe', () => {
    const unsubscribe = events.once(eventName, mockFunction);

    unsubscribe();

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(0);

    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  it('once: loopback', () => {
    const triggerEventName = jest.fn(() => {
      events.trigger(eventName, argument);
    });

    events.once(eventName, triggerEventName);

    triggerEventName();
    expect(triggerEventName).toHaveBeenCalledTimes(2);
  });

  it('handle errors', () => {
    const mockTriggerOnceFunction = jest.fn(() => {
      throw new Error('Error');
    });
    const mockTriggerOnceFunction2 = jest.fn();

    events.once(eventName, mockTriggerOnceFunction);
    events.once(eventName, mockTriggerOnceFunction2);
    events.on(eventName, mockFunction);

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(3);

    events.trigger(eventName, argument);

    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(1);
    expect(debug).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);

    events.trigger(eventName, argument);

    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledTimes(2);
    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(1);
    // @ts-expect-error
    expect(events.eventHandlers[eventName][0]).toBe(mockFunction);
  });

  it('off', () => {
    events.on(eventName, mockFunction);
    events.off(eventName, mockFunction);
    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(0);
  });

  it('removeEventHandlers', () => {
    events.on(eventName, mockFunction);
    events.removeEventHandlers();
    // @ts-expect-error
    expect(events.eventHandlers[eventName].length).toBe(0);
  });

  it('trigger', () => {
    events.on(eventName, mockFunction);
    events.trigger(eventName, argument);
    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction).toHaveBeenCalledWith(argument);
  });

  it('get triggers', () => {
    expect(events.triggers).toHaveProperty(initEventNames[0]);
    expect(events.triggers).toHaveProperty(initEventNames[1]);
  });

  it('eachTriggers', () => {
    events.eachTriggers(mockFunction);

    expect(mockFunction).toHaveBeenCalledTimes(initEventNames.length);
    expect(mockFunction.mock.calls[0][0]).toEqual(expect.any(Function));
    expect(mockFunction.mock.calls[0][1]).toBe(initEventNames[0]);
    expect(mockFunction.mock.calls[1][0]).toEqual(expect.any(Function));
    expect(mockFunction.mock.calls[1][1]).toBe(initEventNames[1]);
  });

  it('_resolveTrigger', () => {
    events.on(eventName, mockFunction);
    // @ts-expect-error
    events.resolveTrigger(eventName)(argument);

    expect(mockFunction).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledWith(argument);
  });

  it('error with debug', () => {
    events.on(eventName, () => {
      throw new Error('test');
    });
    events.trigger(eventName, argument);

    expect(debug).toHaveBeenCalledTimes(1);
  });

  it('error without debug', () => {
    events = new Events(initEventNames);

    const error = new Error('test');

    expect(() => {
      events.on(eventName, () => {
        throw error;
      });
      events.trigger(eventName, argument);
    }).toThrow(error);
  });

  it('on not supported error', () => {
    const eventNameNotSupported = 'eventName not supported';

    expect(() => {
      // @ts-expect-error
      return events.on(eventNameNotSupported, mockFunction);
    }).toThrow(new Error(`Event ${eventNameNotSupported} not supported`));
  });

  it('trigger not supported error', () => {
    const eventNameNotSupported = 'eventName not supported';

    expect(() => {
      // @ts-expect-error
      events.trigger(eventNameNotSupported, mockFunction);
    }).toThrow(new Error(`Event ${eventNameNotSupported} not supported`));
  });

  it('activate/deactivate', () => {
    events.on(eventName, mockFunction);
    events.trigger(eventName, argument);
    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(2);
    expect(mockFunction).toHaveBeenCalledWith(argument);

    events.deactivate();
    events.trigger(eventName, argument);
    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(2);

    events.activate();
    events.trigger(eventName, argument);
    events.trigger(eventName, argument);

    expect(mockFunction).toHaveBeenCalledTimes(4);
  });

  it('hasHandlers', () => {
    expect(events.hasHandlers(eventName)).toBe(false);

    events.on(eventName, mockFunction);

    expect(events.hasHandlers(eventName)).toBe(true);

    events.off(eventName, mockFunction);

    expect(events.hasHandlers(eventName)).toBe(false);
  });
});
