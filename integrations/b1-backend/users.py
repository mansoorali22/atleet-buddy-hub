"""
B1 — Admin user management routes.

Copy this file to your whatsapp-chatbot repo as: app/api/admin/users.py
Then register the router from app/api/admin/__init__.py:

    from app.api.admin import users as admin_users
    api_router.include_router(admin_users.router)

(Assumes the parent admin APIRouter is mounted at /admin in main.py.)

Adjust imports (get_db, models, get_current_admin) to match your project.
Wire _send_whatsapp_message() to your existing Meta / WhatsApp send helper.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

# --- Project-specific imports (fix paths if yours differ) ---
from app.db.session import get_db
from app.db.models import Subscription, ChatLog, AuditEvent
from app.middleware.admin_auth import get_current_admin

router = APIRouter(tags=["Admin Users"])


# ---------------------------------------------------------------------------
# Response / body models (keep in sync with dashboard src/types/user.ts)
# ---------------------------------------------------------------------------


class UserOut(BaseModel):
    whatsapp_number: str
    status: str
    plan_name: Optional[str] = None
    is_recurring: bool
    credits: int
    message_count: int
    is_trial: bool
    subscription_start: Optional[datetime] = None
    subscription_end: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserListResponse(BaseModel):
    users: list[UserOut]
    total: int
    page: int
    pages: int


class ChatLogOut(BaseModel):
    id: int
    whatsapp_number: str
    user_message: str
    bot_response: str
    response_type: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserDetailResponse(BaseModel):
    user: UserOut
    recent_chat_logs: list[ChatLogOut]


class UpdatePlanBody(BaseModel):
    plan_name: str
    credits: Optional[int] = None
    is_recurring: Optional[bool] = None


class UpdateStatusBody(BaseModel):
    status: Literal["active", "inactive", "expired", "blocked"]


class UpdateDatesBody(BaseModel):
    subscription_start: datetime
    subscription_end: datetime


class SendMessageBody(BaseModel):
    message: str = Field(..., min_length=1)


# ---------------------------------------------------------------------------
# Auth dependencies
# ---------------------------------------------------------------------------


def require_admin(admin: Any = Depends(get_current_admin)) -> Any:
    if getattr(admin, "role", None) != "admin":
        raise HTTPException(status_code=403, detail="Admin role required")
    return admin


def require_staff(admin: Any = Depends(get_current_admin)) -> Any:
    if getattr(admin, "role", None) not in ("admin", "support"):
        raise HTTPException(status_code=403, detail="Staff access required")
    return admin


# ---------------------------------------------------------------------------
# Audit helper
# ---------------------------------------------------------------------------


def _log_audit(
    db: Session,
    admin: Any,
    action: str,
    target_type: str,
    target_id: str,
    details: Optional[dict] = None,
) -> None:
    ev = AuditEvent(
        actor_id=getattr(admin, "id", None),
        actor_email=getattr(admin, "email", "") or "",
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
    )
    db.add(ev)


def _subscription_to_out(s: Subscription) -> UserOut:
    return UserOut(
        whatsapp_number=s.whatsapp_number,
        status=s.status or "inactive",
        plan_name=s.plan_name,
        is_recurring=bool(s.is_recurring),
        credits=int(s.credits or 0),
        message_count=int(s.message_count or 0),
        is_trial=bool(s.is_trial),
        subscription_start=s.subscription_start,
        subscription_end=s.subscription_end,
        created_at=getattr(s, "created_at", None),
        updated_at=getattr(s, "updated_at", None),
    )


# ---------------------------------------------------------------------------
# WhatsApp send — replace with your real implementation
# ---------------------------------------------------------------------------


def _send_whatsapp_message(whatsapp_number: str, message: str) -> None:
    """
    Call the same logic as POST /whatsapp/send (Meta Cloud API).
    Example: from app.services.whatsapp_client import send_text_message
             send_text_message(whatsapp_number, message)
    """
    raise HTTPException(
        status_code=501,
        detail="Wire _send_whatsapp_message in app/api/admin/users.py to your Meta send helper.",
    )


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@router.get("", response_model=UserListResponse)
def list_users(
    search: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    plan: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    _staff: Any = Depends(require_staff),
):
    q = db.query(Subscription)

    if search:
        term = f"%{search}%"
        q = q.filter(
            or_(
                Subscription.whatsapp_number.ilike(term),
                Subscription.plan_name.ilike(term),
            )
        )
    if status and status != "all":
        q = q.filter(Subscription.status == status)
    if plan and plan != "all":
        q = q.filter(Subscription.plan_name.ilike(f"%{plan}%"))

    total = q.count()
    order_col = getattr(Subscription, "created_at", None) or Subscription.id
    rows = (
        q.order_by(order_col.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
        .all()
    )
    pages = max(1, (total + per_page - 1) // per_page)

    return UserListResponse(
        users=[_subscription_to_out(s) for s in rows],
        total=total,
        page=page,
        pages=pages,
    )


@router.get("/{whatsapp_number}", response_model=UserDetailResponse)
def get_user(
    whatsapp_number: str,
    db: Session = Depends(get_db),
    _staff: Any = Depends(require_staff),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    logs = (
        db.query(ChatLog)
        .filter(ChatLog.whatsapp_number == whatsapp_number)
        .order_by(ChatLog.created_at.desc())
        .limit(20)
        .all()
    )

    return UserDetailResponse(
        user=_subscription_to_out(sub),
        recent_chat_logs=[ChatLogOut.model_validate(l) for l in logs],
    )


@router.patch("/{whatsapp_number}/plan", response_model=UserOut)
def update_plan(
    whatsapp_number: str,
    body: UpdatePlanBody,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_admin),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    before = {"plan_name": sub.plan_name, "credits": sub.credits, "is_recurring": sub.is_recurring}
    sub.plan_name = body.plan_name
    if body.credits is not None:
        sub.credits = body.credits
    if body.is_recurring is not None:
        sub.is_recurring = body.is_recurring
    sub.updated_at = datetime.utcnow()

    _log_audit(
        db,
        admin,
        "PLAN_CHANGE",
        "user",
        whatsapp_number,
        {"before": before, "after": body.model_dump()},
    )
    db.commit()
    db.refresh(sub)
    return _subscription_to_out(sub)


@router.patch("/{whatsapp_number}/status", response_model=UserOut)
def update_status(
    whatsapp_number: str,
    body: UpdateStatusBody,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_admin),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    before = sub.status
    sub.status = body.status
    sub.updated_at = datetime.utcnow()

    _log_audit(
        db,
        admin,
        "STATUS_CHANGE",
        "user",
        whatsapp_number,
        {"from": before, "to": body.status},
    )
    db.commit()
    db.refresh(sub)
    return _subscription_to_out(sub)


@router.patch("/{whatsapp_number}/dates", response_model=UserOut)
def update_dates(
    whatsapp_number: str,
    body: UpdateDatesBody,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_admin),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    before = {
        "subscription_start": sub.subscription_start.isoformat() if sub.subscription_start else None,
        "subscription_end": sub.subscription_end.isoformat() if sub.subscription_end else None,
    }
    sub.subscription_start = body.subscription_start
    sub.subscription_end = body.subscription_end
    sub.updated_at = datetime.utcnow()

    _log_audit(
        db,
        admin,
        "DATES_CHANGE",
        "user",
        whatsapp_number,
        {"before": before, "after": body.model_dump(mode="json")},
    )
    db.commit()
    db.refresh(sub)
    return _subscription_to_out(sub)


@router.post("/{whatsapp_number}/block", response_model=UserOut)
def block_user(
    whatsapp_number: str,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_admin),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    sub.status = "blocked"
    sub.updated_at = datetime.utcnow()
    _log_audit(db, admin, "BLOCK", "user", whatsapp_number, {})
    db.commit()
    db.refresh(sub)
    return _subscription_to_out(sub)


@router.post("/{whatsapp_number}/unblock", response_model=UserOut)
def unblock_user(
    whatsapp_number: str,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_admin),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    sub.status = "active"
    sub.updated_at = datetime.utcnow()
    _log_audit(db, admin, "UNBLOCK", "user", whatsapp_number, {})
    db.commit()
    db.refresh(sub)
    return _subscription_to_out(sub)


@router.post("/{whatsapp_number}/send", status_code=204)
def send_message(
    whatsapp_number: str,
    body: SendMessageBody,
    db: Session = Depends(get_db),
    admin: Any = Depends(require_staff),
):
    sub = db.query(Subscription).filter(Subscription.whatsapp_number == whatsapp_number).first()
    if not sub:
        raise HTTPException(status_code=404, detail="User not found")

    _send_whatsapp_message(whatsapp_number, body.message)
    _log_audit(
        db,
        admin,
        "SEND_MESSAGE",
        "user",
        whatsapp_number,
        {"length": len(body.message)},
    )
    db.commit()
    return None
