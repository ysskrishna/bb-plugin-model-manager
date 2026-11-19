import { afterEach, describe, expect, it } from "vitest";
import { createFakePluginHost } from "@get-bb/plugin-sdk/testing";
import type { BbPluginApi } from "@get-bb/plugin-sdk";
import plugin from "./server";

const hosts: ReturnType<typeof createFakePluginHost>[] = [];
async function setup() {
  const host = createFakePluginHost({
    pluginId: "model-manager",
    sdk: {
      system: {
        executionOptions: async () =>
          ({
            providers: [{ id: "custom", available: true }],
            models: ["a", "b"].map((model) => ({
              model,
              supportedReasoningEfforts: [{ reasoningEffort: "high" }],
            })),
            selectedOnlyModels: [],
            modelLoadError: null,
          }) as unknown as Awaited<
            ReturnType<BbPluginApi["sdk"]["system"]["executionOptions"]>
          >,
      },
    },
  });
  hosts.push(host);
  await plugin(host.bb);
  return host.harness;
}
afterEach(async () => {
  for (const host of hosts.splice(0)) await host.harness.lifecycle.dispose();
});

describe("managed model selections", () => {
  it("persists favorites, order and a supported preferred selection together", async () => {
    const harness = await setup();
    const rule = {
      mode: "all",
      modelIds: [],
      favoriteIds: ["b"],
      modelOrder: ["b", "a"],
      preferredModelId: "b",
      preferredReasoning: "high",
    };
    expect(
      await harness.behavior.callRpc("saveProvider", {
        expectedRevision: 0,
        providerId: "custom",
        rule,
      }),
    ).toEqual({ revision: 1, providers: { custom: rule } });
    expect(await harness.behavior.callRpc("getPreferences", null)).toEqual({
      revision: 1,
      providers: { custom: rule },
    });
  });

  it("validates model metadata in all mode instead of accepting invented favorites or preferences", async () => {
    const harness = await setup();
    for (const extra of [
      { favoriteIds: ["invented"] },
      { modelOrder: ["invented"] },
      { preferredModelId: "invented" },
      { preferredModelId: "a", preferredReasoning: "unsupported" },
    ]) {
      await expect(
        harness.behavior.callRpc("saveProvider", {
          expectedRevision: 0,
          providerId: "custom",
          rule: { mode: "all", modelIds: [], ...extra },
        }),
      ).rejects.toThrow();
    }
    expect(await harness.behavior.callRpc("getPreferences", null)).toEqual({
      revision: 0,
      providers: {},
    });
  });

  it("uses the CLI to manage preferences and preserves them when changing visibility", async () => {
    const harness = await setup();
    for (const argv of [
      ["favorite", "custom", "b"],
      ["order", "custom", "b", "a"],
      ["prefer", "custom", "b", "high"],
      ["select", "custom", "a", "b"],
    ]) {
      expect(await harness.behavior.runCli(argv)).toMatchObject({
        exitCode: 0,
      });
    }
    expect(
      await harness.behavior.callRpc("getPreferences", null),
    ).toMatchObject({
      providers: {
        custom: {
          mode: "selected",
          modelIds: ["a", "b"],
          favoriteIds: ["b"],
          modelOrder: ["b", "a"],
          preferredModelId: "b",
          preferredReasoning: "high",
        },
      },
    });
    expect(
      await harness.behavior.runCli(["clear-preferred", "custom"]),
    ).toMatchObject({ exitCode: 0 });
    expect(
      await harness.behavior.callRpc("getPreferences", null),
    ).not.toHaveProperty("providers.custom.preferredModelId");
  });
});
