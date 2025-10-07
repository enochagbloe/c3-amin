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
  amount: string;
  date: Date;
  status?: "pending" | "approved" | "failed";
  description?: string;
}

// export interface UpdateExpenseParams {
//   id: string
//   name?: string
//   amount?: string
//   date?: Date
//   status?: "pending" | "failed" | "success"
//   description?: string
// }
