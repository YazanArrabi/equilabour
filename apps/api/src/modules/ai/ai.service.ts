import { z } from "zod";

import { AIAnalysisStatus } from "../../../generated/prisma/client.js";
import { anthropic } from "../../lib/anthropic.js";
import { prisma } from "../../lib/prisma.js";

// ─── Prompt ───────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are an expert recruiter and skills analyst for EquiLabour, a professional job-matching platform.

Analyze the provided worker profile and output ONLY a valid JSON object — no prose, no markdown, no code fences.

The JSON must exactly match this structure:
{
  "skillSummary": "<concise 1-2 sentence summary of skills and experience>",
  "skillRating": <integer 0-10>,
  "topSkills": ["<skill>", ...],
  "matchRecommendations": {
    "suggestedRoles": ["<role>", ...],
    "suggestedIndustries": ["<industry>", ...],
    "notes": "<string>"
  },
  "candidateRecommendations": {
    "strengths": ["<strength>", ...],
    "areasForImprovement": ["<area>", ...],
    "profileCompletenessScore": <integer 0-100>
  }
}

Rules:
- Output ONLY the JSON object, nothing else
- Use [] for any list field when no data is available
- Use "" for string fields when no data is available
- skillRating: 0=no data, 5=average, 10=exceptional
- profileCompletenessScore: 0=empty profile, 100=fully complete
- topSkills: at most 5 items`;

// ─── Output schema ────────────────────────────────────────────────────────────

const AIOutputSchema = z.object({
  skillSummary: z.string(),
  skillRating: z.number().int().min(0).max(10),
  topSkills: z.array(z.string()),
  matchRecommendations: z.object({
    suggestedRoles: z.array(z.string()),
    suggestedIndustries: z.array(z.string()),
    notes: z.string(),
  }),
  candidateRecommendations: z.object({
    strengths: z.array(z.string()),
    areasForImprovement: z.array(z.string()),
    profileCompletenessScore: z.number().int().min(0).max(100),
  }),
});

type AIOutput = z.infer<typeof AIOutputSchema>;

// ─── Fallback defaults ────────────────────────────────────────────────────────

const FAILED_DEFAULTS: AIOutput = {
  skillSummary: "",
  skillRating: 0,
  topSkills: [],
  matchRecommendations: {
    suggestedRoles: [],
    suggestedIndustries: [],
    notes: "",
  },
  candidateRecommendations: {
    strengths: [],
    areasForImprovement: [],
    profileCompletenessScore: 0,
  },
};

// ─── Service ──────────────────────────────────────────────────────────────────

export async function analyzeWorkerProfile(
  workerProfileId: string,
): Promise<void> {
  // Step 1 — fetch profile
  const profile = await prisma.workerProfile.findUnique({
    where: { id: workerProfileId },
    select: {
      fullName: true,
      location: true,
      skills: true,
      yearsOfExperience: true,
      workExperienceSummary: true,
      pastJobTitles: true,
      employmentHistory: true,
      files: {
        select: { type: true, originalFilename: true, mimeType: true },
      },
    },
  });

  if (!profile) {
    return;
  }

  // Step 2 — build user message
  const filesText =
    profile.files.length > 0
      ? profile.files
          .map((f) => `- ${f.type}: ${f.originalFilename} (${f.mimeType})`)
          .join("\n")
      : "none";

  const userMessage = `Worker Profile:
Name: ${profile.fullName}
Location: ${profile.location ?? "not specified"}
Years of experience: ${profile.yearsOfExperience}
Skills: ${profile.skills.length > 0 ? profile.skills.join(", ") : "none listed"}
Past job titles: ${profile.pastJobTitles.length > 0 ? profile.pastJobTitles.join(", ") : "none listed"}
Work experience summary: ${profile.workExperienceSummary ?? "not provided"}
Employment history: ${profile.employmentHistory ?? "not provided"}

Uploaded documents:
${filesText}`;

  // Steps 3–5 — call AI, parse, write success result
  try {
    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userMessage }],
    });

    const block = response.content[0];
    if (!block) {
      throw new Error("AI response returned no content blocks.");
    }
    if (block.type !== "text") {
      throw new Error(`Unexpected content block type: ${block.type}`);
    }

    let rawText = block.text.trim();
    if (rawText.startsWith("```")) {
      rawText = rawText.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
    }
    const parsed = JSON.parse(rawText) as unknown;
    const validated = AIOutputSchema.parse(parsed);

    await prisma.aIAnalysisResult.create({
      data: {
        workerProfileId,
        status: AIAnalysisStatus.fresh,
        lastAnalyzedAt: new Date(),
        skillSummary: validated.skillSummary,
        skillRating: validated.skillRating,
        topSkills: validated.topSkills,
        matchRecommendations: validated.matchRecommendations,
        candidateRecommendations: validated.candidateRecommendations,
      },
    });
  } catch (error) {
    // Step 6 — on any error, write a failed record and do not throw
    console.error(
      `[ai.service] analyzeWorkerProfile failed for ${workerProfileId}:`,
      error,
    );

    try {
      await prisma.aIAnalysisResult.create({
        data: {
          workerProfileId,
          status: AIAnalysisStatus.failed,
          lastAnalyzedAt: new Date(),
          skillSummary: FAILED_DEFAULTS.skillSummary,
          skillRating: FAILED_DEFAULTS.skillRating,
          topSkills: FAILED_DEFAULTS.topSkills,
          matchRecommendations: FAILED_DEFAULTS.matchRecommendations,
          candidateRecommendations: FAILED_DEFAULTS.candidateRecommendations,
        },
      });
    } catch (fallbackError) {
      console.error(
        `[ai.service] fallback DB write also failed for ${workerProfileId}:`,
        fallbackError,
      );
    }
  }
}
