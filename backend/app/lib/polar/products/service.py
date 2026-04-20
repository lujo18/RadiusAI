

from backend.app.lib.polar.client import get_polar_client

def list_products():
  return get_polar_client().products.list()

def get_product(product_id: str):
  return get_polar_client().products.get(id=product_id)


