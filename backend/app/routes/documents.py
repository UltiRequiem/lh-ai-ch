import os
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, UploadFile, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Document, ProcessingStatus, Tag
from app.schemas import DocumentResponse, DocumentDetail, AddTagsRequest, TagResponse
from app.services.pdf_processor import extract_text_from_pdf
from app.config import settings

router = APIRouter()

MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".pdf"}


@router.post("/documents")
async def upload_document(file: UploadFile, db: AsyncSession = Depends(get_db)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided")

    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Only PDF files are allowed")

    safe_filename = Path(file.filename).name
    if ".." in safe_filename or "/" in safe_filename or "\\" in safe_filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    # Check if document with same filename already exists
    existing_doc = await db.execute(select(Document).where(Document.filename == safe_filename))
    if existing_doc.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"A document with the filename '{safe_filename}' already exists")

    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(settings.UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=413, detail=f"File size exceeds {MAX_FILE_SIZE} bytes")
        f.write(content)

    file_size = len(content)

    try:
        text_content, page_count = await extract_text_from_pdf(file_path)
    except Exception as e:
        os.remove(file_path)
        raise HTTPException(status_code=400, detail=f"Failed to process PDF: {str(e)}")

    document = Document(
        filename=safe_filename,
        content=text_content,
        file_size=file_size,
        page_count=page_count,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)

    processing_status = ProcessingStatus(
        document_id=document.id,
        status="completed",
        processed_at=datetime.utcnow(),
    )
    db.add(processing_status)
    await db.commit()

    return {"id": document.id, "filename": document.filename}


@router.get("/documents")
async def list_documents(
    skip: int = 0, limit: int = 100, tag: str = None, db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    query = select(Document).options(
        selectinload(Document.processing_status),
        selectinload(Document.tags)
    )

    if tag:
        query = query.join(Document.tags).where(Tag.name == tag)

    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    documents = result.scalars().all()

    response = []
    for doc in documents:
        status = doc.processing_status
        response.append(
            DocumentResponse(
                id=doc.id,
                filename=doc.filename,
                file_size=doc.file_size,
                page_count=doc.page_count,
                status=status.status if status else "unknown",
                created_at=doc.created_at,
                tags=[TagResponse(id=t.id, name=t.name, created_at=t.created_at) for t in doc.tags],
            )
        )

    return response


@router.get("/documents/{document_id}")
async def get_document(document_id: int, db: AsyncSession = Depends(get_db)):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.processing_status), selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    status = document.processing_status

    return DocumentDetail(
        id=document.id,
        filename=document.filename,
        content=document.content,
        file_size=document.file_size,
        page_count=document.page_count,
        status=status.status if status else "unknown",
        created_at=document.created_at,
        tags=[TagResponse(id=t.id, name=t.name, created_at=t.created_at) for t in document.tags],
    )


@router.delete("/documents/{document_id}")
async def delete_document(document_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Document).where(Document.id == document_id))
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    status_result = await db.execute(
        select(ProcessingStatus).where(ProcessingStatus.document_id == document.id)
    )
    status = status_result.scalar_one_or_none()
    if status:
        await db.delete(status)

    await db.delete(document)
    await db.commit()

    return {"message": "Document deleted"}


@router.post("/documents/{document_id}/tags")
async def add_tags_to_document(
    document_id: int, request: AddTagsRequest, db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    for tag_name in request.tag_names:
        tag_name = tag_name.strip().lower()
        if not tag_name:
            continue

        tag_result = await db.execute(select(Tag).where(Tag.name == tag_name))
        tag = tag_result.scalar_one_or_none()

        if not tag:
            tag = Tag(name=tag_name)
            db.add(tag)
            await db.flush()

        if tag not in document.tags:
            document.tags.append(tag)

    await db.commit()
    await db.refresh(document)

    return {
        "message": "Tags added successfully",
        "tags": [TagResponse(id=t.id, name=t.name, created_at=t.created_at) for t in document.tags],
    }


@router.delete("/documents/{document_id}/tags/{tag_id}")
async def remove_tag_from_document(
    document_id: int, tag_id: int, db: AsyncSession = Depends(get_db)
):
    from sqlalchemy.orm import selectinload

    result = await db.execute(
        select(Document)
        .options(selectinload(Document.tags))
        .where(Document.id == document_id)
    )
    document = result.scalar_one_or_none()

    if not document:
        raise HTTPException(status_code=404, detail="Document not found")

    tag_result = await db.execute(select(Tag).where(Tag.id == tag_id))
    tag = tag_result.scalar_one_or_none()

    if not tag:
        raise HTTPException(status_code=404, detail="Tag not found")

    if tag in document.tags:
        document.tags.remove(tag)
        await db.commit()

    return {"message": "Tag removed successfully"}


@router.get("/tags")
async def list_tags(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Tag))
    tags = result.scalars().all()
    return [TagResponse(id=t.id, name=t.name, created_at=t.created_at) for t in tags]
