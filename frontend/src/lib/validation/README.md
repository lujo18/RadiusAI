Purpose
-------
`validation/` contains Zod schemas used across the frontend to validate runtime inputs and mirror DB JSON shapes.

Guidelines
----------
- Define schemas for any complex JSON fields stored in the database (e.g., `brand_settings`).
- Export both the Zod schema and the derived TypeScript type (e.g., `export type BrandSettings = z.infer<typeof BrandSettingsSchema>`).
- Use schemas at service boundaries to ensure safe data before calling repositories or services.
