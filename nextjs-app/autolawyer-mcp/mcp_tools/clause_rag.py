from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Any

import chromadb
from chromadb.config import Settings
from sentence_transformers import SentenceTransformer
from rank_bm25 import BM25Okapi


@dataclass
class ClauseRAGIndex:
    collection_name: str
    num_items: int


def simple_tokenizer(text: str) -> List[str]:
    """Basic tokenizer for sparse retrieval."""
    return re.sub(r"[\W_]+", " ", text).lower().split()


class ClauseRAG:
    def __init__(
        self,
        persist_directory: Path | None = None,
        embedding_model: str = "all-MiniLM-L6-v2",
    ) -> None:
        self.persist_directory = persist_directory
        if self.persist_directory:
            self.persist_directory.mkdir(parents=True, exist_ok=True)
        if self.persist_directory:
            self.client = chromadb.PersistentClient(path=str(self.persist_directory))
        else:
            self.client = chromadb.EphemeralClient()
        self.embedder = SentenceTransformer(embedding_model)
        self.bm25: Dict[str, BM25Okapi] = {}
        self.documents_store: Dict[str, List[Dict]] = {}

    def upsert(self, clauses: List[Dict], collection_name: str) -> ClauseRAGIndex:
        """
        Store clause-level embeddings with metadata for later retrieval.
        Also builds a BM25 index for sparse retrieval.
        """
        collection = self.client.get_or_create_collection(collection_name)
        texts = [clause["body"] for clause in clauses]
        embeddings = self.embedder.encode(texts, batch_size=16, show_progress_bar=False)
        ids = [clause["clause_id"] for clause in clauses]
        metas = [
            {"heading": clause["heading"], "doc": clause["source_document"]}
            for clause in clauses
        ]
        collection.upsert(
            ids=ids, embeddings=embeddings.tolist(), documents=texts, metadatas=metas
        )

        # Initialize BM25 for this collection
        tokenized_corpus = [simple_tokenizer(text) for text in texts]
        self.bm25[collection_name] = BM25Okapi(tokenized_corpus)
        self.documents_store[collection_name] = clauses

        # Persistence is automatic in newer clients, or not needed for Ephemeral
        return ClauseRAGIndex(collection_name=collection_name, num_items=len(ids))

    def retrieve(self, query: str, collection_name: str, top_k: int = 5) -> List[Dict]:
        """
        Hybrid search using Reciprocal Rank Fusion (RRF).
        """
        # 1. Dense Retrieval (ChromaDB)
        collection = self.client.get_or_create_collection(collection_name)
        embedding = self.embedder.encode([query])[0]
        dense_results = collection.query(
            query_embeddings=[embedding.tolist()], n_results=top_k * 2
        )

        dense_hits = []
        for rid, doc, meta, score in zip(
            dense_results["ids"][0],
            dense_results["documents"][0],
            dense_results["metadatas"][0],
            dense_results["distances"][0],
        ):
            dense_hits.append({"id": rid, "document": doc, "metadata": meta, "score": score})

        # 2. Sparse Retrieval (BM25)
        sparse_hits = []
        if collection_name in self.bm25:
            tokenized_query = simple_tokenizer(query)
            bm25_scores = self.bm25[collection_name].get_scores(tokenized_query)
            
            # Get indices of top results
            clauses = self.documents_store[collection_name]
            scored_clauses = sorted(
                zip(range(len(bm25_scores)), bm25_scores),
                key=lambda x: x[1],
                reverse=True
            )[:top_k * 2]
            
            for idx, score in scored_clauses:
                if score > 0:
                    clause = clauses[idx]
                    sparse_hits.append({
                        "id": clause["clause_id"],
                        "document": clause["body"],
                        "metadata": {"heading": clause["heading"], "doc": clause["source_document"]},
                        "score": score
                    })

        # 3. Reciprocal Rank Fusion (RRF)
        return self._rrf(dense_hits, sparse_hits, limit=top_k)

    def _rrf(self, dense_hits: List[Dict], sparse_hits: List[Dict], k: int = 60, limit: int = 5) -> List[Dict]:
        """
        Combines results from multiple search methods using Reciprocal Rank Fusion.
        """
        scores: Dict[str, float] = {}
        metadata_map: Dict[str, Dict] = {}
        doc_map: Dict[str, str] = {}

        for rank, hit in enumerate(dense_hits):
            doc_id = hit["id"]
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
            metadata_map[doc_id] = hit["metadata"]
            doc_map[doc_id] = hit["document"]

        for rank, hit in enumerate(sparse_hits):
            doc_id = hit["id"]
            scores[doc_id] = scores.get(doc_id, 0.0) + 1.0 / (k + rank + 1)
            metadata_map[doc_id] = hit["metadata"]
            doc_map[doc_id] = hit["document"]

        sorted_ids = sorted(scores.keys(), key=lambda x: scores[x], reverse=True)
        
        return [
            {
                "id": doc_id,
                "document": doc_map[doc_id],
                "metadata": metadata_map[doc_id],
                "score": scores[doc_id],
                "method": "hybrid (rrf)"
            }
            for doc_id in sorted_ids[:limit]
        ]


def build_clause_index(clauses: List[Dict], collection_name: str) -> Dict:
    # Vercel is read-only except for /tmp. Use /tmp for temporary storage.
    import tempfile
    temp_dir = Path(tempfile.gettempdir()) / "rag"
    rag = ClauseRAG(persist_directory=temp_dir)
    index = rag.upsert(clauses, collection_name=collection_name)
    return index.__dict__


