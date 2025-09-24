/// <reference types="jest" />
/* eslint-disable @typescript-eslint/init-declarations */
import Events from '../Events';

const initEventNames = ['event1', 'event2'] as const;
const [eventName0, eventName1] = initEventNames;

describe('Events', () => {
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

  describe('constructor and configuration', () => {
    it('constructor: error with duplicate event names', () => {
      const eventNames = ['event1', 'event1'] as const;

      expect(() => {
        // eslint-disable-next-line no-new
        new Events<typeof eventNames>(eventNames);
      }).toThrow(new Error('Event names must be unique: event1'));
    });

    it('maxListeners exceeded', () => {
      const limit = 1;
      const localEvents = new Events(initEventNames, { maxListeners: limit });

      localEvents.on(eventName0, jest.fn());

      expect(() => {
        localEvents.on(eventName0, jest.fn());
      }).toThrow(new Error(`Max listeners (${limit}) for event ${eventName0} exceeded`));

      // Добавление слушателя к другому событию допускается
      expect(() => {
        localEvents.on(eventName1, jest.fn());
      }).not.toThrow();
    });
  });

  describe('subscription methods', () => {
    describe('on', () => {
      it('on', () => {
        events.on(eventName0, mockFunction);

        // @ts-expect-error
        expect([...events.eventHandlers[eventName0]][0]).toBe(mockFunction);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(1);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);
      });

      it('on: returns unsubscribe', () => {
        const unsubscribe = events.on(eventName0, mockFunction);

        unsubscribe();

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(0);
      });
    });

    describe('once', () => {
      it('once', () => {
        const mockTriggerOnceFunction = jest.fn();
        const mockTriggerOnceFunction2 = jest.fn();

        events.once(eventName0, mockTriggerOnceFunction);
        events.once(eventName0, mockTriggerOnceFunction2);
        events.on(eventName0, mockFunction);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(3);

        events.trigger(eventName0, argument);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);
        expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
        expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);

        events.trigger(eventName0, argument);

        expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
        expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);
        expect(mockFunction).toHaveBeenCalledTimes(2);
        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);
        // @ts-expect-error
        expect([...events.eventHandlers[eventName0]][0]).toBe(mockFunction);
      });

      it('once: returns unsubscribe', () => {
        const unsubscribe = events.once(eventName0, mockFunction);

        unsubscribe();

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(0);
      });

      it('once: loopback', () => {
        const triggerEventName = jest.fn(() => {
          events.trigger(eventName0, argument);
        });

        events.once(eventName0, triggerEventName);

        triggerEventName();
        expect(triggerEventName).toHaveBeenCalledTimes(2);
      });
    });

    describe('onceRace', () => {
      it('onceRace', () => {
        events.onceRace([eventName0, eventName1], mockFunction);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);

        const argument0 = 'arg0';

        events.trigger(eventName0, argument0);

        expect(mockFunction).toHaveBeenCalledTimes(1);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][0]).toBe(argument0);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][1]).toBe(eventName0);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(1);
      });

      it('onceRace: returns unsubscribe', () => {
        const unsubscribe = events.onceRace([eventName0, eventName1], mockFunction);

        unsubscribe();

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(0);
      });
    });

    describe('race', () => {
      it('race', () => {
        events.race([eventName0, eventName1], mockFunction);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);

        const argument0 = 'arg0';

        events.trigger(eventName0, argument0);

        expect(mockFunction).toHaveBeenCalledTimes(1);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][0]).toBe(argument0);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][1]).toBe(eventName0);

        // Trigger the same event again - should be called again (unlike onceRace)
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[1][0]).toBe(argument);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[1][1]).toBe(eventName0);

        // Trigger the second event - should also be called
        const argument1 = 'arg1';

        events.trigger(eventName1, argument1);

        expect(mockFunction).toHaveBeenCalledTimes(3);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[2][0]).toBe(argument1);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[2][1]).toBe(eventName1);
      });

      it('race: returns unsubscribe', () => {
        const unsubscribe = events.race([eventName0, eventName1], mockFunction);

        unsubscribe();

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);

        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(0);
      });

      it('race: multiple race handlers', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();
        const regularHandler = jest.fn();

        // Set up multiple race handlers
        events.race([eventName0, eventName1], raceHandler1);
        events.race([eventName0, eventName1], raceHandler2);
        events.on(eventName0, regularHandler);

        const payload = 'test-payload';

        // Trigger the event
        events.trigger(eventName0, payload);

        // Verify all handlers were called
        expect(raceHandler1).toHaveBeenCalledWith(payload, eventName0);
        expect(raceHandler2).toHaveBeenCalledWith(payload, eventName0);
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - all handlers should be called again
        events.trigger(eventName0, payload);

        expect(raceHandler1).toHaveBeenCalledTimes(2);
        expect(raceHandler2).toHaveBeenCalledTimes(2);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('race: different event combinations', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();

        // Set up race handlers for different event combinations
        events.race([eventName0], raceHandler1);
        events.race([eventName1], raceHandler2);

        // Trigger eventName0
        events.trigger(eventName0, 'test0');

        // Verify only eventName0 race handler was called
        expect(raceHandler1).toHaveBeenCalledWith('test0', eventName0);
        expect(raceHandler2).toHaveBeenCalledTimes(0);

        // Trigger eventName1
        events.trigger(eventName1, 'test1');

        // Verify eventName1 race handler was called
        expect(raceHandler2).toHaveBeenCalledWith('test1', eventName1);

        // Trigger eventName0 again
        events.trigger(eventName0, 'test0-again');

        // Verify eventName0 race handler was called again
        expect(raceHandler1).toHaveBeenCalledTimes(2);
        expect(raceHandler1).toHaveBeenLastCalledWith('test0-again', eventName0);
      });
    });
  });

  describe('management methods', () => {
    describe('wait', () => {
      it('wait', async () => {
        type TTestData = { id: string };

        const testData: TTestData = { id: 'test' };
        const promise = events.wait<TTestData>(eventName0);

        events.trigger(eventName0, testData);

        return promise.then((data) => {
          expect(data).toBe(testData);
        });
      });
    });

    describe('off', () => {
      it('off', () => {
        events.on(eventName0, mockFunction);
        events.off(eventName0, mockFunction);
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(0);
        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);
      });

      it('removeEventHandlers', () => {
        events.on(eventName0, mockFunction);
        events.removeEventHandlers();
        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);
      });
    });

    describe('offAll', () => {
      it('offAll by event', () => {
        const handler0 = jest.fn();
        const handler1 = jest.fn();

        events.on(eventName0, handler0);
        events.on(eventName1, handler1);

        // Удаляем подписки только для eventName0
        events.offAll(eventName0);

        events.trigger(eventName0, argument);
        events.trigger(eventName1, argument);

        expect(handler0).toHaveBeenCalledTimes(0);
        expect(handler1).toHaveBeenCalledTimes(1);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);
        // @ts-expect-error
        expect(events.eventHandlers[eventName1].size).toBe(1);
      });

      it('offAll all events', () => {
        const handler0 = jest.fn();
        const handler1 = jest.fn();

        events.on(eventName0, handler0);
        events.on(eventName1, handler1);

        events.offAll();

        events.trigger(eventName0, argument);
        events.trigger(eventName1, argument);

        expect(handler0).toHaveBeenCalledTimes(0);
        expect(handler1).toHaveBeenCalledTimes(0);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(0);
        // @ts-expect-error
        expect(events.eventHandlers[eventName1].size).toBe(0);
      });
    });

    describe('lifecycle', () => {
      it('hasHandlers', () => {
        expect(events.hasHandlers(eventName0)).toBe(false);

        events.on(eventName0, mockFunction);

        expect(events.hasHandlers(eventName0)).toBe(true);

        events.off(eventName0, mockFunction);

        expect(events.hasHandlers(eventName0)).toBe(false);
      });

      it('destroy', () => {
        const handler0 = jest.fn();
        const handler1 = jest.fn();

        events.on(eventName0, handler0);
        events.on(eventName1, handler1);

        events.destroy();

        events.trigger(eventName0, argument);
        events.trigger(eventName1, argument);

        expect(handler0).toHaveBeenCalledTimes(0);
        expect(handler1).toHaveBeenCalledTimes(0);

        expect(events.triggers[eventName0]).toBeUndefined();
        expect(events.triggers[eventName1]).toBeUndefined();
      });

      it('activate/deactivate', () => {
        events.on(eventName0, mockFunction);
        events.trigger(eventName0, argument);
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);
        expect(mockFunction).toHaveBeenCalledWith(argument);

        events.deactivate();
        events.trigger(eventName0, argument);
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);

        events.activate();
        events.trigger(eventName0, argument);
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(4);
      });
    });
  });

  it('once', () => {
    const mockTriggerOnceFunction = jest.fn();
    const mockTriggerOnceFunction2 = jest.fn();

    events.once(eventName0, mockTriggerOnceFunction);
    events.once(eventName0, mockTriggerOnceFunction2);
    events.on(eventName0, mockFunction);

    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(3);

    events.trigger(eventName0, argument);

    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(1);
    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);

    events.trigger(eventName0, argument);

    expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);
    expect(mockFunction).toHaveBeenCalledTimes(2);
    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(1);
    // @ts-expect-error
    expect([...events.eventHandlers[eventName0]][0]).toBe(mockFunction);
  });

  it('once: returns unsubscribe', () => {
    const unsubscribe = events.once(eventName0, mockFunction);

    unsubscribe();

    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(0);

    events.trigger(eventName0, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
  });

  it('once: loopback', () => {
    const triggerEventName = jest.fn(() => {
      events.trigger(eventName0, argument);
    });

    events.once(eventName0, triggerEventName);

    triggerEventName();
    expect(triggerEventName).toHaveBeenCalledTimes(2);
  });

  describe('error handling and edge cases', () => {
    describe('error handling', () => {
      it('handle errors', () => {
        const mockTriggerOnceFunction = jest.fn(() => {
          throw new Error('Error');
        });
        const mockTriggerOnceFunction2 = jest.fn();

        events.once(eventName0, mockTriggerOnceFunction);
        events.once(eventName0, mockTriggerOnceFunction2);
        events.on(eventName0, mockFunction);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(3);

        events.trigger(eventName0, argument);

        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);
        expect(debug).toHaveBeenCalledTimes(1);
        expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
        expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);

        events.trigger(eventName0, argument);

        expect(mockTriggerOnceFunction).toHaveBeenCalledTimes(1);
        expect(mockTriggerOnceFunction2).toHaveBeenCalledTimes(1);
        expect(mockFunction).toHaveBeenCalledTimes(2);
        // @ts-expect-error
        expect(events.eventHandlers[eventName0].size).toBe(1);
        // @ts-expect-error
        expect([...events.eventHandlers[eventName0]][0]).toBe(mockFunction);
      });

      it('error with debug', () => {
        events.on(eventName0, () => {
          throw new Error('test');
        });
        events.trigger(eventName0, argument);

        expect(debug).toHaveBeenCalledTimes(1);
      });

      it('error without debug', () => {
        events = new Events(initEventNames);

        const error = new Error('test');

        expect(() => {
          events.on(eventName0, () => {
            throw error;
          });
          events.trigger(eventName0, argument);
        }).toThrow(error);
      });
    });

    describe('unsupported events', () => {
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
    });

    describe('race conditions', () => {
      it('trigger vs off race condition', () => {
        const handler = jest.fn();
        const unsubscribeOnTrigger = jest.fn(() => {
          events.off(eventName0, handler);
        });

        // Subscribe the once handler first so that it executes before the regular handler.
        events.once(eventName0, unsubscribeOnTrigger);
        // Subscribe the regular handler after – it will be removed in the middle of trigger execution.
        events.on(eventName0, handler);

        events.trigger(eventName0, argument);

        expect(unsubscribeOnTrigger).toHaveBeenCalledTimes(1);
        // We expect the second handler NOT to be called because it was removed during trigger execution.
        // The current implementation still calls it, revealing the race condition.
        expect(handler).toHaveBeenCalledTimes(0);
      });
    });
  });

  it('off', () => {
    events.on(eventName0, mockFunction);
    events.off(eventName0, mockFunction);
    events.trigger(eventName0, argument);

    expect(mockFunction).toHaveBeenCalledTimes(0);
    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(0);
  });

  it('removeEventHandlers', () => {
    events.on(eventName0, mockFunction);
    events.removeEventHandlers();
    // @ts-expect-error
    expect(events.eventHandlers[eventName0].size).toBe(0);
  });

  describe('emission methods', () => {
    describe('trigger and emit', () => {
      it('trigger', () => {
        events.on(eventName0, mockFunction);
        events.trigger(eventName0, argument);
        events.trigger(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);
        expect(mockFunction).toHaveBeenCalledWith(argument);
      });

      it('emit', () => {
        events.on(eventName0, mockFunction);
        events.emit(eventName0, argument);
        events.emit(eventName0, argument);

        expect(mockFunction).toHaveBeenCalledTimes(2);
        expect(mockFunction).toHaveBeenCalledWith(argument);
      });

      it('should handle events without payload correctly', () => {
        const handler = jest.fn();

        events.on(eventName0, handler);

        // Should work without payload
        events.trigger(eventName0);

        expect(handler).toHaveBeenCalledWith(undefined);

        // Should also work with emit
        events.emit(eventName0);

        expect(handler).toHaveBeenCalledTimes(2);
      });
    });

    describe('triggers', () => {
      it('get triggers', () => {
        expect(events.triggers).toHaveProperty(initEventNames[0]);
        expect(events.triggers).toHaveProperty(initEventNames[1]);
      });

      it('eachTriggers', () => {
        events.eachTriggers(mockFunction);

        expect(mockFunction).toHaveBeenCalledTimes(initEventNames.length);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][0]).toEqual(expect.any(Function));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[0][1]).toBe(initEventNames[0]);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[1][0]).toEqual(expect.any(Function));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        expect(mockFunction.mock.calls[1][1]).toBe(initEventNames[1]);
      });
    });
  });

  describe('utility methods', () => {
    describe('internal methods', () => {
      it('_resolveTrigger', () => {
        events.on(eventName0, mockFunction);
        // @ts-expect-error
        events.resolveTrigger(eventName0)(argument);

        expect(mockFunction).toHaveBeenCalledTimes(1);
        expect(mockFunction).toHaveBeenCalledWith(argument);
      });
    });

    describe('eachTriggers detailed tests', () => {
      it('should iterate through all triggers with proper functionality', () => {
        const handler = jest.fn();
        const event1Handler = jest.fn();
        const event2Handler = jest.fn();

        // Set up event handlers
        events.on(eventName0, event1Handler);
        events.on(eventName1, event2Handler);

        // Use eachTriggers to iterate through triggers
        events.eachTriggers((trigger, eventName) => {
          handler(trigger, eventName);

          // Test that triggers work correctly
          if (eventName === eventName0) {
            trigger('test-data-1');
          } else {
            trigger('test-data-2');
          }
        });

        // Verify handler was called for each event
        expect(handler).toHaveBeenCalledTimes(2);

        // Verify triggers were called with correct data
        expect(event1Handler).toHaveBeenCalledWith('test-data-1');
        expect(event2Handler).toHaveBeenCalledWith('test-data-2');
      });

      it('should provide correct trigger types for each event', () => {
        const triggers: { trigger: unknown; eventName: string }[] = [];

        events.eachTriggers((trigger, eventName) => {
          triggers.push({ trigger, eventName });
        });

        expect(triggers).toHaveLength(2);
        expect(
          triggers.map((t) => {
            return t.eventName;
          }),
        ).toEqual([eventName0, eventName1]);

        // Test that triggers are functions
        for (const { trigger } of triggers) {
          expect(typeof trigger).toBe('function');
        }
      });

      it('should work with empty event handlers', () => {
        const handler = jest.fn();

        // Should not throw even without any event handlers
        expect(() => {
          events.eachTriggers(handler);
        }).not.toThrow();

        expect(handler).toHaveBeenCalledTimes(2);
      });

      it('should maintain trigger functionality after iteration', () => {
        const event1Handler = jest.fn();
        const event2Handler = jest.fn();

        events.on(eventName0, event1Handler);
        events.on(eventName1, event2Handler);

        // Iterate through triggers
        events.eachTriggers(() => {
          // Just iterate, don't call triggers
        });

        // Verify triggers still work after iteration
        events.trigger(eventName0, 'test-data-1');
        events.trigger(eventName1, 'test-data-2');

        expect(event1Handler).toHaveBeenCalledWith('test-data-1');
        expect(event2Handler).toHaveBeenCalledWith('test-data-2');
      });

      it('should work with different data types', () => {
        const stringHandler = jest.fn();
        const objectHandler = jest.fn();

        events.on(eventName0, stringHandler);
        events.on(eventName1, objectHandler);

        events.eachTriggers((trigger, eventName) => {
          if (eventName === eventName0) {
            trigger('string-data');
          } else {
            trigger({ id: 123, name: 'test' });
          }
        });

        expect(stringHandler).toHaveBeenCalledWith('string-data');
        expect(objectHandler).toHaveBeenCalledWith({ id: 123, name: 'test' });
      });
    });
  });
});
