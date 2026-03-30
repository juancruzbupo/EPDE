# ADR 006: NotificationsHandlerService vs Event-Driven Architecture

## Status

Accepted (current implementation retained)

## Context

`NotificationsHandlerService` is injected in 8 domain services as the centralized
notification dispatch point. An event-driven alternative (`@nestjs/event-emitter` /
`EventEmitter2` or a custom RxJS-based event bus) was evaluated to further decouple
domain logic from notification side-effects.

## Decision

Retain the direct handler injection pattern. Reasons:

1. **Type safety** — Method calls provide compile-time safety; string-keyed events
   lose type checking and require casting (`event.payload as any`).
2. **Traceability** — IDE "Find Usages" works on methods; string events require grep
   and are invisible to the TypeScript compiler.
3. **Scale fit** — 8 consumers is manageable; event buses add value at 20+ consumers
   or when fan-out (multiple subscribers per event) is needed.
4. **Testing** — Mock injection (`jest.fn()` on a provider) is simpler and more
   explicit than event subscription testing.
5. **1:1 mapping** — Each domain action has exactly one notification handler method.
   There is no fan-out benefit from pub/sub today.

## Alternatives considered

| Approach                                | Pros                                     | Cons                                                             |
| --------------------------------------- | ---------------------------------------- | ---------------------------------------------------------------- |
| `@nestjs/event-emitter` (EventEmitter2) | NestJS-native, decorator-based listeners | New dependency, string events, no compile-time safety            |
| Custom RxJS `Subject` event bus         | Zero dependencies, lightweight           | Same type-safety loss, subscription lifecycle management         |
| Current handler injection               | Type-safe, traceable, simple testing     | Domain services import notification module (acceptable coupling) |

## When to reconsider

- Multiple modules need to react to the same domain event (fan-out)
- A plugin or extension architecture is introduced
- Event sourcing or CQRS patterns are adopted
- The number of notification consumers exceeds ~20 services
