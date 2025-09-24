/// <reference types="jest" />
/* eslint-disable @typescript-eslint/init-declarations */
import TypedEvents from '../TypedEvents';

type TMap = {
  userLoaded: { id: string };
  logout: never;
};

const initEventNames = ['userLoaded', 'logout'] as const;

describe('TypedEvents', () => {
  let events: TypedEvents<TMap>;

  beforeEach(() => {
    events = new TypedEvents<TMap>(initEventNames);
  });

  describe('basic functionality', () => {
    it('typed events payload typing', () => {
      const callback = jest.fn();

      events.on('userLoaded', callback);

      const payload = { id: '1' } as const;

      events.trigger('userLoaded', payload);

      expect(callback).toHaveBeenCalledWith(payload);

      // Should also work with emit
      events.emit('userLoaded', payload);

      expect(callback).toHaveBeenCalledTimes(2);

      // @ts-expect-error – wrong payload type
      events.trigger('userLoaded', { wrong: true });
      // @ts-expect-error – wrong payload type
      events.emit('userLoaded', { wrong: true });
    });

    it('should handle events without payload correctly', () => {
      const logoutCallback = jest.fn();

      events.on('logout', logoutCallback);

      // Should work without payload for logout event
      events.trigger('logout');

      expect(logoutCallback).toHaveBeenCalledWith(undefined);

      // Should also work with emit
      events.emit('logout');

      expect(logoutCallback).toHaveBeenCalledTimes(2);
    });
  });

  describe('subscription methods', () => {
    describe('once', () => {
      it('should handle typed once with payload', () => {
        const onceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up once and regular handlers
        events.once('userLoaded', onceHandler);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify both handlers were called with correct payload
        expect(onceHandler).toHaveBeenCalledWith(payload);
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - once handler should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle typed once without payload', () => {
        const onceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up once and regular handlers for logout event
        events.once('logout', onceHandler);
        events.on('logout', regularHandler);

        // Trigger the event without payload
        events.trigger('logout');

        // Verify both handlers were called
        expect(onceHandler).toHaveBeenCalledWith(undefined);
        expect(regularHandler).toHaveBeenCalledWith(undefined);

        // Trigger again - once handler should not be called
        events.trigger('logout');

        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should return unsubscribe function', () => {
        const onceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up handlers
        events.once('userLoaded', onceHandler);
        events.on('userLoaded', regularHandler);

        // Get unsubscribe function from once
        const unsubscribe = events.once('userLoaded', jest.fn());

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify handlers were called
        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(1);

        // Unsubscribe
        unsubscribe();

        // Trigger again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify once handler was not called again
        expect(onceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple once handlers for same event', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const regularHandler = jest.fn();

        // Set up multiple once handlers
        events.once('userLoaded', handler1);
        events.once('userLoaded', handler2);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify all handlers were called
        expect(handler1).toHaveBeenCalledWith(payload);
        expect(handler2).toHaveBeenCalledWith(payload);
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - once handlers should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle once handlers for different events', () => {
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up once handlers for different events
        events.once('userLoaded', userLoadedHandler);
        events.once('logout', logoutHandler);

        // Trigger userLoaded event
        events.trigger('userLoaded', { id: 'test' });

        // Verify only userLoaded handler was called
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
        expect(logoutHandler).toHaveBeenCalledTimes(0);

        // Trigger logout event
        events.trigger('logout');

        // Verify logout handler was called
        expect(logoutHandler).toHaveBeenCalledWith(undefined);

        // Trigger userLoaded again - handler should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(userLoadedHandler).toHaveBeenCalledTimes(1);
        expect(logoutHandler).toHaveBeenCalledTimes(1);
      });
    });

    describe('onceRace', () => {
      it('should handle typed onceRace with payload events', () => {
        const raceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up race handler for userLoaded event
        events.onceRace(['userLoaded'], raceHandler);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify race handler was called with correct payload and event name
        expect(raceHandler).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - race handler should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle typed onceRace with multiple events', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for multiple events
        events.onceRace(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger userLoaded event first
        events.trigger('userLoaded', { id: 'test' });

        // Verify race handler was called with userLoaded event
        expect(raceHandler).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
        expect(logoutHandler).toHaveBeenCalledTimes(0);

        // Trigger logout event - race handler should not be called again
        events.trigger('logout');

        expect(raceHandler).toHaveBeenCalledTimes(1);
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
      });

      it('should handle typed onceRace with logout event first', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for multiple events
        events.onceRace(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger logout event first
        events.trigger('logout');

        // Verify race handler was called with logout event
        expect(raceHandler).toHaveBeenCalledWith(undefined, 'logout');
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
        expect(userLoadedHandler).toHaveBeenCalledTimes(0);

        // Trigger userLoaded event - race handler should not be called again
        events.trigger('userLoaded', { id: 'test' });

        expect(raceHandler).toHaveBeenCalledTimes(1);
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
      });

      it('should return unsubscribe function', () => {
        const raceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up race handler
        events.onceRace(['userLoaded'], raceHandler);
        events.on('userLoaded', regularHandler);

        // Get unsubscribe function from another race handler
        const unsubscribe = events.onceRace(['userLoaded'], jest.fn());

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify handlers were called
        expect(raceHandler).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith({ id: 'test' });

        // Unsubscribe
        unsubscribe();

        // Trigger again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify race handler was not called again
        expect(raceHandler).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple race handlers for same events', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();
        const regularHandler = jest.fn();

        // Set up multiple race handlers
        events.onceRace(['userLoaded', 'logout'], raceHandler1);
        events.onceRace(['userLoaded', 'logout'], raceHandler2);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify all race handlers were called
        expect(raceHandler1).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(raceHandler2).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - race handlers should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler1).toHaveBeenCalledTimes(1);
        expect(raceHandler2).toHaveBeenCalledTimes(1);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle race handlers with different event combinations', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();

        // Set up race handlers for different event combinations
        events.onceRace(['userLoaded'], raceHandler1);
        events.onceRace(['logout'], raceHandler2);

        // Trigger userLoaded event
        events.trigger('userLoaded', { id: 'test' });

        // Verify only userLoaded race handler was called
        expect(raceHandler1).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(raceHandler2).toHaveBeenCalledTimes(0);

        // Trigger logout event
        events.trigger('logout');

        // Verify logout race handler was called
        expect(raceHandler2).toHaveBeenCalledWith(undefined, 'logout');

        // Trigger userLoaded again - race handler should not be called
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler1).toHaveBeenCalledTimes(1);
        expect(raceHandler2).toHaveBeenCalledTimes(1);
      });

      it('should handle race handlers with mixed payload types', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for events with different payload types
        events.onceRace(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger logout event (no payload)
        events.trigger('logout');

        // Verify race handler was called with undefined payload
        expect(raceHandler).toHaveBeenCalledWith(undefined, 'logout');
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
        expect(userLoadedHandler).toHaveBeenCalledTimes(0);

        // Trigger userLoaded event (with payload) - race handler should not be called
        events.trigger('userLoaded', { id: 'test' });

        expect(raceHandler).toHaveBeenCalledTimes(1);
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
      });
    });

    describe('race', () => {
      it('should handle typed race with payload events', () => {
        const raceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up race handler for userLoaded event
        events.race(['userLoaded'], raceHandler);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify race handler was called with correct payload and event name
        expect(raceHandler).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - race handler should be called again (unlike onceRace)
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler).toHaveBeenCalledTimes(2);
        expect(raceHandler).toHaveBeenLastCalledWith({ id: 'test2' }, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle typed race with multiple events', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for multiple events
        events.race(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger userLoaded event first
        events.trigger('userLoaded', { id: 'test' });

        // Verify race handler was called with userLoaded event
        expect(raceHandler).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
        expect(logoutHandler).toHaveBeenCalledTimes(0);

        // Trigger logout event - race handler should be called again
        events.trigger('logout');

        expect(raceHandler).toHaveBeenCalledTimes(2);
        expect(raceHandler).toHaveBeenLastCalledWith(undefined, 'logout');
        expect(logoutHandler).toHaveBeenCalledWith(undefined);

        // Trigger userLoaded again - race handler should be called again
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler).toHaveBeenCalledTimes(3);
        expect(raceHandler).toHaveBeenLastCalledWith({ id: 'test2' }, 'userLoaded');
        expect(userLoadedHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle typed race with logout event first', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for multiple events
        events.race(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger logout event first
        events.trigger('logout');

        // Verify race handler was called with logout event
        expect(raceHandler).toHaveBeenCalledWith(undefined, 'logout');
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
        expect(userLoadedHandler).toHaveBeenCalledTimes(0);

        // Trigger userLoaded event - race handler should be called again
        events.trigger('userLoaded', { id: 'test' });

        expect(raceHandler).toHaveBeenCalledTimes(2);
        expect(raceHandler).toHaveBeenLastCalledWith({ id: 'test' }, 'userLoaded');
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
      });

      it('should return unsubscribe function', () => {
        const raceHandler = jest.fn();
        const regularHandler = jest.fn();

        // Set up race handler
        events.race(['userLoaded'], raceHandler);
        events.on('userLoaded', regularHandler);

        // Get unsubscribe function from another race handler
        const unsubscribe = events.race(['userLoaded'], jest.fn());

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify handlers were called
        expect(raceHandler).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith({ id: 'test' });

        // Unsubscribe
        unsubscribe();

        // Trigger again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify race handler was called again (not unsubscribed)
        expect(raceHandler).toHaveBeenCalledTimes(2);
        expect(raceHandler).toHaveBeenLastCalledWith({ id: 'test2' }, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle multiple race handlers for same events', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();
        const regularHandler = jest.fn();

        // Set up multiple race handlers
        events.race(['userLoaded', 'logout'], raceHandler1);
        events.race(['userLoaded', 'logout'], raceHandler2);
        events.on('userLoaded', regularHandler);

        const payload = { id: 'test' };

        // Trigger the event
        events.trigger('userLoaded', payload);

        // Verify all race handlers were called
        expect(raceHandler1).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(raceHandler2).toHaveBeenCalledWith(payload, 'userLoaded');
        expect(regularHandler).toHaveBeenCalledWith(payload);

        // Trigger again - all race handlers should be called again
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler1).toHaveBeenCalledTimes(2);
        expect(raceHandler2).toHaveBeenCalledTimes(2);
        expect(regularHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle race handlers with different event combinations', () => {
        const raceHandler1 = jest.fn();
        const raceHandler2 = jest.fn();

        // Set up race handlers for different event combinations
        events.race(['userLoaded'], raceHandler1);
        events.race(['logout'], raceHandler2);

        // Trigger userLoaded event
        events.trigger('userLoaded', { id: 'test' });

        // Verify only userLoaded race handler was called
        expect(raceHandler1).toHaveBeenCalledWith({ id: 'test' }, 'userLoaded');
        expect(raceHandler2).toHaveBeenCalledTimes(0);

        // Trigger logout event
        events.trigger('logout');

        // Verify logout race handler was called
        expect(raceHandler2).toHaveBeenCalledWith(undefined, 'logout');

        // Trigger userLoaded again - race handler should be called again
        events.trigger('userLoaded', { id: 'test2' });

        expect(raceHandler1).toHaveBeenCalledTimes(2);
        expect(raceHandler1).toHaveBeenLastCalledWith({ id: 'test2' }, 'userLoaded');
      });

      it('should handle race handlers with mixed payload types', () => {
        const raceHandler = jest.fn();
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Set up race handler for events with different payload types
        events.race(['userLoaded', 'logout'], raceHandler);
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger logout event (no payload)
        events.trigger('logout');

        // Verify race handler was called with undefined payload
        expect(raceHandler).toHaveBeenCalledWith(undefined, 'logout');
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
        expect(userLoadedHandler).toHaveBeenCalledTimes(0);

        // Trigger userLoaded event (with payload) - race handler should be called again
        events.trigger('userLoaded', { id: 'test' });

        expect(raceHandler).toHaveBeenCalledTimes(2);
        expect(raceHandler).toHaveBeenLastCalledWith({ id: 'test' }, 'userLoaded');
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
      });
    });
  });

  describe('management methods', () => {
    describe('wait', () => {
      it('should handle typed wait with payload', async () => {
        const payload = { id: 'test' };

        // Start waiting for the event
        const waitPromise = events.wait('userLoaded');

        // Trigger the event with payload
        events.trigger('userLoaded', payload);

        // Wait for the promise to resolve
        const result = await waitPromise;

        // Verify the result has correct type and value
        expect(result).toEqual(payload);
        expect(result.id).toBe('test');
      });

      it('should handle typed wait without payload', async () => {
        // Start waiting for the logout event
        const waitPromise = events.wait('logout');

        // Trigger the event without payload
        events.trigger('logout');

        // Wait for the promise to resolve
        const result = await waitPromise;

        // Verify the result is undefined
        expect(result).toBeUndefined();
      });

      it('should handle multiple wait promises', async () => {
        const payload1 = { id: 'test1' };
        const payload2 = { id: 'test2' };

        // Start multiple wait promises
        const waitPromise1 = events.wait('userLoaded');
        const waitPromise2 = events.wait('userLoaded');

        // Trigger the event
        events.trigger('userLoaded', payload1);

        // Wait for both promises to resolve
        const result1 = await waitPromise1;
        const result2 = await waitPromise2;

        // Verify both promises resolved with the same payload
        expect(result1).toEqual(payload1);
        expect(result2).toEqual(payload1);

        // Start another wait promise
        const waitPromise3 = events.wait('userLoaded');

        // Trigger with different payload
        events.trigger('userLoaded', payload2);

        const result3 = await waitPromise3;

        expect(result3).toEqual(payload2);
      });

      it('should handle wait for different events', async () => {
        const userLoadedPayload = { id: 'user' };

        // Start waiting for different events
        const userLoadedPromise = events.wait('userLoaded');
        const logoutPromise = events.wait('logout');

        // Trigger userLoaded event
        events.trigger('userLoaded', userLoadedPayload);

        // Wait for userLoaded promise
        const userLoadedResult = await userLoadedPromise;

        expect(userLoadedResult).toEqual(userLoadedPayload);

        // Trigger logout event
        events.trigger('logout');

        // Wait for logout promise
        const logoutResult = await logoutPromise;

        expect(logoutResult).toBeUndefined();
      });

      it('should handle wait with timeout scenario', async () => {
        // Start waiting for an event that might not be triggered
        const waitPromise = events.wait('userLoaded');

        // Simulate some delay
        await new Promise((resolve) => {
          setTimeout(resolve, 10);
        });

        // Trigger the event
        events.trigger('userLoaded', { id: 'delayed' });

        // Wait for the promise to resolve
        const result = await waitPromise;

        expect(result).toEqual({ id: 'delayed' });
      });
    });

    describe('off', () => {
      it('should handle typed off with payload', () => {
        const handler = jest.fn();

        // Register handler
        events.on('userLoaded', handler);

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify handler was called
        expect(handler).toHaveBeenCalledWith({ id: 'test' });

        // Remove handler
        events.off('userLoaded', handler);

        // Trigger event again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify handler was not called again
        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should handle typed off without payload', () => {
        const handler = jest.fn();

        // Register handler for logout event
        events.on('logout', handler);

        // Trigger event
        events.trigger('logout');

        // Verify handler was called
        expect(handler).toHaveBeenCalledWith(undefined);

        // Remove handler
        events.off('logout', handler);

        // Trigger event again
        events.trigger('logout');

        // Verify handler was not called again
        expect(handler).toHaveBeenCalledTimes(1);
      });

      it('should handle off for multiple handlers', () => {
        const handler1 = jest.fn();
        const handler2 = jest.fn();
        const handler3 = jest.fn();

        // Register multiple handlers
        events.on('userLoaded', handler1);
        events.on('userLoaded', handler2);
        events.on('userLoaded', handler3);

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify all handlers were called
        expect(handler1).toHaveBeenCalledWith({ id: 'test' });
        expect(handler2).toHaveBeenCalledWith({ id: 'test' });
        expect(handler3).toHaveBeenCalledWith({ id: 'test' });

        // Remove one handler
        events.off('userLoaded', handler2);

        // Trigger event again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify only remaining handlers were called
        expect(handler1).toHaveBeenCalledTimes(2);
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler3).toHaveBeenCalledTimes(2);
      });

      it('should handle off for different events', () => {
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        // Register handlers for different events
        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Trigger both events
        events.trigger('userLoaded', { id: 'test' });
        events.trigger('logout');

        // Verify both handlers were called
        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
        expect(logoutHandler).toHaveBeenCalledWith(undefined);

        // Remove one handler
        events.off('userLoaded', userLoadedHandler);

        // Trigger both events again
        events.trigger('userLoaded', { id: 'test2' });
        events.trigger('logout');

        // Verify only logout handler was called
        expect(userLoadedHandler).toHaveBeenCalledTimes(1);
        expect(logoutHandler).toHaveBeenCalledTimes(2);
      });

      it('should handle off for non-existent handler', () => {
        const handler = jest.fn();
        const nonExistentHandler = jest.fn();

        // Register handler
        events.on('userLoaded', handler);

        // Try to remove non-existent handler
        events.off('userLoaded', nonExistentHandler);

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify original handler was still called
        expect(handler).toHaveBeenCalledWith({ id: 'test' });
        expect(nonExistentHandler).toHaveBeenCalledTimes(0);
      });

      it('should handle off after unsubscribe', () => {
        const handler = jest.fn();

        // Register handler and get unsubscribe function
        const unsubscribe = events.on('userLoaded', handler);

        // Trigger event
        events.trigger('userLoaded', { id: 'test' });

        // Verify handler was called
        expect(handler).toHaveBeenCalledWith({ id: 'test' });

        // Unsubscribe
        unsubscribe();

        // Try to remove handler manually
        events.off('userLoaded', handler);

        // Trigger event again
        events.trigger('userLoaded', { id: 'test2' });

        // Verify handler was not called again
        expect(handler).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('utility methods', () => {
    describe('eachTriggersTyped', () => {
      it('should iterate through all triggers', () => {
        const handler = jest.fn();

        // Use eachTriggersTyped to iterate through triggers
        events.eachTriggersTyped((trigger, eventName) => {
          handler(trigger, eventName);
        });

        // Verify handler was called for each event
        expect(handler).toHaveBeenCalledTimes(2);
      });

      it('should provide correct trigger types for each event', () => {
        const triggers: { trigger: unknown; eventName: string }[] = [];

        events.eachTriggersTyped((trigger, eventName) => {
          triggers.push({ trigger, eventName });
        });

        expect(triggers).toHaveLength(2);
        expect(
          triggers.map((t) => {
            return t.eventName;
          }),
        ).toEqual(['userLoaded', 'logout']);

        // Test that triggers are functions
        for (const { trigger } of triggers) {
          expect(typeof trigger).toBe('function');
        }
      });

      it('should work with empty event handlers', () => {
        const handler = jest.fn();

        // Should not throw even without any event handlers
        expect(() => {
          events.eachTriggersTyped(handler);
        }).not.toThrow();

        expect(handler).toHaveBeenCalledTimes(2);
      });

      it('should maintain trigger functionality after iteration', () => {
        const userLoadedHandler = jest.fn();
        const logoutHandler = jest.fn();

        events.on('userLoaded', userLoadedHandler);
        events.on('logout', logoutHandler);

        // Iterate through triggers
        events.eachTriggersTyped(() => {
          // Just iterate, don't call triggers
        });

        // Verify triggers still work after iteration
        events.trigger('userLoaded', { id: 'test' });
        events.trigger('logout');

        expect(userLoadedHandler).toHaveBeenCalledWith({ id: 'test' });
        expect(logoutHandler).toHaveBeenCalledWith(undefined);
      });
    });
  });
});
