# Compatibility and known issues

Target: BB 0.50.1, Plugin SDK 0.6.157. The manifest bounds BB support to 0.50.x. This range is a compatibility guard, not evidence every patch/platform has been tested.

## Audit findings

- Upstream manifest refused BB 0.48 and later.
- Its adapter matched only five-part systemExecutionOptions query keys. BB's selected-model discovery adds a sixth field. A real TanStack observer regression reproduced unfiltered results, and the fix covers both known forms.
- The SDK was pinned to 0.6.79 in development dependencies even though contract.ts imports a runtime SDK helper. It now matches the installed host and is in dependencies as BB's type-sync tool requires.
- Runtime-shimmed tailwind-merge types and the bb-app development/build dependency now match the target environment.
- The original 47 tests passed after rebuilding the native SQLite test dependency. New tests add preference validation, server/CLI persistence, composer behavior and six-part queries.

## Accepted limitations

Menu-only filtering can be bypassed by explicit CLI/API and other plugin requests. Existing current model selections remain usable. Preferred selections require clicking the composer action; fixed automatic defaults are not supplied. Custom model registration remains native BB configuration. Fallback routing is out of scope.

Private React/query-client discovery and the selectedOnlyModels array facade can break after BB changes. Discovery failure restores native choices; runtime status reports unsupported. Do not stack Model Manager with other model-filtering adapters.

## Verification boundaries

The V1 review passed `npm run check`: formatting, application and fixture types, SDK checks, 62 tests and the plugin build. A deliberate adapter-condition mutation failed the selected-model query regression test, then the restored code passed. The browser fixture verified favorites/order/filtering in both pickers, explicit preferred model/reasoning selection with the draft preserved, unload restoration and narrow light/dark rendering. A CLI regression also covers retaining project routing when returning to all models.

The inherited Vitest 3 worker dependency had critical audit findings. The test runner was upgraded to Vitest 5.1.1 after checking its migration requirements; the existing suite passed before and after the upgrade. Production dependencies report no audit findings. Moderate findings remain in the development-only BB build-tool dependency chain; applying npm's suggested BB downgrade would conflict with the target version and was not done.

The isolated browser fixture uses the real plugin app/settings/composer action and real TanStack QueryClient/QueryObserver, with an emulated BB SDK and labeled catalogs. It verifies browser rendering, lifecycle wiring and observer behavior without vendor requests. Server tests use a real migrated temporary SQLite database.

Local installation acceptance on BB 0.50.1 also verified the real server-backed settings page, persistence after reload, both native picker surfaces, preservation of a hidden current selection, and restoration of the full catalog when filtering or the plugin is disabled. Re-enabling restores saved preferences. Explicit preferred selection preserves a populated draft without creating a thread. Temporary model preferences were cleared after testing.

That acceptance caught a missing button type inside BB's composer form. The action now explicitly uses `type="button"`; a new form regression test fails before the fix and passes after it. The suite now has 63 passing tests. Settings tests also await initial React effects before input; 25 consecutive focused runs passed after this correction.

The local browser used the actual BB frontend and server, not the emulated fixture. Physical mobile devices, Electron shell-specific behavior, keyboard cycling, a full BB application restart, and broader BB versions remain unverified. Do not widen support based on this one installation.
