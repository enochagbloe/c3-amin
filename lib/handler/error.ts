import { NextResponse } from "next/server";
import { RequestError, ValidationError } from "@/lib/http.error";
import { ZodError } from "zod";
import logger from "../logger";

// Set a new Type
export type ResponseType = "api" | "server";

// Define a function
const formatResponse = (
  // Define the parameters
  responseType: ResponseType,
  status: number,
  message: string,
  errors?: Record<string, string[]> | undefined
) => {
  // A function that formats how the response should look like
  const responseContent = {
    success: false, // false by default because it has encountered an error
    error: {
      message,
      details: errors,
    },
  };

  return responseType === "api"
    ? NextResponse.json(responseContent, { status })
    : { status, ...responseContent };
};

const handleError = (error: unknown, responseType: ResponseType = "server") => {
  // Handle RequestError instances
  if (error instanceof RequestError) {
    logger.error(
      { err: error },
      `${responseType.toUpperCase()} Error: ${error.message}`
    );
    return formatResponse(
      responseType,
      error.statusCode,
      error.message,
      error.errors
    );
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const validationError = new ValidationError(
      error.flatten().fieldErrors as Record<string, string[]>
    );
    logger.error(
      { err: error },
      `Validation Error: ${validationError.message}`
    );
    return formatResponse(
      responseType,
      validationError.statusCode,
      validationError.message,
      validationError.errors
    );
  }

  // Handle general Error instances
  if (error instanceof Error) {
    // Log error with simplified logger
    logger.error(
      {
        message: error.message,
        name: error.name,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      "Request failed"
    );
    return formatResponse(responseType, 500, error.message);
  }

  // Handle unknown error types
  logger.error({ err: error }, "An unexpected error occurred");
  return formatResponse(responseType, 500, "Something went wrong");
};

export default handleError;
