import asyncio
from concurrent.futures import ThreadPoolExecutor

import fitz

executor = ThreadPoolExecutor(max_workers=4)


def _extract_text_sync(file_path: str) -> tuple[str, int]:
    doc = fitz.open(file_path)
    text = ""
    for page in doc:
        text += page.get_text()
    page_count = len(doc)
    doc.close()
    return text, page_count


async def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(executor, _extract_text_sync, file_path)
