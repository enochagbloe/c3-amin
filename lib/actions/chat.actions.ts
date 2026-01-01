"use server";

import ChatSession, { IChatSessionDoc, IChatMessage } from "@/database/chatSession.model";
import action from "../handler/action";
import handleError from "../handler/error";
import { NotFoundError } from "../http.error";
import dbConnect from "../mongoose";
import mongoose from "mongoose";

// Types for the actions
interface CreateChatSessionParams {
  title?: string;
  organizationId?: string;
}

interface AddMessageParams {
  sessionId: string;
  role: "user" | "assistant";
  content: string;
}

interface UpdateSessionParams {
  sessionId: string;
  title?: string;
  isPinned?: boolean;
}

interface GetSessionsParams {
  organizationId?: string;
}

// Helper to generate title from first message
const generateTitle = (content: string): string => {
  const maxLength = 40;
  const cleaned = content.trim().replace(/\n/g, " ");
  if (cleaned.length <= maxLength) return cleaned;
  return cleaned.substring(0, maxLength).trim() + "...";
};

/**
 * Get all chat sessions for the current user (or organization)
 */
export async function getChatSessions(
  params: GetSessionsParams = {}
): Promise<ActionResponse<IChatSessionDoc[]>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { organizationId } = params;

  try {
    await dbConnect();

    const query: Record<string, unknown> = { userId };
    
    if (organizationId) {
      // Organization-specific chats
      query.organizationId = new mongoose.Types.ObjectId(organizationId);
    } else {
      // Personal chats: organizationId is null, undefined, or doesn't exist
      query.$or = [
        { organizationId: { $exists: false } },
        { organizationId: null }
      ];
    }

    const sessions = await ChatSession.find(query)
      .sort({ isPinned: -1, updatedAt: -1 })
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(sessions)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Create a new chat session
 */
export async function createChatSession(
  params: CreateChatSessionParams = {}
): Promise<ActionResponse<IChatSessionDoc>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { title = "New Chat", organizationId } = params;

  try {
    await dbConnect();

    const sessionData: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      title,
      messages: [],
      isPinned: false,
    };

    if (organizationId) {
      sessionData.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const newSession = await ChatSession.create(sessionData);

    return { success: true, data: JSON.parse(JSON.stringify(newSession)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/*Add a message to an existing chat session*/
export async function addMessageToSession(
  params: AddMessageParams
): Promise<ActionResponse<IChatSessionDoc>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { sessionId, role, content } = params;

  try {
    await dbConnect();

    const chatSession = await ChatSession.findOne({
      _id: sessionId,
      userId,
    });

    if (!chatSession) {
      throw new NotFoundError("Chat session not found");
    }

    // Add the new message
    chatSession.messages.push({
      role,
      content,
      timestamp: new Date(),
    });

    // Update title if this is the first user message
    const messagesArray = chatSession.messages as IChatMessage[];
    const userMessages = messagesArray.filter((m) => m.role === "user");
    if (role === "user" && userMessages.length === 1) {
      chatSession.title = generateTitle(content);
    }

    await chatSession.save();

    return { success: true, data: JSON.parse(JSON.stringify(chatSession)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Create a session and add the first message in one operation
 */
export async function createSessionWithMessage(
  params: { role: "user" | "assistant"; content: string; organizationId?: string }
): Promise<ActionResponse<IChatSessionDoc>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { role, content, organizationId } = params;

  try {
    await dbConnect();

    const title = role === "user" ? generateTitle(content) : "New Chat";

    const sessionData: Record<string, unknown> = {
      userId: new mongoose.Types.ObjectId(userId),
      title,
      messages: [
        {
          role,
          content,
          timestamp: new Date(),
        },
      ],
      isPinned: false,
    };

    if (organizationId) {
      sessionData.organizationId = new mongoose.Types.ObjectId(organizationId);
    }

    const newSession = await ChatSession.create(sessionData);

    return { success: true, data: JSON.parse(JSON.stringify(newSession)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Update a chat session (title, pinned status)
 */
export async function updateChatSession(
  params: UpdateSessionParams
): Promise<ActionResponse<IChatSessionDoc>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { sessionId, title, isPinned } = params;

  try {
    await dbConnect();

    const updateData: Record<string, unknown> = {};
    if (title !== undefined) updateData.title = title;
    if (isPinned !== undefined) updateData.isPinned = isPinned;

    const chatSession = await ChatSession.findOneAndUpdate(
      { _id: sessionId, userId },
      { $set: updateData },
      { new: true }
    );

    if (!chatSession) {
      throw new NotFoundError("Chat session not found");
    }

    return { success: true, data: JSON.parse(JSON.stringify(chatSession)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Delete a chat session
 */
export async function deleteChatSession(
  params: { sessionId: string }
): Promise<ActionResponse<{ deleted: boolean }>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { sessionId } = params;

  try {
    await dbConnect();

    const result = await ChatSession.findOneAndDelete({
      _id: sessionId,
      userId,
    });

    if (!result) {
      throw new NotFoundError("Chat session not found");
    }

    return { success: true, data: { deleted: true } };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}

/**
 * Get a single chat session by ID
 */
export async function getChatSessionById(
  params: { sessionId: string }
): Promise<ActionResponse<IChatSessionDoc>> {
  const validationResult = await action({
    params,
    authorize: true,
    useMongo: true,
  });

  if (validationResult instanceof Error) {
    return handleError(validationResult) as ErrorResponse;
  }

  const { session } = validationResult;
  const userId = session?.user?.id;
  const { sessionId } = params;

  try {
    await dbConnect();

    const chatSession = await ChatSession.findOne({
      _id: sessionId,
      userId,
    }).lean();

    if (!chatSession) {
      throw new NotFoundError("Chat session not found");
    }

    return { success: true, data: JSON.parse(JSON.stringify(chatSession)) };
  } catch (error) {
    return handleError(error) as ErrorResponse;
  }
}
