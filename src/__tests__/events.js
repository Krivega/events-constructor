import Events from '../index';

const initEventNames = ['event1', 'event2'];
const eventNames = ['event3', 'event4'];
const [, eventName] = initEventNames;

let debug;

let events;

let mockFn;

let arg;

describe('events', () => {
  beforeEach(() => {
    debug = jest.fn();
    events = new Events(initEventNames, { debug });
    mockFn = jest.fn();
    arg = {};
  });

  it('on', () => {
    events.on(eventName, mockFn);
    expect(events._eventHandlers[eventName][0]).toBe(mockFn);
    expect(events).toMatchSnapshot();
  });

  it('once', () => {
    const mockTriggerOnceFn = jest.fn();
    const mockTriggerOnceFn2 = jest.fn();

    events.once(eventName, mockTriggerOnceFn);
    events.once(eventName, mockTriggerOnceFn2);
    events.on(eventName, mockFn);

    expect(events._eventHandlers[eventName].length).toBe(3);

    events.trigger(eventName, arg);

    expect(events._eventHandlers[eventName].length).toBe(1);
    expect(mockTriggerOnceFn).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFn2).toHaveBeenCalledTimes(1);

    events.trigger(eventName, arg);

    expect(mockTriggerOnceFn).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFn2).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(events._eventHandlers[eventName].length).toBe(1);
    expect(events._eventHandlers[eventName][0]).toBe(mockFn);
    expect(events).toMatchSnapshot();
  });

  it('handle errors', () => {
    const mockTriggerOnceFn = jest.fn(() => {
      throw new Error('Error');
    });
    const mockTriggerOnceFn2 = jest.fn();

    events.once(eventName, mockTriggerOnceFn);
    events.once(eventName, mockTriggerOnceFn2);
    events.on(eventName, mockFn);

    expect(events._eventHandlers[eventName].length).toBe(3);

    events.trigger(eventName, arg);

    expect(events._eventHandlers[eventName].length).toBe(2);
    expect(debug).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFn).toHaveBeenCalledTimes(1);
    expect(mockTriggerOnceFn2).toHaveBeenCalledTimes(1);

    events.trigger(eventName, arg);

    expect(mockTriggerOnceFn).toHaveBeenCalledTimes(2);
    expect(mockTriggerOnceFn2).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(events._eventHandlers[eventName].length).toBe(2);
    expect(events._eventHandlers[eventName][1]).toBe(mockFn);
    expect(events).toMatchSnapshot();
  });

  it('off', () => {
    events.on(eventName, mockFn);
    events.off(eventName, mockFn);
    expect(events._eventHandlers[eventName].length).toBe(0);
    expect(events).toMatchSnapshot();
  });

  it('removeEventHandlers', () => {
    events.on(eventName, mockFn);
    events.removeEventHandlers();
    expect(events._eventHandlers[eventName].length).toBe(0);
    expect(events).toMatchSnapshot();
  });

  it('trigger', () => {
    events.on(eventName, mockFn);
    events.trigger(eventName, arg);
    events.trigger(eventName, arg);

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toBeCalledWith(arg);
    expect(events).toMatchSnapshot();
  });

  it('get triggers', () => {
    expect(events.triggers).toHaveProperty(initEventNames[0]);
    expect(events._triggers).toHaveProperty(initEventNames[1]);
    expect(events).toMatchSnapshot();
  });

  it('eachTriggers', () => {
    events.eachTriggers(mockFn);

    expect(mockFn).toHaveBeenCalledTimes(initEventNames.length);
    expect(mockFn.mock.calls[0][0]).toEqual(expect.any(Function));
    expect(mockFn.mock.calls[0][1]).toBe(initEventNames[0]);
    expect(mockFn.mock.calls[1][0]).toEqual(expect.any(Function));
    expect(mockFn.mock.calls[1][1]).toBe(initEventNames[1]);
    expect(events).toMatchSnapshot();
  });

  it('_initEventHandlers', () => {
    events._initEventHandlers(eventNames);
    expect(events._triggers).toHaveProperty(eventNames[0]);
    expect(events._triggers).toHaveProperty(eventNames[1]);
    expect(events).toMatchSnapshot();
  });

  it('_resolveHandleEvent', () => {
    events.on(eventName, mockFn);
    events._resolveHandleEvent(eventName)(arg);

    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toBeCalledWith(arg);
    expect(events).toMatchSnapshot();
  });

  it('error with debug', () => {
    events.on(eventName, () => {
      throw new Error('test');
    });
    events.trigger(eventName, arg);

    expect(debug).toHaveBeenCalledTimes(1);
  });

  it('error without debug', () => {
    events = new Events(initEventNames);

    const error = new Error('test');

    expect(() => {
      events.on(eventName, () => {
        throw error;
      });
      events.trigger(eventName, arg);
    }).toThrow(error);
  });

  it('on not supported error', () => {
    const eventNameNotSupported = 'eventName not supported';

    expect(() => {
      events.on(eventNameNotSupported, mockFn);
    }).toThrow(new Error(`Event ${eventNameNotSupported} not supported`));
  });

  it('trigger not supported error', () => {
    const eventNameNotSupported = 'eventName not supported';

    expect(() => {
      events.trigger(eventNameNotSupported, mockFn);
    }).toThrow(new Error(`Event ${eventNameNotSupported} not supported`));
  });

  it('activate/deactivate', () => {
    events.on(eventName, mockFn);
    events.trigger(eventName, arg);
    events.trigger(eventName, arg);

    expect(mockFn).toHaveBeenCalledTimes(2);
    expect(mockFn).toBeCalledWith(arg);

    events.deactivate();
    events.trigger(eventName, arg);
    events.trigger(eventName, arg);

    expect(mockFn).toHaveBeenCalledTimes(2);

    events.activate();
    events.trigger(eventName, arg);
    events.trigger(eventName, arg);

    expect(mockFn).toHaveBeenCalledTimes(4);

    expect(events).toMatchSnapshot();
  });
});
