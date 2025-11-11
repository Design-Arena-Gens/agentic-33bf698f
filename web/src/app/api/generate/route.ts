import { NextRequest, NextResponse } from "next/server";
import Replicate from "replicate";

export const runtime = "nodejs";

const DEFAULT_PROMPT =
  "Anime style young man fixing a red motorcycle in a sunny street, detailed background, consistent character design, cinematic lighting";

type ModelIdentifier =
  | `${string}/${string}`
  | `${string}/${string}:${string}`;

const DEFAULT_MODEL_ID: ModelIdentifier = "luma-ai/dream-machine";
const MODEL_ID: ModelIdentifier =
  (process.env.REPLICATE_MODEL_ID as ModelIdentifier | undefined) ??
  DEFAULT_MODEL_ID;

const VALID_ASPECT_RATIOS = new Set(["16:9", "9:16", "1:1", "4:3"]);
const DEFAULT_ASPECT_RATIO = "16:9";
const DEFAULT_DURATION = 6;
const MIN_DURATION = 4;
const MAX_DURATION = 12;

let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  const token = process.env.REPLICATE_API_TOKEN;

  if (!token) {
    throw new Error(
      "Missing REPLICATE_API_TOKEN. Add it to your environment configuration."
    );
  }

  if (!replicateClient) {
    replicateClient = new Replicate({
      auth: token,
    });
  }

  return replicateClient;
}

type GenerateRequest = {
  prompt?: unknown;
  aspectRatio?: unknown;
  duration?: unknown;
};

function normalizePrompt(payload: GenerateRequest): string {
  if (typeof payload.prompt === "string" && payload.prompt.trim().length > 0) {
    return payload.prompt.trim();
  }

  return DEFAULT_PROMPT;
}

function normalizeAspectRatio(payload: GenerateRequest): string {
  if (
    typeof payload.aspectRatio === "string" &&
    VALID_ASPECT_RATIOS.has(payload.aspectRatio)
  ) {
    return payload.aspectRatio;
  }

  return DEFAULT_ASPECT_RATIO;
}

function normalizeDuration(payload: GenerateRequest): number {
  if (typeof payload.duration === "number" && Number.isFinite(payload.duration)) {
    return Math.max(
      MIN_DURATION,
      Math.min(MAX_DURATION, Math.round(payload.duration))
    );
  }

  return DEFAULT_DURATION;
}

function extractVideoUrl(output: unknown): string | null {
  if (!output) {
    return null;
  }

  if (typeof output === "string") {
    return output.startsWith("http") ? output : null;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const candidate = extractVideoUrl(item);
      if (candidate) {
        return candidate;
      }
    }
    return null;
  }

  if (typeof output === "object") {
    const data = output as Record<string, unknown>;

    if (typeof data.video === "string" && data.video.startsWith("http")) {
      return data.video;
    }

    if (typeof data.url === "string" && data.url.startsWith("http")) {
      return data.url;
    }

    if (data.output) {
      return extractVideoUrl(data.output);
    }
  }

  return null;
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as GenerateRequest;

    const prompt = normalizePrompt(payload);
    const aspectRatio = normalizeAspectRatio(payload);
    const duration = normalizeDuration(payload);

    const replicate = getReplicateClient();
    const result = await replicate.run(MODEL_ID, {
      input: {
        prompt,
        aspect_ratio: aspectRatio,
        duration,
      },
    });

    const videoUrl = extractVideoUrl(result);

    if (!videoUrl) {
      return NextResponse.json(
        { error: "Unable to read a video URL from the model output." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      videoUrl,
      prompt,
      aspectRatio,
      duration,
    });
  } catch (error) {
    console.error("[generate] Video generation failed:", error);

    const message =
      error instanceof Error
        ? error.message
        : "Video generation failed unexpectedly.";

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
