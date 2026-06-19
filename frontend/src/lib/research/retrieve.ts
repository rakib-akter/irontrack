// Retrieval over the research corpus. Lexical (keyword + tag) scoring today;
// the seam where pgvector embeddings (via FastAPI) can slot in later. Callers
// depend only on: given a query, return the most relevant claims + the source
// metadata needed to cite them. The coach may cite ONLY what this returns, so
// citations can never be fabricated.

import { prisma } from "@/lib/prisma";

export interface Citation {
  slug: string;
  title: string;
  authors: string;
  year: number | null;
}

export interface RetrievedChunk {
  content: string;
  citation: Citation;
  score: number;
}

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "is", "are",
  "with", "your", "you", "how", "what", "should", "more", "than", "that",
  "this", "it", "be", "at", "by", "per", "vs",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

/** Retrieve the top-k research claims relevant to a query string. */
export async function retrieve(
  query: string,
  k = 3,
): Promise<RetrievedChunk[]> {
  const terms = tokenize(query);
  if (terms.length === 0) return [];

  const chunks = await prisma.researchChunk.findMany({
    include: { source: true },
  });

  const scored = chunks.map((c) => {
    const content = c.content.toLowerCase();
    const tags = c.source.tags.map((t) => t.toLowerCase());
    let score = 0;
    for (const term of terms) {
      if (content.includes(term)) score += 1;
      if (tags.some((tag) => tag.includes(term) || term.includes(tag))) {
        score += 0.75;
      }
    }
    return {
      content: c.content,
      score,
      citation: {
        slug: c.source.slug,
        title: c.source.title,
        authors: c.source.authors,
        year: c.source.year,
      },
    };
  });

  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, k);
}

/** Retrieve one best-matching claim (or null) — convenience for a single cite. */
export async function retrieveOne(query: string): Promise<RetrievedChunk | null> {
  const [top] = await retrieve(query, 1);
  return top ?? null;
}
