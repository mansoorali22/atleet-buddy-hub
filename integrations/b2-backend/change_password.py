"""
B2+ — Admin password change route.

Copy to: app/api/admin/auth.py (or similar auth router module)
and include under your /admin router.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.connection import get_db  # use app.db.session if that's your project layout
from app.db.models import AdminUser
from app.middleware.admin_auth import get_current_admin
from app.core.security import verify_password, hash_password

router = APIRouter(tags=["Admin Auth"])


class ChangePasswordBody(BaseModel):
    current_password: str = Field(min_length=1)
    new_password: str = Field(min_length=8, max_length=128)


@router.post("/auth/change-password")
def change_password(
    body: ChangePasswordBody,
    db: Session = Depends(get_db),
    admin: Any = Depends(get_current_admin),
) -> dict[str, str]:
    db_admin = db.query(AdminUser).filter(AdminUser.id == getattr(admin, "id", None)).first()
    if not db_admin:
        raise HTTPException(status_code=404, detail="Admin user not found")

    if not verify_password(body.current_password, db_admin.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if body.current_password == body.new_password:
        raise HTTPException(status_code=400, detail="New password must be different from current password")

    db_admin.password_hash = hash_password(body.new_password)
    db.commit()
    return {"message": "Password updated successfully"}


# Register reminder:
# from app.api.admin import auth as admin_auth
# api_router.include_router(admin_auth.router)
# If this route lives in a separate module, include that router too.
