export interface APIError {
  status: "error";
  code: string;
  message: string;
  details?: any;
}