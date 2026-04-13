from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Dict, List, Set


@dataclass
class ClauseRelation:
    source_id: str
    target_id: str
    relation_type: str  # "references", "conflicts", "depends_on"
    context: str


class ClauseGraph:
    """
    Building a knowledge graph of clauses to enable GraphRAG.
    Identifies cross-references and logical dependencies.
    """
    def __init__(self) -> None:
        self.nodes: Dict[str, Dict] = {}
        self.edges: List[ClauseRelation] = []

    def build_graph(self, clauses: List[Dict]) -> Dict:
        """
        Populate the graph by analyzing clause text for relationships.
        """
        self.nodes = {c["clause_id"]: c for c in clauses}
        self.edges = []
        
        for clause_id, clause in self.nodes.items():
            text = clause.get("body", "")
            
            # Simple heuristic for cross-references: "Section X", "Clause Y"
            ref_matches = re.finditer(r"(?:Section|Clause|Paragraph)\s*(\d+[a-z]?\.?\d*)", text, re.I)
            for match in ref_matches:
                ref_val = match.group(1)
                # Try to find target node by partial match in title or content
                for target_id, target_clause in self.nodes.items():
                    if target_id != clause_id and ref_val in target_clause.get("heading", ""):
                        self.edges.append(ClauseRelation(
                            source_id=clause_id,
                            target_id=target_id,
                            relation_type="references",
                            context=match.group(0)
                        ))

        return {
            "node_count": len(self.nodes),
            "edge_count": len(self.edges),
            "status": "graph_built"
        }

    def get_related_clauses(self, clause_id: str, depth: int = 1) -> List[str]:
        """
        Breadth-first search for related clauses.
        """
        related = set()
        to_visit = [clause_id]
        
        for _ in range(depth):
            next_visit = []
            for current in to_visit:
                for edge in self.edges:
                    if edge.source_id == current:
                        related.add(edge.target_id)
                        next_visit.append(edge.target_id)
                    elif edge.target_id == current:
                        related.add(edge.source_id)
                        next_visit.append(edge.source_id)
            to_visit = next_visit
            
        return list(related)

def build_clause_graph(clauses: List[Dict]) -> Dict:
    graph = ClauseGraph()
    return graph.build_graph(clauses)
