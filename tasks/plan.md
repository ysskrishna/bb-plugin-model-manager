# Model Manager implementation

Approved direction: extend Model Filter as a separate plugin for the normal BB application. No BB fork or core patch. Fallback is deferred. The user accepted documenting the application-level limitations.

## Scope

Retain the upstream transactional SQLite store, revision checks, routed catalog validation, and native-picker adapter. Fix compatibility with BB 0.50.1, add provider favorites/order and preferred model/reasoning, and expose an explicit composer action to apply that preference. Preserve current thread selections and existing native controls.

The preferred selection is an explicit action, not an automatic system-wide default. Custom-model registration continues through BB's own configuration. CLI/API model access is not restricted by picker preferences. These limits must appear in settings, README, and the plugin skill.

## Implementation sequence

1. Reproduce and fix selected-model discovery filtering. Verify with a real TanStack Query observer, the full upstream suite, types and build.
2. Add backward-compatible optional preference fields, strict server validation, persistence and CLI support. Verify pure logic and real SQLite integration tests.
3. Add accessible favorite/reorder/preferred-selection controls and a composer action through the public SDK. Verify component flows and preservation of drafts, current models, disabled filtering and errors.
4. Establish separate Model Manager identity, preserve upstream licensing/provenance, document the compatibility boundary and add a repeatable isolated browser harness.
5. Run checks, review the diff, commit on the task branch, and publish a draft PR for review. Installation into the user's active BB is a separate step after the result is reviewable.

## Verification

- `npm test`: original regression suite plus new policy, server and UI cases.
- `npm run typecheck`: exact installed SDK compatibility.
- `npm run check:sdk`: public imports; this does not certify the private adapter.
- `npm run format:check` and `npm run build`.
- Isolated browser checks: desktop/narrow, light/dark, save/conflict, favorites/order, preferred selection, raw catalog preservation and adapter restoration. No paid inference or live subscription changes.

## Known risks

The native picker integration remains a version-scoped private adapter. Report failures clearly and restore native menus if discovery fails. Do not claim unsupported BB versions are verified. Do not use a blanket dependency upgrade to repair unrelated development-package audit findings; production dependencies have no reported audit findings at baseline.
