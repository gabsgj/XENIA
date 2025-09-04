from __future__ import annotations
import os
import hashlib
from typing import List, Optional


_provider: Optional[str] = None


def _generate_mock_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate deterministic mock embeddings for demo mode."""
    import logging
    logger = logging.getLogger('xenia')
    logger.info(f"🎭 Generating mock embeddings for {len(texts)} texts")
    
    vectors = []
    for i, text in enumerate(texts):
        # Create deterministic but varied embeddings based on text content
        text_hash = hashlib.md5(text.encode()).hexdigest()
        base_seed = int(text_hash[:8], 16)
        
        # Generate a 384-dimensional vector (similar to common embedding models)
        vector = []
        for j in range(384):
            # Use different parts of the hash to create varied values
            seed = (base_seed + j * 1337) % (2**32)
            # Normalize to [-1, 1] range like real embeddings
            value = ((seed % 2000) - 1000) / 1000.0
            vector.append(value)
        
        vectors.append(vector)
    
    logger.info(f"🎭 Generated {len(vectors)} mock embedding vectors of dimension {len(vectors[0]) if vectors else 0}")
    return vectors


def _get_provider() -> str:
    global _provider
    if _provider is None:
        _provider = os.getenv("EMBEDDING_PROVIDER", "gemini").lower()
    return _provider


def _embed_openai(
    texts: List[str], model: Optional[str]
) -> Optional[List[List[float]]]:
    try:
        from openai import OpenAI  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    
    # Check for demo credentials
    if "demo" in api_key.lower() or api_key.startswith("sk-demo-"):
        return _generate_mock_embeddings(texts)
    
    client = OpenAI(api_key=api_key)  # type: ignore
    model_name = model or os.getenv(
        "EMBEDDING_MODEL", "text-embedding-3-small"
    ) or "text-embedding-3-small"
    vectors: List[List[float]] = []
    for t in texts:
        resp = client.embeddings.create(
            model=model_name, input=t[:8000]
        )  # type: ignore
        vectors.append(resp.data[0].embedding)  # type: ignore
    return vectors


def _embed_gemini(
    texts: List[str], model: Optional[str]
) -> Optional[List[List[float]]]:
    try:
        import google.generativeai as genai  # type: ignore
    except Exception:
        return None
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return None
    
    # Check for demo credentials
    if "demo" in api_key.lower() or api_key.startswith("AIzaSyDemo_"):
        return _generate_mock_embeddings(texts)
    
    genai.configure(api_key=api_key)
    # Gemini embeddings require model names prefixed with 'models/' or 'tunedModels/'.
    # Accept both forms and normalize here for robustness.
    raw_model_name = model or os.getenv("EMBEDDING_MODEL", "models/text-embedding-004") or "models/text-embedding-004"
    if not (
        raw_model_name.startswith("models/")
        or raw_model_name.startswith("tunedModels/")
    ):
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


def embed_texts(
    texts: List[str], model: Optional[str] = None
) -> Optional[List[List[float]]]:
    import logging
    logger = logging.getLogger('xenia')
    
    provider = _get_provider()
    logger.info(f"🔗 Using embedding provider: {provider}")
    
    try:
        if provider == "openai":
            result = _embed_openai(texts, model)
            if result is not None:
                logger.info(f"✅ OpenAI embeddings generated: {len(result)} vectors")
                return result
            else:
                logger.warning("⚠️ OpenAI embeddings failed, trying Gemini fallback")
        
        # Default to Gemini or fallback
        result = _embed_gemini(texts, model)
        if result is not None:
            logger.info(f"✅ Gemini embeddings generated: {len(result)} vectors")
            return result
        else:
            logger.warning("⚠️ Gemini embeddings failed, using mock fallback")
            
    except Exception as e:
        logger.error(f"❌ Embedding generation failed: {e}")
    
    # Final fallback to mock embeddings
    logger.info("🎭 Using mock embeddings as final fallback")
    return _generate_mock_embeddings(texts)
