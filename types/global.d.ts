type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: Record<string, string[]>;
  };
};

interface Payment {
  id: string;
  name: string;
  amount: string;
  status: "pending" | "approved" | "failed";
  date: string;
  description: string;
  author?: string;
};


type ErrorResponse = ActionResponse<undefined> & {
  success: false;
};

// API error response
type APIErrorResponse = NextResponse<ErrorResponds>;
// regular api response
type APIResponse<T = null> = NextResponse<SuccessResponse<T> | ErrorResponse>;

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}
// types for pagination
type PaginationSearchParams = {
  page?: number; // current page number
  pageSize?: number; // number of items per page
  // total?: number; // total number of items
  query?: string; // for search queries
  filter?: string; // for filtering items
  sort?: string; // for sorting items
}

type GetExpenseParams = {
  expensesId: string;
}