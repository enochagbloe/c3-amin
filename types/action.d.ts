interface AuthCredentials {
  name?: string;
  username?: string;
  email: string;
  password: string;
  image?: string;
}

interface SignInWithOAuthParams {
  provider: "github" | "google";
  providerAccountId: string;
  user: {
    email: string;
    name: string;
    image: string;
    username: string;
  };
}

interface createBudgetExpense {
  // id: string;
  name: string;
  amount: float;
  date: Date;
  status?: "pending" | "approved" | "rejected";
  description?: string;
}


interface updateExpenseStatusParams {
  id: string;
  status?: "approved" | "rejected" | "pending";
}
interface getApprovedExpensesParams {
  id: string;
  status?: "approved" | "rejected" | "pending";
}
interface GetExpenseParams {
  expensesId: string;
}

interface User {
  id: string;
  staffId: string;
  name: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email: string;
  bio?: string;
  phone?: string;
  city?: string;
  status?: "active" | "inactive";
  role?: "admin" | "manager" | "member" | "viewer";
  image?: string;
  location?: string;
  portfolio?: string;
  reputation?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface getAllUsers {
  userId: string
}

interface MakePaymentParams {
  expenseId: string;
  amount: string;
  paymentMethod: "cash" | "bank_transfer" | "mobile_payment";
  // Add other relevant fields as needed
}

// export interface UpdateExpenseParams {
//   id: string
//   name?: string
//   amount?: string
//   date?: Date
//   status?: "pending" | "rejected" | "success"
//   description?: string
// }


// Represents a single custom field value
interface CustomFieldValue {
  fieldId?: string;       // Existing custom field ID
  name?: string;          // Inline field name when creating new
  type?: "TEXT" | "NUMBER" | "DATE" | "SELECT" | "TOGGLE"; // Inline field type
  required?: boolean;
  options?: string[];     // For SELECT when creating inline
  value: string | number | boolean | Date; // value entered by the user
}

// Main income interface
 interface CreateIncome {
  id?: string;
  name: string;     
  amount: float;
  source: string;
  description?: string;
  date: Date;
  customFields?: CustomFieldValue[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface getAllIncome{
  incomeId: string;
}
