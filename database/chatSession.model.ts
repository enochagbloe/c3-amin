import { model, models, Schema, Document, Types } from "mongoose";

// Message within a chat session
export interface IChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Chat Session interface
export interface IChatSession {
  userId: Types.ObjectId;
  organizationId?: Types.ObjectId;
  title: string;
  messages: IChatMessage[];
  isPinned: boolean;
}

export interface IChatSessionDoc extends IChatSession, Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Message sub-schema
const ChatMessageSchema = new Schema<IChatMessage>(
  {
    role: { 
      type: String, 
      enum: ["user", "assistant"], 
      required: true 
    },
    content: { 
      type: String, 
      required: true 
    },
    timestamp: { 
      type: Date, 
      default: Date.now 
    },
  },
  { _id: true } // Generate _id for each message
);

// Chat Session schema
const ChatSessionSchema = new Schema<IChatSession>(
  {
    userId: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true,
      index: true 
    },
    organizationId: { 
      type: Schema.Types.ObjectId, 
      ref: "Organization",
      index: true 
    },
    title: { 
      type: String, 
      required: true,
      default: "New Chat" 
    },
    messages: {
      type: [ChatMessageSchema],
      default: []
    },
    isPinned: { 
      type: Boolean, 
      default: false 
    },
  },
  { timestamps: true }
);

// Compound index for efficient querying
ChatSessionSchema.index({ userId: 1, organizationId: 1, updatedAt: -1 });

const ChatSession = models?.ChatSession || model<IChatSession>("ChatSession", ChatSessionSchema);

export default ChatSession;
