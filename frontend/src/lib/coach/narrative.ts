// LLM-written coaching note, grounded in retrieved research. The model is given
// ONLY the claims we retrieved and is told to cite only those, so the citation
// guarantee holds. Returns null when AI is unavailable (caller shows the
// rule-based plan alone).

import { chatComplete } from "@/lib/ai/openrouter";

export interface NarrativeEvidence {
  claim: string;
  authors: string;
  year: number | null;
}

export interface NarrativeInput {
  focus: string;
  recommendations: { title: string; detail: string }[];
  evidence: NarrativeEvidence[];
}

export async function buildCoachNarrative(
  input: NarrativeInput,
): Promise<{ text: string; model: string } | null> {
  const evidenceBlock = input.evidence
    .map((e) => `- "${e.claim}" — ${e.authors}${e.year ? ` ${e.year}` : ""}`)
    .join("\n");
  const planBlock = input.recommendations
    .map((r) => `- ${r.title}: ${r.detail}`)
    .join("\n");

  const system =
    "You are STRATUM's strength coach. Write a short, specific, encouraging note " +
    "(2-4 sentences) to the lifter about this week's plan. You may ONLY cite the " +
    "research provided below, referenced inline as (Authors Year). Never invent " +
    "studies, statistics, or numbers that aren't given. Plain prose — no headings " +
    "or bullet points.";

  const user = `Goal focus: ${input.focus}

This week's plan:
${planBlock}

Research you may cite (and nothing else):
${evidenceBlock}`;

  const res = await chatComplete(
    [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    { temperature: 0.5, maxTokens: 320 },
  );
  if (!res) return null;
  return { text: res.content, model: res.model };
}
