"""File upload endpoints for document/image management."""

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from app.apis.dependencies import get_current_active_user
from app.models.user import User

router = APIRouter()

# Configure upload directory
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Allowed file extensions
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".pdf", ".gif", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return Path(filename).suffix.lower()


def generate_unique_filename(original_filename: str) -> str:
    """Generate a unique filename while preserving the extension."""
    ext = get_file_extension(original_filename)
    unique_name = f"{uuid.uuid4()}{ext}"
    return unique_name


@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload a single file (image or PDF document).

    Returns the URL to access the uploaded file.
    Requires authentication.
    """
    # Validate file extension
    ext = get_file_extension(file.filename or "")
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Read file content
    content = await file.read()

    # Validate file size
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / 1024 / 1024}MB"
        )

    # Generate unique filename
    unique_filename = generate_unique_filename(file.filename or "file")
    file_path = UPLOAD_DIR / unique_filename

    # Save file
    with open(file_path, "wb") as f:
        f.write(content)

    # Return response
    return {
        "filename": unique_filename,
        "url": f"/api/v1/upload/{unique_filename}",
        "size": len(content),
        "original_filename": file.filename
    }


@router.post("/multiple", status_code=status.HTTP_201_CREATED)
async def upload_multiple_files(
    files: list[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user)
):
    """
    Upload multiple files at once.

    Returns a list of uploaded file information.
    Requires authentication.
    """
    if len(files) > 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 files can be uploaded at once"
        )

    uploaded_files = []
    for file in files:
        # Validate extension
        ext = get_file_extension(file.filename or "")
        if ext not in ALLOWED_EXTENSIONS:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File type not allowed for {file.filename}. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
            )

        # Read and validate size
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File {file.filename} exceeds maximum allowed size"
            )

        # Save file
        unique_filename = generate_unique_filename(file.filename or "file")
        file_path = UPLOAD_DIR / unique_filename

        with open(file_path, "wb") as f:
            f.write(content)

        uploaded_files.append({
            "filename": unique_filename,
            "url": f"/api/v1/upload/{unique_filename}",
            "size": len(content),
            "original_filename": file.filename
        })

    return uploaded_files


@router.get("/{filename}")
async def get_file(filename: str):
    """
    Retrieve an uploaded file.

    Public endpoint (no authentication required for viewing).
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Validate filename to prevent directory traversal
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    return FileResponse(file_path)


@router.delete("/{filename}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_file(
    filename: str,
    current_user: User = Depends(get_current_active_user)
):
    """
    Delete an uploaded file.

    Requires authentication.
    """
    file_path = UPLOAD_DIR / filename

    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )

    # Validate filename to prevent directory traversal
    if not file_path.resolve().is_relative_to(UPLOAD_DIR.resolve()):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

    # Delete file
    os.remove(file_path)
