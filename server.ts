import { getProviderRule } from "./preferences";
import {
  experimental_PluginRpcRefusal,
  type BbPluginApi,
} from "@get-bb/plugin-sdk";
import {
  PREFERENCES_CHANGED,
  rpcContract,
  routingSchema,
  idSchema,
  type Routing,
} from "./contract";
import { normalizeRule, type Rule, type Snapshot } from "./preferences";
import {
  PreferencesStore,
  PREFERENCE_MIGRATIONS,
  RevisionConflictError,
} from "./preferences-store";

export { rpcContract } from "./contract";

export default function plugin(bb: BbPluginApi) {
  bb.settings.define({
    enabled: {
      type: "boolean",
      label: "Enable model filtering",
      default: true,
    },
  });
  const db = bb.storage.database();
  bb.storage.migrate(db, PREFERENCE_MIGRATIONS);
  const store = new PreferencesStore(db);
  const refuse = (code: "invalid" | "conflict", message: string): never => {
    throw new experimental_PluginRpcRefusal({ code, message });
  };
  function checkRevision(expected: number): Snapshot {
    try {
      return store.checkRevision(expected);
    } catch (error) {
      if (error instanceof RevisionConflictError)
        return refuse("conflict", error.message);
      throw error;
    }
  }
  function commit(
    expected: number,
    providers: Snapshot["providers"],
  ): Snapshot {
    let result: Snapshot;
    try {
      result = store.update(expected, providers);
    } catch (error) {
      if (error instanceof RevisionConflictError)
        return refuse("conflict", error.message);
      throw error;
    }
    bb.realtime.publish(PREFERENCES_CHANGED, { revision: result.revision });
    return result;
  }

  async function saveProvider(input: {
    expectedRevision: number;
    providerId: string;
    rule: Rule;
    routing?: Routing;
  }): Promise<Snapshot> {
    const previous = checkRevision(input.expectedRevision);
    const rule = normalizeRule(input.rule);
    if (
      rule.mode === "selected" ||
      rule.favoriteIds?.length ||
      rule.modelOrder?.length ||
      rule.preferredModelId
    ) {
      // This server call reads the raw catalog; frontend observer projections
      // never become an authority for saved model identities.
      const catalog = await bb.sdk.system.executionOptions({
        providerId: input.providerId,
        ...input.routing,
      });
      if (
        !catalog.providers.some(
          (provider) => provider.id === input.providerId && provider.available,
        )
      )
        return refuse(
          "invalid",
          "Provider is unknown or unavailable in this routing context",
        );
      if (catalog.modelLoadError)
        return refuse(
          "invalid",
          "Cannot validate selection: the provider catalog failed to load",
        );
      const usable = new Set(
        [...catalog.models, ...catalog.selectedOnlyModels].map(
          (model) => model.model,
        ),
      );
      const old = getProviderRule(previous, input.providerId);
      const retained = new Set([
        ...(old?.modelIds ?? []),
        ...(old?.favoriteIds ?? []),
        ...(old?.modelOrder ?? []),
        ...(old?.preferredModelId ? [old.preferredModelId] : []),
      ]);
      const referenced = [
        ...rule.modelIds,
        ...(rule.favoriteIds ?? []),
        ...(rule.modelOrder ?? []),
        ...(rule.preferredModelId ? [rule.preferredModelId] : []),
      ];
      if (referenced.some((id) => !usable.has(id) && !retained.has(id)))
        return refuse(
          "invalid",
          "Selection contains an unknown model ID outside the current catalog",
        );
      if (
        rule.mode === "selected" &&
        !rule.modelIds.some((id) => usable.has(id))
      )
        return refuse(
          "invalid",
          "Select at least one currently available model",
        );
      if (rule.preferredReasoning) {
        const preferred = [
          ...catalog.models,
          ...catalog.selectedOnlyModels,
        ].find((model) => model.model === rule.preferredModelId);
        if (
          preferred &&
          !preferred.supportedReasoningEfforts?.some(
            (effort) => effort.reasoningEffort === rule.preferredReasoning,
          )
        )
          return refuse(
            "invalid",
            "Preferred reasoning is not supported by this model",
          );
        if (
          !preferred &&
          (old?.preferredModelId !== rule.preferredModelId ||
            old?.preferredReasoning !== rule.preferredReasoning)
        )
          return refuse(
            "invalid",
            "Cannot change reasoning for an unavailable preferred model",
          );
      }
    }
    return commit(input.expectedRevision, {
      ...previous.providers,
      [input.providerId]: rule,
    });
  }

  function resetPreferences(input: {
    expectedRevision: number;
    providerId?: string;
  }): Snapshot {
    const previous = checkRevision(input.expectedRevision);
    const providers = { ...previous.providers };
    if (input.providerId === undefined)
      return commit(input.expectedRevision, {});
    delete providers[input.providerId];
    return commit(input.expectedRevision, providers);
  }
  bb.rpc.register(rpcContract, {
    getPreferences: () => store.read(),
    saveProvider,
    resetPreferences,
  });

  const usage =
    "Usage: bb model-manager status | select <provider> <model>... | all <provider> | favorite <provider> <model> | unfavorite <provider> <model> | order <provider> <model>... | prefer <provider> <model> [reasoning] | clear-preferred <provider> | reset [provider] (all accept --json)";
  function format(snapshot: Snapshot): string {
    const lines = [`Revision ${snapshot.revision}`];
    for (const [provider, rule] of Object.entries(snapshot.providers))
      lines.push(
        `${provider}: ${rule.mode === "all" ? "All models" : `${rule.modelIds.length} selected models`}`,
      );
    if (lines.length === 1)
      lines.push("All providers use their full catalogs.");
    return lines.join("\n");
  }
  bb.cli.register({
    name: "model-manager",
    summary: "Manage model visibility in BB's standard model pickers",
    commands: [
      ...["favorite", "unfavorite", "order", "prefer", "clear-preferred"].map(
        (name) => ({
          name,
          summary: `Manage provider ${name} preferences`,
          usage,
        }),
      ),
      {
        name: "status",
        summary: "Show the saved preferences",
        usage: "bb model-manager status [--json]",
      },
      {
        name: "select",
        summary: "Choose visible model IDs for a provider",
        usage: "bb model-manager select <provider> <model>... [--json]",
      },
      {
        name: "all",
        summary: "Show every model for a provider",
        usage: "bb model-manager all <provider> [--json]",
      },
      {
        name: "reset",
        summary: "Reset one provider or all preferences",
        usage: "bb model-manager reset [provider] [--json]",
      },
    ],
    async run(argv, context) {
      const json = argv.includes("--json");
      const [command, ...args] = argv.filter((arg) => arg !== "--json");
      if (command === undefined || command === "help" || command === "--help")
        return { exitCode: 0, stdout: usage };
      try {
        const previous = store.read();
        const current = getProviderRule(previous, args[0] ?? "") ?? {
          mode: "all" as const,
          modelIds: [],
        };
        const routing = context.projectId
          ? routingSchema.parse({ projectId: context.projectId })
          : undefined;
        const change = (patch: Partial<Rule>) =>
          saveProvider({
            expectedRevision: previous.revision,
            providerId: idSchema.parse(args[0]),
            rule: normalizeRule({ ...current, ...patch }),
            routing,
          });
        let snapshot: Snapshot;
        if (command === "status" && args.length === 0) snapshot = previous;
        else if (command === "select" && args.length >= 2)
          snapshot = await saveProvider({
            expectedRevision: previous.revision,
            providerId: idSchema.parse(args[0]),
            rule: normalizeRule({
              ...current,
              mode: "selected",
              modelIds: args.slice(1),
              ...(current.preferredModelId &&
              !args.slice(1).includes(current.preferredModelId)
                ? { preferredModelId: undefined, preferredReasoning: undefined }
                : {}),
            }),
            routing: context.projectId
              ? routingSchema.parse({ projectId: context.projectId })
              : undefined,
          });
        else if (command === "all" && args.length === 1)
          snapshot = await saveProvider({
            expectedRevision: previous.revision,
            providerId: idSchema.parse(args[0]),
            rule: {
              ...current,
              mode: "all",
              modelIds: getProviderRule(previous, args[0])?.modelIds ?? [],
            },
            routing,
          });
        else if (
          (command === "favorite" || command === "unfavorite") &&
          args.length === 2
        )
          snapshot = await change({
            favoriteIds:
              command === "favorite"
                ? [
                    ...new Set([
                      ...(current.favoriteIds ?? []),
                      idSchema.parse(args[1]),
                    ]),
                  ]
                : (current.favoriteIds ?? []).filter((id) => id !== args[1]),
          });
        else if (command === "order" && args.length >= 2)
          snapshot = await change({
            modelOrder: args.slice(1).map((id) => idSchema.parse(id)),
          });
        else if (
          command === "prefer" &&
          (args.length === 2 || args.length === 3)
        )
          snapshot = await change({
            preferredModelId: idSchema.parse(args[1]),
            preferredReasoning:
              args[2] === undefined ? undefined : idSchema.parse(args[2]),
          });
        else if (command === "clear-preferred" && args.length === 1)
          snapshot = await change({
            preferredModelId: undefined,
            preferredReasoning: undefined,
          });
        else if (command === "reset" && args.length <= 1)
          snapshot = resetPreferences({
            expectedRevision: previous.revision,
            providerId:
              args[0] === undefined ? undefined : idSchema.parse(args[0]),
          });
        else return { exitCode: 1, stderr: usage };
        return {
          exitCode: 0,
          stdout: json ? JSON.stringify(snapshot) : format(snapshot),
        };
      } catch (error) {
        return {
          exitCode: 1,
          stderr:
            error instanceof Error
              ? error.message.slice(0, 2048)
              : "Cannot update model preferences",
        };
      }
    },
  });
}
