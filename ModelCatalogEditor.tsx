import { getProviderRule } from "./preferences";
import type { SettingsModel } from "./settings-state";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import { ModelRowActions, PreferredModelFields } from "./ModelPreferences";
const emptyRule = { mode: "all" as const, modelIds: [] as string[] };
function ModelChecklist({ model }: { model: SettingsModel }) {
  const {
    loading,
    draft,
    setDraft,
    query,
    setQuery,
    saving,
    models,
    selected,
    visible,
    unavailable,
    selectedAvailable,
  } = model;
  const toggleModel = (id: string, checked: boolean) =>
    setDraft({
      ...draft,
      mode: "selected",
      modelIds: checked
        ? [...new Set([...selected, id])]
        : [...selected].filter((modelId) => modelId !== id),
      ...(!checked && draft.preferredModelId === id
        ? { preferredModelId: undefined, preferredReasoning: undefined }
        : {}),
    });
  return (
    <>
      <Input
        aria-label="Search models"
        placeholder="Search models or IDs…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {loading ? (
        <p className="mf-muted" role="status">
          Loading model catalog…
        </p>
      ) : (
        <div className="mf-checklist" aria-label="Available models">
          {visible.map((item) => (
            <div className="mf-model" key={item.model}>
              <label className="mf-model-label">
                <input
                  type="checkbox"
                  checked={selected.has(item.model)}
                  disabled={saving}
                  onChange={(e) => toggleModel(item.model, e.target.checked)}
                />
                <span>
                  <span>{item.displayName || item.model}</span>
                  <code>{item.model}</code>
                </span>
              </label>
              <ModelRowActions
                model={model}
                id={item.model}
                label={item.displayName || item.model}
              />
            </div>
          ))}
          {visible.length === 0 && (
            <p className="mf-muted">
              {models.length
                ? "No models match your search."
                : "No models available from this catalog."}
            </p>
          )}
        </div>
      )}
      <p className="mf-muted mf-hint">
        After you apply a selection, new models stay hidden until you select
        them. Other providers keep their full lists until configured.
      </p>
      {unavailable.length > 0 && (
        <details>
          <summary>Unavailable saved models ({unavailable.length})</summary>
          {unavailable.map((id) => (
            <div className="mf-model" key={id}>
              <code>{id}</code>
              <Button
                size="sm"
                variant="ghost"
                disabled={saving}
                aria-label={`Remove unavailable ${id}`}
                onClick={() =>
                  setDraft({
                    ...draft,
                    modelIds: draft.modelIds.filter((item) => item !== id),
                    ...(draft.favoriteIds
                      ? {
                          favoriteIds: draft.favoriteIds.filter(
                            (item) => item !== id,
                          ),
                        }
                      : {}),
                    ...(draft.modelOrder
                      ? {
                          modelOrder: draft.modelOrder.filter(
                            (item) => item !== id,
                          ),
                        }
                      : {}),
                    ...(draft.preferredModelId === id
                      ? {
                          preferredModelId: undefined,
                          preferredReasoning: undefined,
                        }
                      : {}),
                  })
                }
              >
                Remove
              </Button>
            </div>
          ))}
        </details>
      )}
      {draft.mode === "selected" && !loading && selectedAvailable === 0 && (
        <p role="alert" className="mf-error">
          Select at least one available model before applying, or reset this
          provider to restore its full list.
        </p>
      )}
    </>
  );
}

function SelectionControls({ model }: { model: SettingsModel }) {
  const { draft, setDraft, saving, loading, models, selected } = model;
  return (
    <div className="mf-bulk" role="group" aria-label="Model selection">
      <Button
        size="sm"
        variant="outline"
        disabled={saving || loading || models.length === 0}
        onClick={() =>
          setDraft({
            ...draft,
            mode: "selected",
            modelIds: [
              ...new Set([...draft.modelIds, ...models.map((m) => m.model)]),
            ],
          })
        }
      >
        Select all
      </Button>
      <Button
        size="sm"
        variant="outline"
        disabled={saving || loading || selected.size === 0}
        onClick={() =>
          setDraft({
            ...draft,
            mode: "selected",
            modelIds: [],
            preferredModelId: undefined,
            preferredReasoning: undefined,
          })
        }
      >
        Deselect all
      </Button>
      <span className="mf-muted">
        Entire catalog, including hidden search results
      </span>
    </div>
  );
}

export function ModelCatalogEditor({ model }: { model: SettingsModel }) {
  const {
    providers,
    providerId,
    catalog,
    loading,
    error,
    setError,
    draft,
    setDraft,
    setBaseline,
    setDraftRevision,
    saving,
    feedback,
    snapshot,
    dirty,
    editorReady,
    models,
    selectedAvailable,
    apply,
    reset,
    conflict,
  } = model;
  return (
    <div className="mf-models">
      <div className="mf-models-header">
        <h3>
          {providers.find((p) => p.id === providerId)?.displayName ?? "Models"}
        </h3>
        <span className="mf-muted">
          {selectedAvailable} of {models.length} selected
        </span>
      </div>
      <SelectionControls model={model} />
      <ModelChecklist model={model} />
      <PreferredModelFields model={model} />
      {conflict && (
        <div className="mf-warning" role="alert">
          Preferences changed on another device. Your draft is preserved.{" "}
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const next = getProviderRule(snapshot, providerId) ?? emptyRule;
              setDraft(next);
              setBaseline(next);
              setDraftRevision(snapshot!.revision);
              setError(null);
            }}
          >
            Load latest selection
          </Button>
        </div>
      )}
      {error && (
        <p className="mf-error" role="alert">
          {error}
        </p>
      )}
      {feedback && (
        <p className="mf-muted" role="status">
          {feedback}
        </p>
      )}
      <div className="mf-actions">
        <Button
          size="sm"
          onClick={apply}
          disabled={
            !editorReady ||
            !snapshot ||
            !providerId ||
            !dirty ||
            saving ||
            conflict ||
            (draft.mode === "selected" &&
              (loading || !!catalog?.modelLoadError || selectedAvailable === 0))
          }
        >
          {saving ? "Saving…" : "Apply"}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => reset(false)}
          disabled={!snapshot || !providerId || saving}
        >
          Reset provider
        </Button>
        {dirty && (
          <>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                const next = getProviderRule(snapshot, providerId) ?? emptyRule;
                setDraft(next);
                setBaseline(next);
                setDraftRevision(snapshot?.revision ?? 0);
                setError(null);
              }}
            >
              Discard
            </Button>
            <span className="mf-muted">
              Apply or discard to switch provider
            </span>
          </>
        )}
      </div>
    </div>
  );
}
