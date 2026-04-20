# from models.user import BrandSettings
# from services.integrations.supabase.db.brand import create_supabase_brand
# from services.integrations.late.profile import create_late_profile

# async def create_profile(user_id: str, profile_name: str, profile_description: str, brand_settings: BrandSettings) -> str:
#   late_profile_id = await create_late_profile(profile_name, profile_description)
#   profile = await create_supabase_brand(user_id, late_profile_id, profile_name, profile_description, brand_settings)
#   return profile
