import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
} from "react";
import { QueryClient, QueryObserver } from "@tanstack/query-core";
import type { Snapshot } from "../preferences";

export const queryClient = new QueryClient();
export const QueryContext = createContext(queryClient);
export const providers = [
  { id: "codex", displayName: "Codex", available: true },
  { id: "claude-code", displayName: "Claude Code", available: true },
  { id: "acp-cursor", displayName: "Cursor", available: true },
];
const ids: Record<string, string[]> = {
  codex: ["gpt-6.2-sol", "gpt-6.2-astra", "gpt-6.1-sol"],
  "claude-code": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"],
  "acp-cursor": ["composer-2.5", "grok-4.7", "gemini-4-neon"],
};
export function catalog(providerId: string) {
  return {
    providers,
    models: (ids[providerId] ?? []).map((model, index) => ({
      model,
      id: model,
      displayName: model,
      description: "Isolated fixture model",
      isDefault: index === 0,
      defaultReasoningEffort: "high",
      reasoningDiscovery: "known",
      supportedReasoningEfforts: [
        { reasoningEffort: "high" },
        { reasoningEffort: "medium" },
      ],
    })),
    selectedOnlyModels: [],
    modelLoadError: null,
  };
}
let snapshot: Snapshot = { revision: 0, providers: {} };
const listeners = new Map<string, Set<() => void>>();
const rpc = {
  async call(
    method: string,
    input: {
      expectedRevision: number;
      providerId: string;
      rule: Snapshot["providers"][string];
    } | null,
  ) {
    if (method === "getPreferences") return snapshot;
    if (!input || input.expectedRevision !== snapshot.revision)
      throw new Error("Fixture revision conflict");
    const next = { ...snapshot.providers };
    if (method === "saveProvider") next[input.providerId] = input.rule;
    else if (method === "resetPreferences") {
      if (input.providerId) delete next[input.providerId];
      else for (const id of Object.keys(next)) delete next[id];
    }
    snapshot = { revision: snapshot.revision + 1, providers: next };
    for (const fn of listeners.get("preferences-changed") ?? []) fn();
    return snapshot;
  },
};
const sdk = {
  hosts: {
    list: async () => [{ id: "fixture-host", name: "Fixture machine" }],
  },
  environments: { list: async () => [] },
  providers: { list: async () => providers },
  system: {
    executionOptions: async ({ providerId }: { providerId: string }) =>
      catalog(providerId),
  },
};
export const ComposerContext = createContext({
  selection: {
    providerId: "codex",
    model: "gpt-6.2-sol",
    reasoningLevel: "high",
    serviceTier: "default",
  },
  isSubmitting: false,
  isRunning: false,
  setSelection: async (selection: Record<string, string>) => selection,
});
export function useComposer() {
  return useContext(ComposerContext);
}
export function useRpc() {
  return rpc;
}
export function useSdk() {
  return sdk;
}
export function useSettings() {
  return { values: { enabled: true } };
}
export function useRealtimeConnectionState() {
  return "connected";
}
export function useRealtime(channel: string, listener: () => void) {
  useEffect(() => {
    const set = listeners.get(channel) ?? new Set();
    listeners.set(channel, set);
    set.add(listener);
    return () => {
      set.delete(listener);
    };
  }, [channel, listener]);
}
export function defineRpcContract(contract: unknown) {
  return contract;
}
export function definePluginApp(setup: (app: typeof registrations) => void) {
  setup(registrations);
  return registrations;
}
export const registered = {
  overlay: null as React.ComponentType | null,
  settings: null as React.ComponentType | null,
  action: null as React.ComponentType | null,
};
const registrations = {
  slots: {
    experimental_appOverlay: ({
      component,
    }: {
      component: React.ComponentType;
    }) => {
      registered.overlay = component;
    },
    settingsSection: ({ component }: { component: React.ComponentType }) => {
      registered.settings = component;
    },
  },
  composer: {
    customize: ({
      actions,
    }: {
      actions: { component: React.ComponentType }[];
    }) => {
      registered.action = actions[0].component;
    },
  },
};
export function experimental_ProviderModelPicker({
  value,
  onChange,
}: {
  value: { providerId: string; model: string; reasoningLevel: string };
  onChange: (next: typeof value) => void;
}) {
  const observer = useMemo(() => {
    const key = [
      "systemExecutionOptions",
      null,
      "fixture-host",
      value.providerId,
      null,
      value.model,
    ];
    queryClient.setQueryData(key, catalog(value.providerId));
    return new QueryObserver<ReturnType<typeof catalog>>(queryClient, {
      queryKey: key,
      enabled: false,
    });
  }, [value.providerId, value.model]);
  const result = useSyncExternalStore(
    (listener) => observer.subscribe(listener),
    () => observer.getCurrentResult(),
  );
  useEffect(() => () => observer.destroy(), [observer]);
  const models = result.data?.models ?? [];
  return (
    <select
      aria-label="Native model picker"
      value={value.model}
      onChange={(event) => onChange({ ...value, model: event.target.value })}
    >
      <option value="">Choose a model</option>
      {models.map((model) => (
        <option key={model.model} value={model.model}>
          {model.displayName}
        </option>
      ))}
    </select>
  );
}
