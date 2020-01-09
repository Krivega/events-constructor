/**
 * Handle Error not supported
 *
 * @param {string} eventName - eventName
 *
 * @return {void}
 */
const errorNotSupported = eventName => new Error(`Event ${eventName} not supported`);

/**
 * Events
 *
 * @param {string} eventName - hack for fix validate jsdoc
 *
 * @returns {@class} Events - hack for fix validate jsdoc
 */
class Events {
  _active = true;

  _eventHandlers = {};

  _triggers = {};

  /**
   * @constructor
   *
   * @param {Object}   events        - The events
   * @param {Object}   options       - The options
   * @param {function} options.debug - The debug function
   */
  constructor(events, { debug } = {}) {
    this._events = events;
    this._debug = debug;

    this._initEventHandlers(this._events);
  }

  /**
   * on
   *
   * @param {string}   eventName - eventName
   * @param {function} handler   - handler
   *
   * @returns {void}
   */
  on(eventName, handler) {
    const handlers = this._eventHandlers[eventName];

    if (handlers) {
      handlers.push(handler);
    } else {
      throw errorNotSupported(eventName);
    }
  }

  /**
   * once
   *
   * @param {string}   eventName - eventName
   * @param {function} handler   - handler
   *
   * @returns {void}
   */
  once(eventName, handler) {
    /**
     * onceHandler
     *
     * @param {Object} args - args
     *
     * @returns {void}
     */
    const onceHandler = (...args) => {
      handler(...args);
      this.off(eventName, onceHandler);
    };

    this.on(eventName, onceHandler);
  }

  /**
   * off
   *
   * @param {string}   eventName - eventName
   * @param {function} handler   - handler
   *
   * @returns {void}
   */
  off(eventName, handler) {
    const handlers = this._eventHandlers[eventName];

    this._eventHandlers[eventName] = handlers.filter(item => item !== handler);
  }

  /**
   * trigger
   *
   * @param {string} eventName - eventName
   * @param {Object} data      - data
   *
   * @returns {void}
   */
  trigger(eventName, data) {
    const trigger = this._triggers[eventName];

    if (trigger) {
      trigger(data);
    } else {
      throw errorNotSupported(eventName);
    }
  }

  /**
   * triggers
   *
   * @returns {Object} triggers
   */
  get triggers() {
    return this._triggers;
  }

  /**
   * eachTriggers
   *
   * @param {function} handler - handler
   *
   * @returns {void}
   */
  eachTriggers(handler) {
    Object.entries(this._triggers).forEach(([eventName, trigger]) => {
      handler(trigger, eventName);
    });
  }

  /**
   * Removes event handlers.
   *
   * @returns {void}
   */
  removeEventHandlers() {
    this._initEventHandlers(this._events);
  }

  /**
   * _initEventHandlers
   *
   * @param {Object} eventsNames - eventsNames
   *
   * @returns {void}
   */
  _initEventHandlers(eventsNames) {
    eventsNames.forEach(eventName => {
      this._eventHandlers[eventName] = [];
      this._triggers[eventName] = this._resolveHandleEvent(eventName);
    });
  }

  /**
   * activate
   *
   * @returns {undefined}
   */
  activate() {
    this._active = true;
  }

  /**
   * deactivate
   *
   * @returns {undefined}
   */
  deactivate() {
    this._active = false;
  }

  _resolveHandleEvent = eventName => (...args) => {
    if (!this._active) {
      return undefined;
    }

    const eventHandlers = this._eventHandlers[eventName];

    eventHandlers.forEach(eventHandler => {
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
