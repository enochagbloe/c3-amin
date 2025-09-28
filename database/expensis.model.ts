import { model, models, Schema, Document } from "mongoose";

export interface IExpense {
  name: string;
  amount: number ;
  status: "pending" | "processing" | "success";
  date: string;
  author: string;
  description?: string;
}

export interface IExpenseDoc extends IExpense, Document {}
const ExpenseSchema = new Schema<IExpense>(
  {
    name: { type: String, required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: ["pending", "processing", "success"], required: true },
    date: { type: String, required: true },
    author: { type: String, required: true },
    description: { type: String, required: false },
  },
  { timestamps: true }
);

const ExpensesTracker = models?.Expense || model<IExpense>("Expense", ExpenseSchema);

export default ExpensesTracker;
