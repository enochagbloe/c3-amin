export interface IChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}
export interface IChatSessionDoc {
  id: string;
  userId: string;
  organizationId: string | null;
  title: string;
  messages: IChatMessage[];
  isPinned: boolean;
  createdAt: Date;
  updatedAt: Date;
}
