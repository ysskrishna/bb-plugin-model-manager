# Isolated browser verification

Run `npm run dev:fixture` and open the printed URL through BB Browser Automation. The page imports the real plugin app/settings/action and real TanStack query client/observers; only BB SDK/account data are emulated. Example catalogs are labeled, and no vendor process, live BB settings, or inference call is used.

Check:

1. The status reports connected preferences. Search and select/deselect work across the full provider catalog.
2. Reorder models, star a favorite, choose preferred model/reasoning, and Apply. Expand Preview menu; the same projection must appear there and in the composer fixture.
3. Use preferred model. Inspect Composer selection and verify the draft text is unchanged and Submit attempts remains zero. The action runs inside a form, like BB's actual composer.
4. Hide a model and Apply. Neither supported picker lists it. Other providers retain native lists.
5. Unload plugin. Both native pickers restore full catalogs. Load again; saved preferences return.
6. Switch theme and repeat at a narrow viewport. Check for horizontal overflow, clipped controls, missing labels, console errors and unreadable status text.

The actual BB native picker and physical mobile/Electron acceptance remain a separate post-installation check. This fixture must not be described as a full live BB integration test.
