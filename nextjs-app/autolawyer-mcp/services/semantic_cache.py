from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Optional

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer


class SemanticCache:
    """
    Semantic Cache using ChromaDB to store and retrieve previously answered queries.
    Prevents redundant LLM calls and reduces latency.
    """
    def __init__(
        self,
        persist_directory: Path | str = "./cache",
        threshold: float = 0.9,
        embedding_model: str = "all-MiniLM-L6-v2",
    ) -> None:
        self.persist_directory = Path(persist_directory)
        self.persist_directory.mkdir(parents=True, exist_ok=True)

        self.client = chromadb.PersistentClient(path=str(self.persist_directory))
        self.collection = self.client.get_or_create_collection(
            "semantic_cache",
            metadata={"hnsw:space": "cosine"},
        )
        self.embedder = SentenceTransformer(embedding_model)
        self.threshold = threshold

    def _get_query_id(self, query: str) -> str:
        return hashlib.sha256(query.encode()).hexdigest()

    def get(self, query: str) -> Optional[str]:
        """
        Search for a similar query in the cache.
        Returns the cached result if similarity > threshold.
        """
        embedding = self.embedder.encode([query])
        results = self.collection.query(
            query_embeddings=embedding.tolist(), 
            n_results=1
        )
        
        if (
            results["distances"]
            and results["distances"][0]
            and results["documents"]
            and results["documents"][0]
        ):
            # Using cosine distance space: 0 = identical, 2 = opposite
            distance = results["distances"][0][0]
            if distance < (1 - self.threshold):
                return results["documents"][0][0]
        return None

    def set(self, query: str, response: str) -> None:
        """
        Store the query and its response in the cache.
        """
        query_id = self._get_query_id(query)
        embedding = self.embedder.encode([query])
        
        self.collection.add(
            ids=[query_id],
            embeddings=embedding.tolist(),
            documents=[response],
            metadatas=[{"query": query}]
        )
        # Persistence is automatic in PersistentClient

if __name__ == "__main__":
    # Test simulation
    cache = SemanticCache(persist_directory="./tmp/cache_test")
    q = "What is the liability cap in this document?"
    ans = "The liability cap is $1M."
    
    print(f"Setting cache for: {q}")
    cache.set(q, ans)
    
    print("Checking cache...")
    hit = cache.get("What's the liability limit in the doc?")
    if hit:
        print(f"Cache Hit: {hit}")
    else:
        print("Cache Miss")
