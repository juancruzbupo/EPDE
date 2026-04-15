# Architecture Decision Records

Decisiones arquitectónicas clave del proyecto EPDE. Cada ADR documenta una decisión no obvia que afecta la estructura del sistema.

| ADR                                              | Decisión                                                                   | Estado   |
| ------------------------------------------------ | -------------------------------------------------------------------------- | -------- |
| [001](001-monorepo-shared-package.md)            | Monorepo con @epde/shared como SSoT                                        | Aceptada |
| [002](002-soft-delete-base-repository.md)        | Soft-delete via BaseRepository + Prisma extension                          | Aceptada |
| [003](003-cyclic-task-model.md)                  | Tareas cíclicas — COMPLETED es transitorio                                 | Aceptada |
| [004](004-isv-health-index.md)                   | ISV: cálculo de 5 dimensiones con batch para listas                        | Aceptada |
| [005](005-notification-orchestration.md)         | NotificationsHandlerService como punto único de side-effects               | Aceptada |
| [006](006-notification-handler-vs-events.md)     | NotificationsHandlerService vs Event-Driven                                | Aceptada |
| [007](007-plan-data-module-circular-dep.md)      | PlanDataModule para romper dependencia circular TasksModule                | Aceptada |
| [008](008-bullmq-notification-queue.md)          | BullMQ sobre Redis para colas de notificaciones y emails                   | Aceptada |
| [009](009-soft-delete-scope.md)                  | Alcance del soft-delete: 8 modelos + nested include caveat                 | Aceptada |
| [010](010-referral-program.md)                   | Programa de recomendación — MVP con conversión manual + reward acumulativo | Aceptada |
| [011](011-base-repository-scope.md)              | Scope de BaseRepository — 3 criterios para extender, 4 para no             | Aceptada |
| [012](012-architectural-remediation-closeout.md) | Closeout del plan de remediación arquitectónica (ARCH-1 a ARCH-8)          | Aceptada |
| [013](013-module-import-policy.md)               | Política de imports entre módulos + acyclicity test                        | Aceptada |
| [014](014-dark-mode-adoption.md)                 | Dark mode: status, convención, acceptance criteria                         | Aceptada |
| [015](015-mobile-admin-readiness.md)             | Mobile admin: trigger + checklist preventivo                               | Aceptada |
| [016](016-loading-state-divergence.md)           | Loading: web Skeleton vs mobile ActivityIndicator (divergence by design)   | Aceptada |
| [017](017-security-fail-mode-policy.md)          | Security fail-mode policy: cuándo fail-open vs fail-closed                 | Aceptada |
