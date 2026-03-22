/**
 * rag.service.js — Public Facade
 * ──────────────────────────────────────────────────────────────────────────────
 * This module is the single import point for RAG operations across the codebase.
 * It delegates to the new modular RAG pipeline:
 *
 *   ingestDocument  → ingestionService.js  (extract → chunk → embed → store)
 *   semanticSearch  → retrievalService.js  (classify → embed → vector search)
 *   retrieve        → retrievalService.js  (full structured retrieval object)
 *
 * Existing callers (ai.service.js, cr.service.js) continue to work unchanged
 * via the backward-compatible semanticSearch() shim in retrievalService.js.
 * ──────────────────────────────────────────────────────────────────────────────
 */

export { ingestDocument, listDocuments, deleteDocument } from './ingestionService.js';
export { retrieve, semanticSearch } from './retrievalService.js';
