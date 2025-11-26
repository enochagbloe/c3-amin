/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import multer from "multer";
import csv from "csv-parser";
import fs from "fs";
import path from "path";
import handleError from "@/lib/handler/error";
import { PrismaClient } from '@/lib/generated/prisma'

const prisma = new PrismaClient();

// Temp folder for uploaded files
const upload = multer({ dest: "uploads/" });

// Default mapping suggestions
const DEFAULT_FIELD_MAP: Record<string, string[]> = {
  name: ["name", "title", "expense", "transactionname"],
  amount: ["amount", "price", "cost", "value"],
  date: ["date", "timestamp", "created_at", "time"],
  status: ["status", "state"],
  author: ["author", "user", "staff", "email"],
  description: ["description", "notes", "optionalnotes", "note"],
};

// Helper to auto-map headers
function mapHeaders(headers: string[]) {
  const map: Record<string, string> = {};
  for (const key in DEFAULT_FIELD_MAP) {
    const found = headers.find((h) =>
      DEFAULT_FIELD_MAP[key].some((alias) => alias.toLowerCase() === h.toLowerCase())
    );
    if (found) map[key] = found;
  }
  return map;
}

// Next.js route handler
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

  // Save the uploaded file temporarily
  const tempFilePath = path.join(process.cwd(), "uploads", file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  fs.writeFileSync(tempFilePath, buffer);

  const rows: any[] = [];

  // Parse CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(tempFilePath)
      .pipe(csv())
      .on("data", (row) => rows.push(row))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  // Auto-map headers
  const headers = Object.keys(rows[0] || {});
  const map = mapHeaders(headers);

  const insertedRows = [];

  for (const row of rows) {
    try {
      const name = row[map.name];
      const amountRaw = row[map.amount];
      const dateRaw = row[map.date];
      const status = row[map.status] || "pending";
      const author = row[map.author] || "unknown";
      const description = row[map.description] || null;

      const amount = Number(amountRaw);
      const date = new Date(dateRaw);
      if (!name || isNaN(amount) || isNaN(date.getTime())) continue;

      const inserted = await prisma.expenseTracker.create({
        data: { name, amount: String(amount), date, status, author, description },
      });

      insertedRows.push(inserted);
    } catch (error) {
      return handleError(error, "api") as APIErrorResponse
        }
  } 

  fs.unlinkSync(tempFilePath); // delete file

  return NextResponse.json(insertedRows);
};
