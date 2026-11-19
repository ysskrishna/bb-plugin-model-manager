import { describe, expect, it } from "vitest";
import { normalizeRule, parseSnapshot, projectCatalog } from "./preferences";

describe("model management preferences", () => {
  it("round-trips optional preferences without changing legacy snapshots", () => {
    expect(normalizeRule({ mode: "all", modelIds: [] })).toEqual({
      mode: "all",
      modelIds: [],
    });
    const rule = {
      mode: "selected",
      modelIds: ["a", "b"],
      favoriteIds: ["b", "b"],
      modelOrder: ["b", "a"],
      preferredModelId: "b",
      preferredReasoning: "high",
    };
    expect(
      parseSnapshot({ revision: 2, providers: { custom: rule } }).providers
        .custom,
    ).toEqual({ ...rule, favoriteIds: ["b"] });
  });

  it("rejects a preferred model outside the selected list and reasoning without a model", () => {
    expect(() =>
      normalizeRule({
        mode: "selected",
        modelIds: ["a"],
        preferredModelId: "b",
      }),
    ).toThrow(/preferred/i);
    expect(() =>
      normalizeRule({ mode: "all", modelIds: [], preferredReasoning: "high" }),
    ).toThrow(/preferred/i);
    expect(() =>
      normalizeRule({ mode: "all", modelIds: [], favoriteIds: ["bad\n"] }),
    ).toThrow();
  });

  it("orders favorites first, then saved order, without changing model metadata or raw data", () => {
    const models = ["a", "b", "c"].map((model) => ({
      model,
      displayName: model,
      isDefault: model === "a",
    }));
    const raw = { models, selectedOnlyModels: [] };
    const rule = normalizeRule({
      mode: "all",
      modelIds: [],
      favoriteIds: ["b"],
      modelOrder: ["c", "a", "b"],
    });
    const result = projectCatalog(raw, rule);
    expect(result.models.map((model) => model.model)).toEqual(["b", "c", "a"]);
    expect(result.models[0]).toBe(models[1]);
    expect(result.models.find((model) => model.model === "a")!.isDefault).toBe(
      true,
    );
    expect(raw.models.map((model) => model.model)).toEqual(["a", "b", "c"]);
  });

  it("does not re-enable a hidden favorite or turn a preferred model into a native default", () => {
    const raw = {
      models: [
        { model: "a", isDefault: true },
        { model: "b", isDefault: false },
      ],
      selectedOnlyModels: [],
    };
    const rule = normalizeRule({
      mode: "selected",
      modelIds: ["b"],
      favoriteIds: ["a"],
      preferredModelId: "b",
    });
    const result = projectCatalog(raw, rule);
    expect(result.models).toEqual([{ model: "b", isDefault: false }]);
    expect(result.selectedOnlyModels.filter(() => true)).toEqual([]);
  });
});
