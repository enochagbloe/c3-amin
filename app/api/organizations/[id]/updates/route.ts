import prisma from "@/lib/prisma";
import { requestContext } from "@/lib/budget-requests/access";
import { requestResponse } from "@/lib/budget-requests/http";
import { organizationUpdates } from "@/lib/organizations/releases";
import { z } from "zod";
type Context = { params: Promise<{ id: string }> };
export async function GET(_: Request, { params }: Context) { return requestResponse(async () => { const access = await requestContext((await params).id); const read = await prisma.organizationUpdateRead.findMany({ where: { userId: access.userId, organizationId: access.organizationId }, select: { updateId: true } }); return { cards: organizationUpdates, read: read.map(row => row.updateId) }; }); }
export async function POST(request: Request, { params }: Context) { return requestResponse(async () => { const access = await requestContext((await params).id); const { updateId } = z.object({ updateId: z.string().refine(value => organizationUpdates.some(card => card.id === value), "Unknown update") }).strict().parse(await request.json()); await prisma.organizationUpdateRead.upsert({ where: { userId_organizationId_updateId: { userId: access.userId, organizationId: access.organizationId, updateId } }, create: { userId: access.userId, organizationId: access.organizationId, updateId }, update: {} }); return { read: true }; }); }
