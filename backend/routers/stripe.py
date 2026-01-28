from fastapi import APIRouter, HTTPException, Depends
from backend.services.integrations.supabase.stripe import PlansRepository, ProductsRepository
from backend.auth import get_current_user

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

# ============================================
# PLANS ENDPOINTS
# ============================================

@router.get("/plans")
def get_plans(user=Depends(get_current_user)):
    """Get all pricing plans"""
    try:
        plans = PlansRepository.get_plans()
        return plans
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plans: {str(e)}")

@router.get("/plans/{plan_id}")
def get_plan(plan_id: str, user=Depends(get_current_user)):
    """Get a single plan by ID"""
    try:
        plan = PlansRepository.get_plan(plan_id)
        if not plan:
            raise HTTPException(status_code=404, detail="Plan not found")
        return plan
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch plan: {str(e)}")

@router.post("/plans")
def create_plan(plan_data: dict, user=Depends(get_current_user)):
    """Create a new pricing plan"""
    try:
        plan = PlansRepository.create_plan(plan_data)
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create plan: {str(e)}")

@router.patch("/plans/{plan_id}")
def update_plan(plan_id: str, updates: dict, user=Depends(get_current_user)):
    """Update an existing plan"""
    try:
        plan = PlansRepository.update_plan(plan_id, updates)
        return plan
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update plan: {str(e)}")

@router.delete("/plans/{plan_id}")
def delete_plan(plan_id: str, user=Depends(get_current_user)):
    """Delete a plan"""
    try:
        PlansRepository.delete_plan(plan_id)
        return {"message": "Plan deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete plan: {str(e)}")

# ============================================
# PRODUCTS ENDPOINTS
# ============================================

@router.get("/products")
def get_products(user=Depends(get_current_user)):
    """Get all Stripe products"""
    try:
        products = ProductsRepository.get_products()
        return products
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch products: {str(e)}")

@router.get("/products/{product_id}")
def get_product(product_id: str, user=Depends(get_current_user)):
    """Get a single product by ID"""
    try:
        product = ProductsRepository.get_product(product_id)
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        return product
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch product: {str(e)}")

@router.post("/products")
def create_product(product_data: dict, user=Depends(get_current_user)):
    """Create a new product"""
    try:
        product = ProductsRepository.create_product(product_data)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to create product: {str(e)}")

@router.patch("/products/{product_id}")
def update_product(product_id: str, updates: dict, user=Depends(get_current_user)):
    """Update an existing product"""
    try:
        product = ProductsRepository.update_product(product_id, updates)
        return product
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to update product: {str(e)}")

@router.delete("/products/{product_id}")
def delete_product(product_id: str, user=Depends(get_current_user)):
    """Delete a product"""
    try:
        ProductsRepository.delete_product(product_id)
        return {"message": "Product deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to delete product: {str(e)}")
