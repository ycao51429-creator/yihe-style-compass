import { env } from "cloudflare:workers";
import { handleAdvisorRequest, type AdvisorServices } from "../../../lib/advisor-service";

export async function POST(request: Request) { return handleAdvisorRequest(request, env as unknown as AdvisorServices); }
export async function OPTIONS(request: Request) { return handleAdvisorRequest(request, env as unknown as AdvisorServices); }
