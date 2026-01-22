from fastapi import APIRouter, HTTPException, Depends
from backend.services.supabase.stripe import get_stripe_accounts, get_stripe_plans, get_stripe_products
from backend.auth import get_current_user

router = APIRouter(prefix="/api/stripe", tags=["stripe"])

@router.get("/accounts")
def read_stripe_accounts(user=Depends(get_current_user)):
    try:
        accounts = get_stripe_accounts()
        return {"accounts": accounts}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/plans")
def read_stripe_plans(user=Depends(get_current_user)):
    try:
        plans = get_stripe_plans()
        return {"plans": plans}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/products")
def read_stripe_products(user=Depends(get_current_user)):
    try:
        products = get_stripe_products()
        return {"products": products}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
