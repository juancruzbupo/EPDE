# Architecture Decision Records

Decisiones arquitectónicas clave del proyecto EPDE. Cada ADR documenta una decisión no obvia que afecta la estructura del sistema.

| ADR                                       | Decisión                                                     | Estado   |
| ----------------------------------------- | ------------------------------------------------------------ | -------- |
| [001](001-monorepo-shared-package.md)     | Monorepo con @epde/shared como SSoT                          | Aceptada |
| [002](002-soft-delete-base-repository.md) | Soft-delete via BaseRepository + Prisma extension            | Aceptada |
| [003](003-cyclic-task-model.md)           | Tareas cíclicas — COMPLETED es transitorio                   | Aceptada |
| [004](004-isv-health-index.md)            | ISV: cálculo de 5 dimensiones con batch para listas          | Aceptada |
| [005](005-notification-orchestration.md)  | NotificationsHandlerService como punto único de side-effects | Aceptada |
