"use server";

import { auth } from '@/auth';
import prisma from '@/lib/prisma';
import { Prisma } from '@/lib/generated/prisma';
import type { IChatSessionDoc } from '@/database/chatSession.model';
import handleError from '../handler/error';
import { NotFoundError, UnauthorizedError } from '../http.error';
import { verifyOrganizationMember } from '../utils/authorization';
import { z } from 'zod';

const organizationIdSchema = z.string().uuid().optional();
const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(100000) });
const include = { messages: { orderBy: { timestamp: 'asc' as const } } };
type StoredSession = Prisma.ChatSessionGetPayload<{ include: typeof include }>;
function serialize(session: StoredSession): IChatSessionDoc {
  return JSON.parse(JSON.stringify(session));
}
function titleFor(content: string) {
  const title = content.trim().replace(/\n/g, ' ');
  return title.length > 40 ? title.slice(0, 40).trim() + '...' : title;
}
async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) throw new UnauthorizedError();
  return session.user.id;
}
async function ownedSession(id: string, userId: string) {
  z.string().uuid().parse(id);
  const session = await prisma.chatSession.findFirst({ where: { id, userId }, include });
  if (!session) throw new NotFoundError('Chat session not found');
  if (session.organizationId) await verifyOrganizationMember(userId, session.organizationId);
  return session;
}

export async function getChatSessions(params: { organizationId?: string } = {}): Promise<ActionResponse<IChatSessionDoc[]>> {
  try {
    const userId = await currentUser();
    const organizationId = organizationIdSchema.parse(params.organizationId);
    if (organizationId) await verifyOrganizationMember(userId, organizationId);
    const sessions = await prisma.chatSession.findMany({
      where: { userId, organizationId: organizationId ?? null },
      orderBy: [{ isPinned: 'desc' }, { updatedAt: 'desc' }], include,
    });
    return { success: true, data: sessions.map(serialize) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function createChatSession(params: { title?: string; organizationId?: string } = {}): Promise<ActionResponse<IChatSessionDoc>> {
  try {
    const userId = await currentUser();
    const organizationId = organizationIdSchema.parse(params.organizationId);
    if (organizationId) await verifyOrganizationMember(userId, organizationId);
    const title = z.string().min(1).max(200).default('New Chat').parse(params.title);
    const session = await prisma.chatSession.create({ data: { userId, organizationId, title }, include });
    return { success: true, data: serialize(session) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function createSessionWithMessage(params: { role: 'user' | 'assistant'; content: string; organizationId?: string }): Promise<ActionResponse<IChatSessionDoc>> {
  try {
    const userId = await currentUser();
    const organizationId = organizationIdSchema.parse(params.organizationId);
    if (organizationId) await verifyOrganizationMember(userId, organizationId);
    const message = messageSchema.parse(params);
    const session = await prisma.chatSession.create({ data: {
      userId, organizationId, title: message.role === 'user' ? titleFor(message.content) : 'New Chat',
      messages: { create: message },
    }, include });
    return { success: true, data: serialize(session) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function addMessageToSession(params: { sessionId: string; role: 'user' | 'assistant'; content: string }): Promise<ActionResponse<IChatSessionDoc>> {
  try {
    const userId = await currentUser();
    await ownedSession(params.sessionId, userId);
    const message = messageSchema.parse(params);
    const session = await prisma.$transaction(async tx => {
      const firstUserMessage = message.role === 'user' && (await tx.chatMessage.count({
        where: { sessionId: params.sessionId, role: 'user' },
      })) === 0;
      return tx.chatSession.update({ where: { id: params.sessionId, userId }, data: {
        ...(firstUserMessage ? { title: titleFor(message.content) } : {}),
        updatedAt: new Date(), messages: { create: message },
      }, include });
    });
    return { success: true, data: serialize(session) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function updateChatSession(params: { sessionId: string; title?: string; isPinned?: boolean }): Promise<ActionResponse<IChatSessionDoc>> {
  try {
    const userId = await currentUser();
    await ownedSession(params.sessionId, userId);
    const data = z.object({ title: z.string().min(1).max(200).optional(), isPinned: z.boolean().optional() }).parse(params);
    const session = await prisma.chatSession.update({ where: { id: params.sessionId, userId }, data, include });
    return { success: true, data: serialize(session) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function deleteChatSession(params: { sessionId: string }): Promise<ActionResponse<{ deleted: boolean }>> {
  try {
    const userId = await currentUser();
    await ownedSession(params.sessionId, userId);
    await prisma.chatSession.delete({ where: { id: params.sessionId, userId } });
    return { success: true, data: { deleted: true } };
  } catch (error) { return handleError(error) as ErrorResponse; }
}

export async function getChatSessionById(params: { sessionId: string }): Promise<ActionResponse<IChatSessionDoc>> {
  try {
    return { success: true, data: serialize(await ownedSession(params.sessionId, await currentUser())) };
  } catch (error) { return handleError(error) as ErrorResponse; }
}
