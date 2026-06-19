// Seed ResearchSource + ResearchChunk from research/corpus.json.
// Run from frontend/:  NODE_OPTIONS=--use-system-ca node scripts/seed-research.mjs

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PrismaClient } from "@prisma/client";

const __dirname = dirname(fileURLToPath(import.meta.url));
const corpusPath = join(__dirname, "..", "..", "research", "corpus.json");
const corpus = JSON.parse(readFileSync(corpusPath, "utf8"));

const prisma = new PrismaClient();

async function main() {
  let sources = 0;
  let chunks = 0;
  for (const entry of corpus) {
    const source = await prisma.researchSource.upsert({
      where: { slug: entry.slug },
      update: {
        title: entry.title,
        authors: entry.authors,
        year: entry.year ?? null,
        tags: entry.tags ?? [],
        summary: entry.summary,
      },
      create: {
        slug: entry.slug,
        title: entry.title,
        authors: entry.authors,
        year: entry.year ?? null,
        tags: entry.tags ?? [],
        summary: entry.summary,
      },
    });
    sources += 1;

    // Replace chunks for an idempotent reseed.
    await prisma.researchChunk.deleteMany({ where: { sourceId: source.id } });
    for (const claim of entry.claims) {
      await prisma.researchChunk.create({
        data: { sourceId: source.id, content: claim },
      });
      chunks += 1;
    }
  }
  console.log(`Seeded ${sources} sources, ${chunks} chunks.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
