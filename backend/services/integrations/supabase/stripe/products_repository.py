from ..client import get_stripe_supabase
from typing import List, Optional

class ProductsRepository:
    @staticmethod
    def get_products() -> List[dict]:
        """Get all Stripe products from database"""
        supabase = get_stripe_supabase()
        response = supabase.table('products').select('*').order('created_at', desc=True).execute()
        
        print("PRODUCTS", response)
        
        return response.data if response.data else []

    @staticmethod
    def get_product(product_id: str) -> Optional[dict]:
        """Get a single product by product_id"""
        supabase = get_stripe_supabase()
        response = supabase.table('products').select('*').eq('id', product_id).execute()
        return response.data[0] if response.data else None

    @staticmethod
    def create_product(product_data: dict) -> dict:
        """Create a new product"""
        supabase = get_stripe_supabase()
        response = supabase.table('products').insert(product_data).execute()
        if not response.data:
            raise ValueError("Failed to create product")
        return response.data[0]

    @staticmethod
    def update_product(product_id: str, updates: dict) -> dict:
        """Update an existing product"""
        supabase = get_stripe_supabase()
        response = supabase.table('products').update(updates).eq('id', product_id).execute()
        if not response.data:
            raise ValueError("Product not found")
        return response.data[0]

    @staticmethod
    def delete_product(product_id: str) -> bool:
        """Delete a product"""
        supabase = get_stripe_supabase()
        response = supabase.table('products').delete().eq('id', product_id).execute()
        return True
