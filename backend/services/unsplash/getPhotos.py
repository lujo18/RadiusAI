from .client import api

def queryUnsplash(query: str, count: int):
  """Search for photos on Unsplash based on a query string."""
  print(f"Querying Unsplash for '{query}' with count {count}...")
  fallback_url = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80"  # Example fallback
  for attempt in range(3):
    try:
      photos = api.photo.random(count, query=query, orientation="portrait")
      if photos is None:
        return [fallback_url] * count
      return photos
    except Exception as e:
      print(f"Failed to load Unsplash image (attempt {attempt+1}): {e}")
      import time
      time.sleep(2 ** attempt)
  print("All attempts to load Unsplash image failed. Returning fallback.")
  return [fallback_url] * count


def queryUnsplashUrls(query: str, count: int):
  """Get only photo URLs from Unsplash based on a query string."""
  photos = queryUnsplash(query, count)
  if not photos:
    return None
  # If fallback URLs (strings), just return them
  if isinstance(photos[0], str):
    return photos
  # Unsplash returns Photo objects, not dicts - use dot notation
  photoUrls = [photo.urls.regular for photo in photos]
  return photoUrls