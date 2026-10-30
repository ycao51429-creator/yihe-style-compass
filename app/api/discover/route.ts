import { env } from "cloudflare:workers";
import { discover, type Services } from "../../../lib/discovery";
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return Response.json({ message: "请从本应用发起查询。" }, { status: 403 });
  if (!request.headers.get("content-type")?.includes("application/json")) return Response.json({ message: "请使用 JSON 请求。" }, { status: 415 });
  try {
    if (Number(request.headers.get("content-length")) > 4096) return Response.json({ message: "请求内容过长。" }, { status: 413 });
    const text = await request.text(); if (text.length > 4096) return Response.json({ message: "请求内容过长。" }, { status: 413 });
    const result = await discover(JSON.parse(text), env as unknown as Services);
    return Response.json(result.data, { status: result.status, headers: { "Cache-Control": "no-store" } });
  } catch { return Response.json({ message: "请求格式有误，请检查后重试。" }, { status: 400 }); }
}
