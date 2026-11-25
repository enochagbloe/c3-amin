import { z } from "zod";

export const requestSchema = z.object({
  title: z.string().trim().min(3).max(150),
  description: z.string().trim().min(10).max(5000),
  amount: z
    .string()
    .regex(
      /^\d{1,12}(\.\d{1,2})?$/,
      "Enter a positive amount with at most two decimal places",
    )
    .refine((value) => Number(value) > 0, "Amount must be greater than zero"),
  currency: z.enum(["USD", "GHS", "GBP", "EUR"]),
  neededBy: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .refine((value) => {
      const date = new Date(`${value}T00:00:00Z`);
      return (
        !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value
      );
    }, "Enter a valid date")
    .optional(),
});

export const approvalSettingsSchema = z
  .object({
    reviewerId: z.string().uuid(),
    pastorId: z.string().uuid(),
  })
  .refine((data) => data.reviewerId !== data.pastorId, {
    message: "The reviewer and final pastor must be different people",
    path: ["pastorId"],
  });

export const decisionSchema = z
  .object({
    decision: z.enum(["APPROVED", "REJECTED"]),
    comment: z.string().trim().max(2000).default(""),
  })
  .refine((data) => data.decision !== "REJECTED" || data.comment.length > 0, {
    message: "Please explain why this request is being rejected",
    path: ["comment"],
  });

export const listSchema = z.object({
  scope: z.enum(["mine", "inbox", "all"]).default("mine"),
  page: z.coerce.number().int().min(1).max(100000).default(1),
});
