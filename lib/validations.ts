import { z } from "zod";

export const SignInSchema = z.object({
  email: z
    .string()
    .min(1, { message: "Email is required" })
    .email({ message: "Invalid email address" }),

  password: z
    .string()
    .min(6, { message: "Password must be 6" })
    .max(100, { message: "Password cannot exceed 100 characters" }),
});

export const SignUpSchema = z.object({
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." })
    .max(30, { message: "Username cannot exceed 30 characters." })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: "Username can only contain letters, numbers, and underscores.",
    }),

  name: z
    .string()
    .min(1, { message: "Name is required." })
    .max(50, { message: "Name cannot exceed 50 characters." })
    .regex(/^[a-zA-Z\s]+$/, {
      message: "Name can only contain letters and spaces.",
    }),
  email: z
    .string()
    .min(1, { message: "Email is required." })
    .email({ message: "Please provide a valid email address." }),

  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    }),
});

export const UserSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }),
  username: z
    .string()
    .min(3, { message: "Username must be at least 3 characters long." }),
  email: z.string().email({ message: "Please provide a valid email address." }),
  bio: z.string().optional(),
  Image: z
    .string()
    .url({ message: "Please provide a valid image URL." })
    .optional(),
  location: z.string().optional(),
  portfolio: z
    .string()
    .url({ message: "Please provide a valid portfolio URL." })
    .optional(),
  reputation: z.number().optional(),
});

export const AccountSchema = z.object({
  userId: z.string().min(1, { message: "User ID is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  image: z.string().url({ message: "Please provide a valid URL." }).optional(),
  password: z
    .string()
    .min(6, { message: "Password must be at least 6 characters long." })
    .max(100, { message: "Password cannot exceed 100 characters." })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter.",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter.",
    })
    .regex(/[0-9]/, { message: "Password must contain at least one number." })
    .regex(/[^a-zA-Z0-9]/, {
      message: "Password must contain at least one special character.",
    })
    .optional(),
  provider: z.string().min(1, { message: "Provider is required." }),
  providerAccountId: z
    .string()
    .min(1, { message: "Provider Account ID is required." }),
});

export const ExpenseTrackerInputSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Name must be at least 2 characters." })
    .max(100, { message: "Name cannot exceed 100 characters." }),

  amount: z.string().min(1, "Amount is required"),
  // .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
  //   message: "Amount must be a positive number.",
  // })
  // .transform((val) => parseFloat(val))
  status: z.enum(["pending", "approved", "rejected"]).optional(),

  date: z.preprocess(
    (val) => {
      if (typeof val === "string") return new Date(val);
      return val;
    },
    z.date({
      message: "Date is required.",
    })
  ),

  description: z
    .string()
    .max(200, { message: "Description cannot exceed 200 characters." })
    .optional()
    .or(z.literal("")),
});

export const UpdateExpenseStatusSchema = z.object({
  id: z.string().min(1, "Expense ID is required"),
  status: z.enum(["approved", "rejected"], {
    message: "Status must be either 'approved' or 'rejected'",
  }),
});

export const PaginationSearchParamsSchema = z.object({
  page: z.number().min(1, { message: "Page must be at least 1." }).default(1),
  pageSize: z
    .number()
    .min(1, { message: "Page size must be at least 1." })
    .default(10),
  query: z.string().optional(),
  filter: z.string().optional(),
  sort: z.string().optional(),
});

export const GetExpenseSchema = z.object({
  expensesId: z.string().min(1, { message: "Expense ID is required." }),
});

/**
 * Payment Schema with Discriminated Union
 * This allows conditional validation based on payment method
 */

// Base fields that are common to both payment methods
const basePaymentFields = {
  date: z.preprocess(
    (val) => {
      if (typeof val === "string") return new Date(val);
      return val;
    },
    z.date({
      message: "Date is required.",
    })
  ),
  description: z
    .string()
    .max(500, { message: "Description cannot exceed 500 characters." })
    .optional()
    .or(z.literal("")),
};

/**
 * Mobile Money Payment Schema
 */
export const MobileMoneyPaymentSchema = z.object({
  paymentMethod: z.literal('mobile'),
  mobileNetwork: z.string().min(1, { message: "Please select a network" }),
  recipientName: z
    .string()
    .min(2, { message: "Recipient name must be at least 2 characters" })
    .max(100, { message: "Recipient name cannot exceed 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: "Name can only contain letters, spaces, hyphens, and apostrophes",
    }),
  phoneNumber: z
    .string()
    .regex(/^0\d{9}$/, {
      message: "Please enter a valid 10-digit phone number starting with 0",
    }),
  ...basePaymentFields,
});

/**
 * Bank Transfer Payment Schema
 */
export const BankTransferPaymentSchema = z.object({
  paymentMethod: z.literal('bank'),
  accountName: z
    .string()
    .min(2, { message: "Account name must be at least 2 characters" })
    .max(100, { message: "Account name cannot exceed 100 characters" })
    .regex(/^[a-zA-Z\s'-]+$/, {
      message: "Account name can only contain letters, spaces, hyphens, and apostrophes",
    }),
  bankName: z.string().min(1, { message: "Please select a bank" }),
  accountNumber: z
    .string()
    .regex(/^\d{10,16}$/, {
      message: "Account number must be 10-16 digits",
    }),
  ...basePaymentFields,
});

/**
 * Combined Payment Schema using discriminated union
 * This is the main schema you'll pass to your ReusableDialog
 */
export const PaymentInputSchema = z.discriminatedUnion('paymentMethod', [
  MobileMoneyPaymentSchema,
  BankTransferPaymentSchema,
]);

/**
 * Type exports for TypeScript
 */
export type MobileMoneyPayment = z.infer<typeof MobileMoneyPaymentSchema>;
export type BankTransferPayment = z.infer<typeof BankTransferPaymentSchema>;
export type PaymentInput = z.infer<typeof PaymentInputSchema>;