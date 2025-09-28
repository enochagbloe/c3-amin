type ActionResponse<T = null> = {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    details: Record<string, string[]>;
  };
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
