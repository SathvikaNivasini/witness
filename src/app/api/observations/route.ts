import { connection } from "next/server";
import { getSupabaseConfiguration } from "@/lib/server/supabase";
import { submitObservation } from "@/lib/server/submit-observation";

const headers = { "Cache-Control": "no-store" };

export async function GET() {
  await connection();
  return Response.json(
    {
      configured: Boolean(getSupabaseConfiguration()),
      maxNotesLength: 500,
      timing: "Now",
      account: "guest",
    },
    { headers },
  );
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return Response.json(
      {
        success: false,
        outcome: "not-sent",
        error: "Send the observation as JSON.",
      },
      { status: 415, headers },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      {
        success: false,
        outcome: "not-sent",
        error: "An observation is required.",
      },
      { status: 400, headers },
    );
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 8192) {
        await reader.cancel();
        return Response.json(
          {
            success: false,
            outcome: "not-sent",
            error:
              "The submission is too large. Photos stay in your local notebook.",
          },
          { status: 413, headers },
        );
      }
      chunks.push(value);
    }
    const result = await submitObservation(
      JSON.parse(Buffer.concat(chunks).toString("utf8")),
    );
    const status = result.success
      ? 201
      : result.outcome === "not-sent"
        ? 400
        : result.outcome === "rejected"
          ? 422
          : 503;
    return Response.json(result, { status, headers });
  } catch {
    return Response.json(
      {
        success: false,
        outcome: "not-sent",
        error: "The submission JSON could not be read.",
      },
      { status: 400, headers },
    );
  } finally {
    reader.releaseLock();
  }
}
