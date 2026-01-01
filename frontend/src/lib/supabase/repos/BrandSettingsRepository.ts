
// NOTE: BrandSettings are now updated via ProfileRepository.updateBrandSettings
// This repository is only needed if you have a separate brand_settings table (legacy)
// Otherwise, use ProfileRepository for all brand settings operations.

export class BrandSettingsRepository {
  // Deprecated: Use ProfileRepository.updateBrandSettings
}
