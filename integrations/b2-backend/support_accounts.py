"""
Admin-only support account management.

Copy into your admin auth router module (or as a new module under app/api/admin/)
and include its router in app/api/admin/__init__.py.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.db.connection import get_db  # use app.db.session if your repo uses that path
from app.db.models import AdminUser
from app.middleware.admin_auth import get_current_admin
from app.core.security import hash_password

router = APIRouter(tags=["Admin Auth"])


def require_admin(admin: Any = Depends(get_current_admin)) -> Any:
    if getattr(admin, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return admin


class SupportAccountCreateBody(BaseModel):
    email: EmailStr
    display_name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)


class SupportAccountOut(BaseModel):
    id: int
    email: str
    display_name: str
    role: str
    created_at: datetime | None = None

    class Config:
        from_attributes = True


@router.get("/auth/support-accounts", response_model=list[SupportAccountOut])
def list_support_accounts(
    db: Session = Depends(get_db),
    _admin: Any = Depends(require_admin),
) -> list[SupportAccountOut]:
    rows = (
        db.query(AdminUser)
        .filter(AdminUser.role == "support")
        .order_by(AdminUser.id.desc())
        .all()
    )
    return rows


@router.post("/auth/support-accounts", response_model=SupportAccountOut)
def create_support_account(
    body: SupportAccountCreateBody,
    db: Session = Depends(get_db),
    _admin: Any = Depends(require_admin),
) -> SupportAccountOut:
    existing = db.query(AdminUser).filter(AdminUser.email == body.email.lower()).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email is already in use")

    row = AdminUser(
        email=body.email.lower(),
        display_name=body.display_name.strip(),
        role="support",
        password_hash=hash_password(body.password),
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row
