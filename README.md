# events-constructor

[![npm](https://img.shields.io/npm/v/events-constructor?style=flat-square)](https://www.npmjs.com/package/events-constructor)
![npm bundle size](https://img.shields.io/bundlephobia/minzip/events-constructor?style=flat-square)

Class for emitting events with strong TypeScript support

## Install

npm

```sh
npm install events-constructor
```

yarn

```sh
yarn add events-constructor
```

## Usage

### Basic Events

```js
import Events from 'events-constructor';

const eventNames = ['event1', 'event2'];
const events = new Events(eventNames);

events.on('event1', (data) => {
  console.log('event1 is called with data:', data);
});

events.trigger('event1', 'some data');
```

### Typed Events (TypeScript)

```ts
import { TypedEvents } from 'events-constructor';

type EventMap = {
  userLoaded: { id: string; name: string };
  logout: never;
};

const eventNames = ['userLoaded', 'logout'] as const;
const events = new TypedEvents<EventMap>(eventNames);

// TypeScript will enforce correct payload types
events.on('userLoaded', (user) => {
  console.log('User loaded:', user.id, user.name);
});

// ✅ Correct - TypeScript knows the payload type
events.trigger('userLoaded', { id: '1', name: 'John' });

// ❌ TypeScript error - wrong payload type
events.trigger('userLoaded', { wrong: true });

// ✅ Correct - logout event has no payload
events.trigger('logout');

// ❌ TypeScript error - logout doesn't accept payload
events.trigger('logout', { data: 'wrong' });
```

### Race Conditions

Handle multiple events with race conditions:

```js
// onceRace - triggers only once, then automatically unsubscribes
events.onceRace(['userLogin', 'userError'], (data, eventName) => {
  console.log(`First event: ${eventName}`, data);
});

// race - triggers every time any of the events occur, stays active
const unsubscribe = events.race(['userLogin', 'userError'], (data, eventName) => {
  console.log(`Event occurred: ${eventName}`, data);
});

// Manually unsubscribe when no longer needed
unsubscribe();
```

## API

### Events (Base Class)

#### events.on

Add listener to event

```js
events.on('event1', (data) => {
  console.log('event1 is called with data:', data);
});
```

#### events.once

Add a listener that will be called only once per event

```js
events.once('event1', (data) => {
  console.log('event1 is called with data:', data);
});
```

#### events.off

Remove listener from event

```js
events.off('event1', handler);
```

#### events.trigger

Trigger event with data

```js
events.trigger('event1', 'some data');
```

#### events.emit

Alias for trigger (Node.js EventEmitter compatibility)

```js
events.emit('event1', 'some data');
```

#### events.wait

Wait for an event to be triggered (returns Promise)

```js
const data = await events.wait('event1');
console.log('Event triggered with:', data);
```

#### events.onceRace

Listen for the first occurrence of any event from a list (automatically unsubscribes after first trigger)

```js
events.onceRace(['event1', 'event2'], (data, eventName) => {
  console.log(`${eventName} was triggered first with:`, data);
});
```

#### events.race

Listen for any occurrence of events from a list (stays active until manually unsubscribed)

```js
const unsubscribe = events.race(['event1', 'event2'], (data, eventName) => {
  console.log(`${eventName} was triggered with:`, data);
});

// Unsubscribe when no longer needed
unsubscribe();
```

#### events.removeEventHandlers

Remove all listeners

```js
events.removeEventHandlers();
```

#### events.offAll

Remove all listeners for specific event or all events

```js
// Remove all listeners for specific event
events.offAll('event1');

// Remove all listeners for all events
events.offAll();
```

#### events.triggers

Get all triggers

```js
events.triggers;
```

#### events.eachTriggers

Iterate through all triggers

```js
events.eachTriggers((trigger, eventName) => {
  console.log(`Trigger for ${eventName}:`, trigger);
});
```

#### events.deactivate()

Disable event handlers. The trigger method will not produce any effect.

```js
events.on('event1', (data) => {
  console.log('event1 is called with data:', data); //it's not called
});

events.deactivate();
events.trigger('event1', 'some data');
```

#### events.activate()

Enable event handlers.

```js
events.on('event1', (data) => {
  console.log('event1 is called with data:', data);
});

events.deactivate();
events.trigger('event1', 'some data'); // no effect

events.activate();
events.trigger('event1', 'some data'); // handler is called
```

#### events.hasHandlers

Check if event has any handlers

```js
if (events.hasHandlers('event1')) {
  console.log('Event has handlers');
}
```

#### events.destroy()

Destroy the events instance and clean up all handlers

```js
events.destroy();
// All handlers are removed and triggers are undefined
```

### TypedEvents (TypeScript)

TypedEvents extends the base Events class with strong TypeScript support:

#### Type Safety

```ts
type EventMap = {
  userLoaded: { id: string };
  logout: never;
  dataUpdated: { value: number };
};

const events = new TypedEvents<EventMap>(['userLoaded', 'logout', 'dataUpdated']);

// TypeScript enforces correct payload types
events.trigger('userLoaded', { id: '123' }); // ✅
events.trigger('logout'); // ✅ (no payload for 'never' type)
events.trigger('dataUpdated', { value: 42 }); // ✅

// TypeScript errors for incorrect usage
events.trigger('userLoaded', { wrong: true }); // ❌
events.trigger('logout', { data: 'wrong' }); // ❌
```

#### eachTriggersTyped

Strongly typed version of eachTriggers

```ts
events.eachTriggersTyped((trigger, eventName) => {
  // trigger is properly typed based on the event
  if (eventName === 'userLoaded') {
    trigger({ id: 'test' }); // TypeScript knows this is correct
  }
});
```

#### race (TypedEvents)

Strongly typed version of race with payload type safety

```ts
type EventMap = {
  userLoaded: { id: string; name: string };
  userError: { error: string };
  logout: never;
};

const events = new TypedEvents<EventMap>(['userLoaded', 'userError', 'logout']);

const unsubscribe = events.race(['userLoaded', 'userError'], (data, eventName) => {
  // TypeScript knows the exact payload type for each event
  if (eventName === 'userLoaded') {
    console.log('User loaded:', data.id, data.name); // data is { id: string; name: string }
  } else if (eventName === 'userError') {
    console.log('Error:', data.error); // data is { error: string }
  }
});

// Unsubscribe when no longer needed
unsubscribe();
```

## Features

- **Type Safety**: Full TypeScript support with compile-time type checking
- **Event Validation**: Ensures only predefined events can be used
- **Memory Management**: Automatic cleanup of one-time listeners
- **Error Handling**: Built-in error handling with debug support
- **Promise Support**: Async/await support with `wait()` method
- **Race Conditions**: Handle multiple events with `onceRace()` and `race()`
- **Lifecycle Management**: Activate/deactivate events as needed
- **Performance**: Efficient event handling with Set-based listeners

## Maintainer

👤 **Krivega Dmitriy**

- Website: <https://krivega.com>
- Github: [@Krivega](https://github.com/Krivega)

## Contributing

Contributions, issues and feature requests are welcome!  
Feel free to check [issues page](https://github.com/Krivega/events-constructor/issues). You can also take a look at the [contributing guide](https://github.com/Krivega/events-constructor/blob/master/CONTRIBUTING.md).

## 📝 License

Copyright © 2025 [Krivega Dmitriy](https://github.com/Krivega).  
This project is [MIT](https://github.com/Krivega/events-constructor/blob/master/LICENSE) licensed.
