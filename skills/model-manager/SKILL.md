---
name: model-manager
description: Manage BB provider model menus, favorites, order and explicit preferred selections with Model Manager.
---

# Model Manager

Read `bb model-manager status --json` before changing preferences. Use exact provider/model IDs from the native raw catalog, not display labels. Writes affect every client connected to this BB server.

- `bb model-manager select <provider> <model>...` saves visible IDs; at least one must currently be available.
- `bb model-manager favorite <provider> <model>` and `unfavorite` edit favorites.
- `bb model-manager order <provider> <model>...` saves order within favorite/ordinary groups.
- `bb model-manager prefer <provider> <model> [reasoning]` saves an enabled model and supported reasoning. `clear-preferred <provider>` removes it.
- `bb model-manager all <provider>` restores native catalog visibility while retaining preferences.
- `bb model-manager reset <provider>` removes that rule. Reset without a provider removes all rules and requires an explicit user request covering all providers.

All commands accept --json. Read back after writes. On a revision conflict, re-read before retrying the user's intended change.

Known limitations: menu filtering does not restrict CLI/API/automation execution. Current hidden models remain usable. Preferred selections require the Use preferred model button in a new-thread composer; there is no automatic default or fallback. Custom model registration remains BB configuration. The native picker adapter is version-specific. Do not combine with another filtering adapter.
