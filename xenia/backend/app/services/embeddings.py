from __future__ import annotations
import os
from typing import List, Optional

try:
    from openai import OpenAI  # type: ignore
except Exception:  # pragma: no cover
    OpenAI = None  # type: ignore


def get_openai_client() -> Optional[OpenAI]:
    api_key = os.getenv(OPENAI_API_KEY)
    if not api_key or OpenAI is None:
        return None
    return OpenAI(api_key=api_key)


def embed_texts(texts: List[str], model: Optional[str] = None) -> Optional[List[List[float]]]:
    client = get_openai_client()
    if client is None:
        return None
    model_name = model or os.getenv(EMBEDDING_MODEL, text-embedding-3-small)
    # Chunk to avoid payload limits
    vectors: List[List[float]] = []
    for t in texts:
        t = t[:8000]
        resp = client.embeddings.create(model=model_name, input=t)  # type: ignore
        vectors.append(resp.data[0].embedding)  # type: ignore
    return vectors
