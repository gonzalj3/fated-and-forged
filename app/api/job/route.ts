import { NextResponse } from "next/server";
import { arcadeRequest, getProduct } from "@/lib/arcade";

type Job = { jobId: string; status: "running" | "succeeded" | "failed"; result: { productId?: string } | null; error: { message: string } | null };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jobId = searchParams.get("jobId") || "";
  if (!jobId || jobId.length > 128) return NextResponse.json({ error: "Invalid job" }, { status: 400 });
  try {
    const job = await arcadeRequest<Job>("/jobs/get", { jobId });
    if (job.status !== "succeeded" || !job.result?.productId) return NextResponse.json(job);
    const product = await getProduct(job.result.productId);
    return NextResponse.json({ ...job, product });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not read the design" }, { status: 502 });
  }
}
