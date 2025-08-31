export const ERROR_DESCRIPTIONS: Record<string, string> = {
  AUTH_401: "Unauthorized. Please log in again.",
  AUTH_403: "Forbidden. Your account does not have access.",
  AUTH_422: "Validation failed. Please check your input.",
  PLAN_400: "Invalid planning request.",
  PLAN_404: "No plan found for the user.",
  PLAN_500: "Plan generation failed due to server error.",
  SYLLABUS_PARSE_FAIL: "We couldn't parse your syllabus. Try a clearer file.",
  SYLLABUS_INVALID_FORMAT: "Unsupported syllabus format.",
  TUTOR_TIMEOUT: "Tutor request timed out. Please retry.",
  TUTOR_API_DOWN: "Tutor service is currently unavailable.",
  ASSESSMENT_PARSE_FAIL: "We couldn't parse your assessment.",
  ASSESSMENT_OCR_FAIL: "OCR failed to read your image.",
  CONTENT_NOT_FOUND: "Requested content not found.",
  CONTENT_API_FAIL: "Content service failed.",
};

export function deriveErrorCode(path: string, status: number, serverCode?: string): string {
  if (serverCode) return serverCode;
  if (path.startsWith("/api/plan")) {
    if (status === 404) return "PLAN_404";
    if (status >= 500) return "PLAN_500";
    return "PLAN_400";
  }
  if (path.startsWith("/api/upload")) {
    return status >= 500 ? "SYLLABUS_PARSE_FAIL" : "SYLLABUS_INVALID_FORMAT";
  }
  if (path.startsWith("/api/tutor")) {
    return status >= 500 ? "TUTOR_API_DOWN" : "TUTOR_TIMEOUT";
  }
  if (path.startsWith("/api/analytics")) {
    return status >= 500 ? "CONTENT_API_FAIL" : "CONTENT_NOT_FOUND";
  }
  if (status === 401) return "AUTH_401";
  if (status === 403) return "AUTH_403";
  if (status === 422) return "AUTH_422";
  return `HTTP_${status}`;
}

