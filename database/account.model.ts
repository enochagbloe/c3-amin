import type { Account } from '@/lib/generated/prisma';
export type IAccount = Omit<Account, 'id' | 'createdAt' | 'updatedAt'>;
export type IAccountDoc = Account;
