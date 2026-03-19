/**
 * EMPTY_CONTENT_RULES
 *
 * Default "blank slate" for all content_rules fields found in system templates.
 * Used when creating a custom template from scratch so the DynamicJSONForm
 * renders all fields with editable (empty) inputs instead of a blank page.
 */
/**
 * Empty slate — no fields seeded so any JSON structure can be pasted or built.
 * Legacy templates with their own structure will render as-is in DynamicJSONForm.
 */
export const EMPTY_CONTENT_RULES: Record<string, unknown> = {};
