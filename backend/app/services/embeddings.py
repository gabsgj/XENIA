from __future__ import annotations
import os
from typing import List, Optional

_provider: Optional[str] = None


def _get_provider() -> str:
    global _provider
    if _provider is None:
        _provider = os.getenv("EMBEDDING_PROVIDER", "gemini").lower()
    return _provider


def _embed_openai(texts: List[str], model: Optional[str]) -> Optional[List[List[float]]]:
    try:
        from openai import OpenAI  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    client = OpenAI(api_key=api_key)  # type: ignore
    model_name = model or os.getenv("EMBEDDING_MODEL", "text-embedding-3-small")
    vectors: List[List[float]] = []
    for t in texts:
        resp = client.embeddings.create(model=model_name, input=t[:8000])  # type: ignore
        vectors.append(resp.data[0].embedding)  # type: ignore
    return vectors


def _embed_gemini(texts: List[str], model: Optional[str]) -> Optional[List[List[float]]]:
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    genai.configure(api_key=api_key)
    # Gemini embeddings require model names prefixed with 'models/' or 'tunedModels/'.
    # Accept both forms and normalize here for robustness.
    raw_model_name = model or os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
    if not (raw_model_name.startswith("models/") or raw_model_name.startswith("tunedModels/")):
        model_name = f"models/{raw_model_name}"
    else:
        model_name = raw_model_name
    vectors: List[List[float]] = []
    for t in texts:
        res = genai.embed_content(model=model_name, content=t[:8000])  # type: ignore
        vec = None
        if isinstance(res, dict):
            vec = res.get("embedding")
            if vec is None:
                try:
                    vec = res["data"][0]["embedding"]  # type: ignore
                except Exception:
                    vec = None
        if vec is not None:
            vectors.append(vec)  # type: ignore
    return vectors


def embed_texts(texts: List[str], model: Optional[str] = None) -> Optional[List[List[float]]]:
    provider = _get_provider()
    if provider == "openai":
        return _embed_openai(texts, model)
    # default to gemini
    return _embed_gemini(texts, model)
