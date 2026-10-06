import type { ApiClient } from "../../types/models";
import { mockClient } from "./mockClient";

// Single entry point for data access. When the FastAPI backend exists, add an
// httpClient implementing ApiClient and select it here (e.g. via PUBLIC_API_MODE).
export const api: ApiClient = mockClient;
