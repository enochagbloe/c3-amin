import type { User } from '@/lib/generated/prisma';
export type IUser = Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'reputation'> & { reputation?: number };
export type IUserDoc = User;
