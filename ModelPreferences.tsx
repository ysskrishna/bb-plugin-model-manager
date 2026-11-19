import type { SettingsModel } from "./settings-state";
import { Button } from "./components/ui/button";

export function ModelRowActions({
  model,
  id,
  label,
}: {
  model: SettingsModel;
  id: string;
  label: string;
}) {
  const { draft, setDraft, orderedModels, favorites, neighbors, saving } =
    model;
  const favorite = favorites.has(id);
  const adjacent = neighbors.get(id);
  const move = (other?: string) => {
    if (!other) return;
    const ids = orderedModels.map((item) => item.model);
    const from = ids.indexOf(id),
      to = ids.indexOf(other);
    [ids[from], ids[to]] = [ids[to], ids[from]];
    setDraft({ ...draft, modelOrder: ids });
  };
  return (
    <span className="mf-model-actions">
      <Button
        size="sm"
        variant="ghost"
        disabled={saving}
        aria-label={`${favorite ? "Unfavorite" : "Favorite"} ${label}`}
        aria-pressed={favorite}
        onClick={() =>
          setDraft({
            ...draft,
            favoriteIds: favorite
              ? [...favorites].filter((item) => item !== id)
              : [...favorites, id],
          })
        }
      >
        {favorite ? "★" : "☆"}
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={saving || !adjacent?.previous}
        aria-label={`Move ${label} up`}
        onClick={() => move(adjacent?.previous)}
      >
        ↑
      </Button>
      <Button
        size="sm"
        variant="ghost"
        disabled={saving || !adjacent?.next}
        aria-label={`Move ${label} down`}
        onClick={() => move(adjacent?.next)}
      >
        ↓
      </Button>
    </span>
  );
}

export function PreferredModelFields({ model }: { model: SettingsModel }) {
  const { draft, setDraft, orderedModels, selected, saving, loading } = model;
  const preferred = orderedModels.find(
    (item) => item.model === draft.preferredModelId,
  );
  return (
    <div className="mf-preferences">
      <label>
        Preferred model
        <select
          aria-label="Preferred model"
          value={draft.preferredModelId ?? ""}
          disabled={saving || loading}
          onChange={(event) =>
            setDraft({
              ...draft,
              preferredModelId: event.target.value || undefined,
              preferredReasoning: undefined,
            })
          }
        >
          <option value="">No preference</option>
          {draft.preferredModelId && !preferred && (
            <option value={draft.preferredModelId}>
              {draft.preferredModelId} (unavailable)
            </option>
          )}
          {orderedModels
            .filter((item) => selected.has(item.model))
            .map((item) => (
              <option key={item.model} value={item.model}>
                {item.displayName || item.model}
              </option>
            ))}
        </select>
      </label>
      <label>
        Preferred reasoning
        <select
          aria-label="Preferred reasoning"
          value={draft.preferredReasoning ?? ""}
          disabled={saving || loading || !preferred}
          onChange={(event) =>
            setDraft({
              ...draft,
              preferredReasoning: event.target.value || undefined,
            })
          }
        >
          <option value="">Keep BB's selection</option>
          {draft.preferredReasoning &&
            !preferred?.supportedReasoningEfforts?.some(
              (effort) => effort.reasoningEffort === draft.preferredReasoning,
            ) && (
              <option value={draft.preferredReasoning}>
                {draft.preferredReasoning} (unavailable)
              </option>
            )}
          {preferred?.supportedReasoningEfforts?.map((effort) => (
            <option key={effort.reasoningEffort} value={effort.reasoningEffort}>
              {effort.reasoningEffort}
            </option>
          ))}
        </select>
      </label>
      <p className="mf-muted">
        Use the preferred model with one click in the new-thread composer. This
        does not replace BB's automatic defaults. Favorites and order affect
        menus only.
      </p>
    </div>
  );
}
