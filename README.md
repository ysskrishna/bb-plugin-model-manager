# Model Manager

Curate the models shown in BB's native menus, separately for each provider. Save favorites, choose their order, and keep a preferred model and reasoning level one click away in the new-thread composer. Preferences are shared by devices connected to the same BB server.

Based on [Model Filter](https://github.com/werserk/bb-plugin-model-filter) at `c651107`, retaining its MIT license and transactional preference store. This is a separate plugin; it does not modify BB itself.

## Use

Open Settings -> Plugins -> Model Manager. Choose a provider, edit its models, and Apply. Select all and Deselect all act on the entire catalog, including search results. At least one currently available model is required; disable the entire provider through BB's own provider settings when needed.

- Configured providers show only selected model IDs. Newly discovered IDs stay hidden until selected. Reset provider restores its full native list, including future models.
- Star a model to put it before other models. Arrow buttons reorder within the favorite or ordinary group. IDs and native capability metadata remain intact.
- Choose a preferred model and optional reasoning level. Click Use preferred model in the new-thread composer to apply it for the currently selected provider, using the standard service tier. Nothing is sent automatically.
- Existing picker selections remain available as Current even when hidden. Applying preferences does not switch an existing conversation's model.
- The catalog source control selects the machine/workspace used for discovery. Saved preferences remain provider-wide. The preview uses the same source.
- Concurrent edits are revision-checked. A conflict preserves your draft and lets you reload the latest saved selection.

## Known limitations

These are accepted V1 boundaries, not claims that BB enforces a model policy:

1. **Menu filtering only.** CLI/API requests, saved automations, tasks, workflows, and other plugins can still explicitly request a hidden model. A current hidden selection remains usable in its picker.
2. **Explicit preferred selection.** The preferred-model button is not an automatic default across BB. BB's remembered/project defaults are not overwritten. There is no fallback routing.
3. **Custom models remain BB configuration.** Register additional model IDs using BB's supported `customModels` configuration; Model Manager can then curate them. It does not create provider access or write BB's configuration file.
4. **Version-specific adapter.** Settings, storage, RPC and the preferred-model action use public APIs. Native filtering also uses private React/TanStack observer integration. A future BB change can break it. When query-client discovery fails, the plugin reports inactivity and leaves native menus usable. Do not run it alongside another model-filtering adapter.
5. Independent BB servers do not synchronize preferences. This separate plugin does not automatically import another plugin's database.

The compatibility target is **BB 0.50.1 / Plugin SDK 0.6.157**. Automated contracts and an isolated browser harness verify the adapter; live installation into the user's BB is a separate acceptance step. See [compatibility](docs/compatibility.md).

## CLI

```sh
bb model-manager status --json
bb model-manager select codex <model-id> <another-model-id>
bb model-manager favorite codex <model-id>
bb model-manager unfavorite codex <model-id>
bb model-manager order codex <first-id> <second-id>
bb model-manager prefer codex <model-id> high
bb model-manager clear-preferred codex
bb model-manager all codex
bb model-manager reset codex
```

All commands accept `--json`. Use exact provider/model IDs from `bb provider models <provider>`. `all` restores the full catalog while retaining preferences; `reset` removes the provider's entire rule. Reset without a provider removes every rule. CLI preference edits affect menus; they do not restrict execution.

## Development and installation

```sh
npm ci --ignore-scripts
npm rebuild better-sqlite3 --ignore-scripts=false
npm run check
npm run dev:fixture
```

The fixture is an isolated browser harness with labeled example catalogs and no account or inference calls. Open the URL printed by Vite. It is not a second BB installation.

After reviewing a build, install from the checkout with `bb plugin install .`. No live installation or default-branch merge is performed by the build/check commands. This repository is not claimed to be published in the BB marketplace.

[Specification](docs/spec.md) | [Architecture](docs/ARCHITECTURE.md) | [Implementation](tasks/plan.md) | [Upstream license](LICENSE)
