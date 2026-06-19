# research/

The curated research corpus that powers STRATUM's **citation engine**. The coach
may only cite sources that are retrieved from this corpus, so it can never
fabricate a reference.

## Files
- `corpus.json` — array of research entries: `{ slug, title, authors, year,
  tags[], summary, claims[] }`. Each `claim` is a citable, paraphrased finding.

## Ingestion
`frontend/scripts/seed-research.mjs` loads the corpus into Postgres:
- one `ResearchSource` per entry (the citation metadata),
- one `ResearchChunk` per claim (the retrievable text).

```bash
cd frontend
NODE_OPTIONS=--use-system-ca node scripts/seed-research.mjs
```

## Retrieval
Today retrieval is **lexical** (keyword/tag scoring over chunks) in
`frontend/src/lib/research`. The architecture leaves a clean seam to upgrade to
**pgvector embeddings** served by the FastAPI backend without changing callers:
they depend only on "retrieve top-k chunks + their source for citation."

> The entries paraphrase well-established findings from the strength-science
> literature (e.g. Schoenfeld, Morton, Helms). Keep authors/years accurate when
> adding entries — accuracy of citations is the whole point.
