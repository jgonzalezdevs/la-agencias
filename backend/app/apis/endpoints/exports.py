from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Optional
from datetime import date
import io

from app.db.session import get_db
from app.services import export_service
from app.apis.dependencies import get_current_user, get_current_superuser
from app.models.user import User

router = APIRouter()


@router.get("/excel")
async def export_to_excel(
    start_date: Optional[date] = Query(None, description="Start date for filtering orders"),
    end_date: Optional[date] = Query(None, description="End date for filtering orders"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    _: User = Depends(get_current_superuser),  # Admin only
    db: AsyncSession = Depends(get_db)
):
    """
    Export orders to Excel format with optional filters.
    """
    # Generate Excel file
    excel_file = await export_service.export_orders_to_excel(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        service_type=service_type
    )

    # Return as streaming response
    return StreamingResponse(
        io.BytesIO(excel_file),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=orders_export_{date.today().strftime('%Y%m%d')}.xlsx"
        }
    )


@router.get("/pdf")
async def export_to_pdf(
    start_date: Optional[date] = Query(None, description="Start date for filtering orders"),
    end_date: Optional[date] = Query(None, description="End date for filtering orders"),
    status: Optional[str] = Query(None, description="Filter by order status"),
    service_type: Optional[str] = Query(None, description="Filter by service type"),
    _: User = Depends(get_current_superuser),  # Admin only
    db: AsyncSession = Depends(get_db)
):
    """
    Export orders to PDF format with optional filters.
    """
    # Generate PDF file
    pdf_file = await export_service.export_orders_to_pdf(
        db=db,
        start_date=start_date,
        end_date=end_date,
        status=status,
        service_type=service_type
    )

    # Return as streaming response
    return StreamingResponse(
        io.BytesIO(pdf_file),
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=orders_report_{date.today().strftime('%Y%m%d')}.pdf"
        }
    )
