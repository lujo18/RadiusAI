from __future__ import annotations

from typing import Optional

from pydantic import BaseModel


class BillingInvoice(BaseModel):
    id: str
    amount: int = 0
    currency: str = "USD"
    status: str = "paid"
    created: int = 0
    paid_at: int = 0
    invoice_date: int = 0
    period_start: int = 0
    period_end: int = 0
    pdf_url: Optional[str] = None


class BillingInvoicesResponse(BaseModel):
    invoices: list[BillingInvoice]
    total: int
    limit: int
    offset: int
