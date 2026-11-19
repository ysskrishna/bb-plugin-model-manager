import { useState } from "react";
import { useComposer, useSettings } from "@get-bb/plugin-sdk/app";
import { getProviderRule } from "./preferences";
import { usePreferencesView } from "./preferences-client";
import { Button } from "./components/ui/button";

export function PreferredModelAction() {
  const composer = useComposer();
  const { values } = useSettings();
  const { snapshot } = usePreferencesView();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const providerId = composer.selection?.providerId;
  const rule = providerId ? getProviderRule(snapshot, providerId) : undefined;
  if (
    values?.enabled === false ||
    !providerId ||
    !rule?.preferredModelId ||
    (rule.mode === "selected" && !rule.modelIds.includes(rule.preferredModelId))
  )
    return null;
  const apply = async () => {
    setPending(true);
    setMessage("");
    setError(false);
    try {
      const result = await composer.setSelection({
        providerId,
        model: rule.preferredModelId,
        ...(rule.preferredReasoning
          ? { reasoningLevel: rule.preferredReasoning }
          : {}),
        serviceTier: "default",
      });
      if (
        result.providerId !== providerId ||
        result.model !== rule.preferredModelId
      )
        throw new Error(
          "The preferred model is not available in this composer. Choose another model or update its preference in Model Manager.",
        );
      if (
        rule.preferredReasoning &&
        result.reasoningLevel !== rule.preferredReasoning
      )
        throw new Error(
          "The model was selected, but BB adjusted its reasoning level. Review the native picker before sending.",
        );
      setMessage("Preferred model selected.");
    } catch (cause) {
      setError(true);
      setMessage(
        cause instanceof Error
          ? cause.message
          : "Could not apply the preferred model.",
      );
    } finally {
      setPending(false);
    }
  };
  return (
    <div className="mf-preferred-action">
      <Button
        type="button"
        size="sm"
        variant="ghost"
        disabled={pending || composer.isSubmitting || composer.isRunning}
        onClick={apply}
      >
        {pending ? "Selecting..." : "Use preferred model"}
      </Button>
      {message && (
        <span
          role={error ? "alert" : "status"}
          className={error ? "mf-error" : "mf-muted"}
        >
          {message}
        </span>
      )}
    </div>
  );
}
