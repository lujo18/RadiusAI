from .client import api

def queryUnsplash(query: str, count: int):
  """Search for photos on Unsplash based on a query string."""
  print(f"Querying Unsplash for '{query}' with count {count}...")
  photos = api.photo.random(count, query=query, orientation="portrait")

  if photos is None:
    return None
  
  return photos


def queryUnsplashUrls(query: str, count: int):
  """Get only photo URLs from Unsplash based on a query string."""
  photos = queryUnsplash(query, count)
  if photos is None:
    return None
    
  # Unsplash returns Photo objects, not dicts - use dot notation
  photoUrls = [photo.urls.regular for photo in photos]
  return photoUrls