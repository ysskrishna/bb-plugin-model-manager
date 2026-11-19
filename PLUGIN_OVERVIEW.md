## Curate each provider's model menu

Choose visible models, star favorites, reorder them, and save a preferred model and reasoning level. Devices connected to one BB server share preferences with revision checks for concurrent edits. Native model metadata and each picker's current selection are preserved.

Use the preferred model button in the new-thread composer to apply the current provider's saved choice without sending a message. Configure additional model IDs through BB itself, then manage their visibility here.

## Requirements and limits

Targets BB 0.50.1 and Plugin SDK 0.6.157. Based on the MIT-licensed Model Filter plugin. No separate account, credential, service, or inference call is added.

Filtering affects native model menus. It does not restrict explicit CLI/API, automation, task, or workflow execution. Preferred selections are explicit actions, not automatic system-wide defaults. There is no fallback routing.

Native filtering uses a version-specific private React/TanStack adapter. An incompatible client keeps its native menus and reports inactive filtering. Disable other model-filtering adapters before use. Live installation remains a separate acceptance step after the isolated verification harness.
