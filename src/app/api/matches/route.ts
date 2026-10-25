import {
  compareObservation,
  matchingModel,
} from "@/lib/server/match-observation";

const MAX_BODY_BYTES = 8192;
const privateHeaders = { "Cache-Control": "no-store" };

export function GET() {
  return Response.json(
    { service: "Witness matching", status: "ok", ...matchingModel },
    { headers: privateHeaders },
  );
}

export async function POST(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  ) {
    return Response.json(
      { error: "Send the observation as JSON." },
      { status: 415, headers: privateHeaders },
    );
  }
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      { error: "An observation is required." },
      { status: 400, headers: privateHeaders },
    );
  try {
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        return Response.json(
          {
            error:
              "The observation is too large. Photos are not sent for matching.",
          },
          { status: 413, headers: privateHeaders },
        );
      }
      chunks.push(value);
    }
    const body = Buffer.concat(chunks).toString("utf8");
    const result = compareObservation(JSON.parse(body));
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof SyntaxError || error instanceof TypeError) {
      return Response.json(
        {
          error:
            error instanceof SyntaxError
              ? "The observation JSON could not be read."
              : error.message,
        },
        { status: 400, headers: privateHeaders },
      );
    }
    return Response.json(
      {
        error:
          "Matching is unavailable right now. Your saved note is unchanged. Please try again.",
      },
      { status: 503, headers: privateHeaders },
    );
  } finally {
    reader.releaseLock();
  }
}
