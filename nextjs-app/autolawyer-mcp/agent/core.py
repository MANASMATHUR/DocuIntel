from __future__ import annotations

import json
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional

import sys

# Ensure the project root (autolawyer-mcp) is importable even when executed as a script
PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from agent.policies import ExecutionPolicies
from agent.router import ModelRouter, RouterResult
from mcp_tools import (
    clause_rag,
    clause_segmenter,
    clause_graph,
    comparator,
    document_reader,
    redline_generator,
    report_builder,
    risk_classifier,
)
from services.semantic_cache import SemanticCache


@dataclass
class ClauseInsight:
    clause_id: str
    title: str
    body: str
    risk: Dict[str, float]
    explanation: str
    recommendations: List[str] = field(default_factory=list)


@dataclass
class AgentTask:
    name: str
    tool: str
    payload: Dict
    status: str = "pending"
    result: Optional[Dict] = None
    error: Optional[str] = None


@dataclass
class AuditLogEntry:
    task: str
    role: str
    model: str
    prompt: str
    result_preview: str
    timestamp: float = field(default_factory=time.time)


class AgentCore:
    """
    Planner → Worker → Reviewer loop that orchestrates AutoLawyer-MCP end-to-end.
    """

    def __init__(
        self,
        router: ModelRouter,
        policies: ExecutionPolicies,
        enable_clause_embeddings: bool = True,
    ) -> None:
        self.router = router
        self.policies = policies
        self.enable_clause_embeddings = enable_clause_embeddings
        self.logs: List[AuditLogEntry] = []
        
        # Initialize Services
        self.cache = SemanticCache() if getattr(self.policies, "use_semantic_cache", False) else None

    # --------------------------------------------------------------------- #
    # Planning
    # --------------------------------------------------------------------- #
    def build_plan(self, case_context: Dict) -> List[AgentTask]:
        """
        Use the router to craft a structured task list that the Worker executes.
        """
        if getattr(self.router, "offline_mode", False):
            return self._fallback_plan(case_context)

        prompt = (
            "You are the Planner for AutoLawyer-MCP. "
            "Given the case context below, produce a JSON array of steps to "
            "ingest, segment, score risk, propose redlines, compare docs, and "
            "prepare executive summaries with traceability.\n"
            f"Context:\n{json.dumps(case_context, indent=2)}"
        )

        plan_result: RouterResult = self.router.generate(
            task_type="planning",
            prompt=prompt,
            schema_hint="[{\"name\": str, \"tool\": str, \"payload\": dict}]",
        )

        try:
            steps = json.loads(plan_result.output)
        except json.JSONDecodeError as exc:
            raise ValueError(f"Planner returned invalid JSON plan: {exc}") from exc

        tasks = [
            AgentTask(
                name=step.get("name", f"step-{idx+1}"),
                tool=step.get("tool", "document_reader"),
                payload=step.get("payload", {}),
            )
            for idx, step in enumerate(steps)
        ]

        self._log(
            task="Planner",
            role="planner",
            model=f"{plan_result.provider}:{plan_result.model}",
            prompt=prompt,
            result_preview=plan_result.output[:600],
        )
        return tasks

    def _fallback_plan(self, case_context: Dict) -> List[AgentTask]:
        defaults = [
            {"name": "Ingest documents", "tool": "document_reader", "payload": {"files": case_context.get("primary_documents", [])}},
            {"name": "Segment clauses", "tool": "clause_segmenter", "payload": {}},
            {"name": "Build clause index", "tool": "clause_rag", "payload": {"collection_name": case_context.get("case_id", "default")}},
            {"name": "Score risk", "tool": "risk_classifier", "payload": {"policies": case_context.get("policies", {})}},
            {"name": "Generate redlines", "tool": "redline_generator", "payload": {"instructions": case_context.get("instructions", "")}},
            {"name": "Compare documents", "tool": "comparator", "payload": {"counterparty_documents": case_context.get("counterparty_documents", [])}},
            {"name": "Build reporting", "tool": "report_builder", "payload": {}},
        ]
        return [
            AgentTask(name=step["name"], tool=step["tool"], payload=step["payload"])
            for step in defaults
        ]

    # --------------------------------------------------------------------- #
    # Worker Execution (ReAct Loop)
    # --------------------------------------------------------------------- #
    def execute(self, tasks: List[AgentTask], artifacts: Dict) -> Dict:
        """
        Execute each planned task using the MCP tool layer.
        Supports both linear execution and dynamic ReAct loops.
        """
        if getattr(self.policies, "use_react", False):
            return self.run_react_loop(artifacts)

        # Legacy Linear Execution
        for task in tasks:
            retries = 0
            while retries <= self.policies.max_retries:
                try:
                    result = self._dispatch_task(task, artifacts)
                    task.result = result
                    task.status = "completed"
                    break
                except Exception as exc:  # noqa: BLE001
                    task.error = str(exc)
                    retries += 1
                    task.status = "retrying"
                    if retries > self.policies.max_retries:
                        task.status = "failed"
                        self._log(
                            task=task.name,
                            role="worker",
                            model="tool",
                            prompt=json.dumps(task.payload),
                            result_preview=f"ERROR: {exc}",
                        )
                        if self.policies.stop_on_failure:
                            raise
        artifacts["tasks"] = [task.__dict__ for task in tasks]
        return artifacts

    def run_react_loop(self, artifacts: Dict, max_steps: int = 8) -> Dict:
        """
        Dynamic Thought → Action → Observation loop.
        """
        history = []
        case_id = artifacts["case"].get("case_id", "default")
        
        for step_idx in range(max_steps):
            prompt = (
                "You are the ReAct Agent for AutoLawyer-MCP. "
                "Current state and history are provided below. "
                "Decide on the next tool to call or finish if objectives are met.\n"
                "Available tools: document_reader, clause_segmenter, clause_rag, "
                "risk_classifier, redline_generator, comparator, report_builder, clause_graph.\n\n"
                f"History:\n{json.dumps(history, indent=2)}\n"
                f"Case Context:\n{json.dumps(artifacts['case'], indent=2)}\n"
                f"Clause Graph Summary:\n{json.dumps(artifacts.get('clause_graph', {}), indent=2)}\n"
                "Respond with JSON: {\"thought\": \"your reasoning\", \"action\": \"tool_name\", \"payload\": {}} "
                "or {\"thought\": \"final summary\", \"action\": \"finish\", \"payload\": {}}"
            )
            
            res: RouterResult = self.router.generate(
                task_type="react_step",
                prompt=prompt
            )
            
            try:
                decision = json.loads(res.output)
            except json.JSONDecodeError:
                # Handle corrupted LLM output
                history.append({"step": step_idx, "error": "Invalid JSON response from LLM"})
                continue

            thought = decision.get("thought", "No thought provided.")
            action = decision.get("action", "finish")
            payload = decision.get("payload", {})

            self._log(
                task=f"ReAct Step {step_idx}",
                role="react_worker",
                model=f"{res.provider}:{res.model}",
                prompt=thought,
                result_preview=json.dumps(decision)[:500],
            )

            if action == "finish":
                artifacts["react_summary"] = thought
                break

            # Execute Tool
            try:
                task = AgentTask(name=f"react-{step_idx}-{action}", tool=action, payload=payload)
                result = self._dispatch_task(task, artifacts)
                history.append({
                    "step": step_idx,
                    "thought": thought,
                    "action": action,
                    "observation": result
                })
            except Exception as exc:
                history.append({
                    "step": step_idx,
                    "thought": thought,
                    "action": action,
                    "error": str(exc)
                })

        artifacts["react_history"] = history
        return artifacts

    def _dispatch_task(self, task: AgentTask, artifacts: Dict) -> Dict:
        """
        Route a task to the right MCP tool and persist resulting artifacts.
        """
        tool_name = task.tool
        payload = task.payload

        if tool_name == "document_reader":
            files = payload.get("files") or artifacts["case"].get("primary_documents", [])
            result = document_reader.ingest_documents(files)
            artifacts["documents"] = result
        elif tool_name == "clause_segmenter":
            docs = artifacts.get("documents", [])
            result = clause_segmenter.segment_documents(
                docs, strategy=payload.get("strategy", "semantic")
            )
            artifacts["clauses"] = result
        elif tool_name == "clause_rag":
            if self.enable_clause_embeddings:
                result = clause_rag.build_clause_index(
                    artifacts.get("clauses", []),
                    collection_name=payload.get("collection_name", "default"),
                )
                artifacts["rag_index"] = result
            else:
                result = {"status": "skipped", "reason": "embeddings disabled"}
        elif tool_name == "risk_classifier":
            result = risk_classifier.score_clauses(
                artifacts.get("clauses", []), payload.get("policies", {})
            )
            artifacts["risks"] = result
        elif tool_name == "redline_generator":
            result = redline_generator.generate_patch(
                baseline=artifacts.get("clauses", []),
                clause_scores=artifacts.get("risks", []),
                instructions=payload.get("instructions", ""),
            )
            artifacts["redlines"] = result
        elif tool_name == "comparator":
            comparison_docs = payload.get("counterparty_documents") or artifacts["case"].get(
                "counterparty_documents", []
            )
            prepared_comparisons = comparison_docs
            if comparison_docs and "content" not in comparison_docs[0]:
                prepared_comparisons = document_reader.ingest_documents(comparison_docs)
            result = comparator.compare_documents(
                primary=artifacts.get("documents", []),
                secondary=prepared_comparisons,
            )
            artifacts["comparisons"] = result
        elif tool_name == "clause_graph":
            result = clause_graph.build_clause_graph(
                artifacts.get("clauses", [])
            )
            artifacts["clause_graph"] = result
        elif tool_name == "report_builder":
            result = report_builder.build_report(
                risks=artifacts.get("risks", []),
                redlines=artifacts.get("redlines", {}),
                comparisons=artifacts.get("comparisons", []),
                tasks=artifacts.get("tasks", []),
            )
            artifacts["reports"] = result
        else:
            raise ValueError(f"Unknown task tool '{tool_name}'")

        self._log(
            task=task.name,
            role="worker",
            model=tool_name,
            prompt=json.dumps(payload)[:400],
            result_preview=json.dumps(result)[:400],
        )
        return result

    # --------------------------------------------------------------------- #
    # Reviewer
    # --------------------------------------------------------------------- #
    def review(self, artifacts: Dict) -> Dict:
        """
        Reviewer verifies coverage + accuracy, can trigger replans if needed.
        """
        prompt = (
            "You are the Reviewer for AutoLawyer-MCP. Inspect the artifacts below "
            "and decide if they satisfy accuracy, explainability, and coverage "
            "requirements. Respond with JSON {\"status\": \"pass|fail\", \"notes\": []}."
            f"\nArtifacts: {json.dumps(artifacts, default=str)[:4000]}"
        )
        verdict = self.router.generate("review", prompt)
        try:
            parsed = json.loads(verdict.output)
        except json.JSONDecodeError:
            parsed = {"status": "fail", "notes": ["Reviewer returned invalid JSON."]}

        self._log(
            task="Reviewer",
            role="reviewer",
            model=f"{verdict.provider}:{verdict.model}",
            prompt=prompt[:600],
            result_preview=verdict.output[:600],
        )

        if parsed.get("status") != "pass" and self.policies.auto_replan:
            artifacts["review_status"] = "replan"
        else:
            artifacts["review_status"] = parsed.get("status", "unknown")
        artifacts["review_notes"] = parsed.get("notes", [])
        return artifacts

    # --------------------------------------------------------------------- #
    def run_case(self, case_context: Dict) -> Dict:
        """
        Convenience helper that runs plan → execute → review with guardrails.
        Includes Semantic Caching to bypass execution for identical cases.
        """
        case_signature = json.dumps(case_context, sort_keys=True)
        
        # 1. Check Cache
        if self.cache:
            cached_result = self.cache.get(case_signature)
            if cached_result:
                self._log(
                    task="Semantic Cache",
                    role="system",
                    model="internal",
                    prompt="Checking for cached results...",
                    result_preview="CACHE_HIT: Returning stored analysis."
                )
                return json.loads(cached_result)

        # 2. Normal Execution
        tasks = self.build_plan(case_context)
        artifacts = self.execute(tasks, artifacts={"case": case_context})
        outcome = self.review(artifacts)
        outcome["logs"] = [log.__dict__ for log in self.logs]
        
        # 3. Save to Cache
        if self.cache:
            self.cache.set(case_signature, json.dumps(outcome))
            
        return outcome

    def _log(self, task: str, role: str, model: str, prompt: str, result_preview: str):
        self.logs.append(
            AuditLogEntry(
                task=task,
                role=role,
                model=model,
                prompt=prompt,
                result_preview=result_preview,
            )
        )


