# Model Manager V1

Approved direction: extend Model Filter as a separate plugin for the normal BB app. No core patch or BB fork. Fallback is deferred. The user accepted documenting menu-only filtering as a known limitation.

## Accepted scope

- Provider-wide selected model IDs shared across clients, with independent native catalogs per machine/workspace.
- Favorites, ordering within favorite/non-favorite groups, and a preferred model with supported reasoning.
- Explicit Use preferred model action in new-thread composers. No automatic selection, submission, permission change or workspace change.
- Existing current models remain available; filtered selections do not become access restrictions.
- Public settings/RPC/SQLite/CLI/composer APIs, with one isolated private native-picker adapter.
- Provider-bound edit drafts, atomic revisions, unavailable-ID retention, and reconnect synchronization.
- Known limitations visible in settings, README and skill documentation.

## Acceptance

1. Legacy preference snapshots still load without migration or data loss.
2. Five-part and six-part selected-model query keys receive the same projection; raw query caches remain unchanged.
3. Saving favorites/order does not change enabled IDs or native model/option metadata.
4. Preferred models must be enabled, known or previously retained; newly invented IDs and unsupported reasoning are rejected before persistence.
5. Hiding a preferred model clears that preference in the editing draft; hiding a favorite does not re-enable it.
6. Stale saves, failed discovery and failed writes preserve drafts and persisted state.
7. Applying a preferred selection requires an explicit click and reports host rejection/reconciliation accurately.
8. Native current-model exceptions, disabled-plugin restoration, routing context, and simultaneous pickers remain independent.
9. UI/CLI edits use the same server validation, transactions and realtime signal.
10. Desktop/narrow browser checks exercise the actual plugin settings, lifecycle overlay and TanStack adapter against labeled fixtures.

## Deferred and known limitations

Universal execution restrictions, automatic fixed defaults, custom-model registration UI and fallback need additional BB support or separate product decisions. Do not present them as implemented. Custom IDs registered through native BB configuration can be selected after discovery. No changes to standalone provider CLIs or billing are made.

## Verification

Use the exact npm commands in README.md and the browser procedure in e2e/README.md. Use real SQLite tests for persistence and real TanStack observers for the compatibility adapter. Live BB installation is not inferred from a passing isolated harness.
