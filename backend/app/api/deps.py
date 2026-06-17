from fastapi import Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from sqlalchemy.orm import Session
from app.core.config import settings
from app.db.database import get_db
from app.db.models import User, UserRole, ApprovalStatus
from app.schemas.user import TokenPayload
from typing import Callable, List

# We don't necessarily use OAuth2PasswordBearer for getting the token 
# if we are delivering them via httpOnly cookies as per the spec.
# The spec says: "Tokens delivered in httpOnly cookies (not localStorage)."
# So we need to extract from cookies.

class OAuth2CookieBearer:
    def __init__(self, tokenUrl: str):
        self.tokenUrl = tokenUrl

    async def __call__(self, request: Request) -> str:
        token = request.cookies.get("access_token")
        if not token:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated",
            )
        return token

oauth2_scheme = OAuth2CookieBearer(tokenUrl="/api/auth/login")

def get_current_user(
    db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
    )
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        token_data = TokenPayload(**payload)
        if token_data.sub is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(User).filter(User.id == token_data.sub).first()
    if user is None:
        raise credentials_exception
    return user

def require_role(roles: List[UserRole]) -> Callable:
    def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Operation not permitted",
            )
        return current_user
    return role_checker

def require_approved_doctor(current_user: User = Depends(get_current_user)):
    if current_user.role != UserRole.DOCTOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operation not permitted",
        )
    if not current_user.doctor_profile or current_user.doctor_profile.approval_status != ApprovalStatus.APPROVED:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Doctor profile is pending approval or rejected",
        )
    return current_user
