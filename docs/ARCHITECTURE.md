# Architecture

Model Manager extends Model Filter at c651107. LICENSE retains the upstream MIT notice. The private adapter is reused deliberately for the approved plugin-only scope; this is not described as a supported BB extension point.

| Module                                       | Responsibility                                                                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| preferences.ts                               | Strict bounded snapshots; optional favorites/order/preferred fields; pure stable catalog ordering and current-model facade      |
| preferences-store.ts                         | Existing SQLite document storage and transactional compare-and-swap revisions; unchanged table/version for legacy compatibility |
| contract.ts                                  | Strict RPC inputs and realtime channel                                                                                          |
| server.ts                                    | Raw routed catalog validation, supported reasoning validation, committed writes and shared CLI behavior                         |
| query-bridge.ts                              | Sole private React/TanStack boundary; five/six-field query keys, composed observer selectors, unchanged raw cache, disposal     |
| preferences-client.ts                        | Client snapshot/revision and runtime/synchronization status                                                                     |
| settings-state.ts                            | Provider-bound drafts, catalog routing, saving, conflicts and reset                                                             |
| ModelCatalogEditor.tsx, ModelPreferences.tsx | Checklist, favorites, ordering, preferred selections and unavailable-ID controls                                                |
| ModelFilterSettings.tsx                      | Settings surface, source routing, native preview and known limitations                                                          |
| PreferredModelAction.tsx                     | Explicit public composer setSelection action; never submits or changes permissions/workspace                                    |
| app.tsx                                      | Overlay lifecycle, realtime/reconnect reads, settings and new-thread composer registration                                      |
| e2e/                                         | Isolated browser fixture; no live BB account calls                                                                              |

The persisted snapshot remains `{revision, providers}`. Existing rules without new optional fields retain their meaning. All writes finish with one SQLite revision check after asynchronous raw-catalog validation. Favorites/order are presentation preferences. Preferred selection is an explicit action and does not set BB's isDefault metadata.

The observer projection preserves hidden model metadata for native current lookup while excluding hidden candidates from menu iteration paths. The private boundary remains version-scoped. Neither the SDK import scanner nor mocked host tests prove future BB compatibility.
