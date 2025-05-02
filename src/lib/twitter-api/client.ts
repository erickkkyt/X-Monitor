import axios, { AxiosInstance, AxiosError } from 'axios';

// --- Initialization using Bearer Token ---
const bearerToken = process.env.TWITTER_BEARER_TOKEN || '';

// Log the token being used (Remove in production!)
console.log(`[API Client] Initializing Axios client with Bearer Token: ${bearerToken ? 'Loaded' : '*** NOT FOUND ***'}`);

if (!bearerToken) {
  console.error("[API Client] FATAL: TWITTER_BEARER_TOKEN environment variable is not set. Application cannot function.");
  // Throw error to prevent the app from starting incorrectly
  throw new Error("TWITTER_BEARER_TOKEN is not set in environment variables.");
}

// Create a pre-configured Axios instance for X (Twitter) API v2
export const apiClient: AxiosInstance = axios.create({
  baseURL: 'https://api.x.com/2', // Base URL for X API v2
  timeout: 30000, // Timeout set to 30 seconds (axios uses milliseconds)
  headers: {
    'Authorization': `Bearer ${bearerToken}`,
    'User-Agent': 'TwitterMonitorApp/1.0.0',
    // Mimic the Cookie header from the successful Postman request
    'Cookie': 'guest_id=v1%3A174590690336985223'
  },
  // Axios automatically handles JSON requests and responses
  // It throws errors for non-2xx status codes by default
});

console.log("[API Client] Axios client initialized successfully.");

// --- Error Handling and Retry Logic (Adapted for Axios) ---
export const withRetry = async <T>(
  // Expects a function that uses the pre-configured Axios client instance
  fn: (client: AxiosInstance) => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> => {
  try {
    // Pass the configured apiClient to the function
    return await fn(apiClient);
  } catch (error: unknown) {
    if (retries <= 0) {
      console.error("[API Client] Retry limit exceeded.");
      throw error; // Re-throw after retries are exhausted
    }

    let shouldRetry = false;
    let waitTime = delay;

    // Check if it's an AxiosError
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError; // Type assertion
      const status = axiosError.response?.status;
      const responseData = axiosError.response?.data;
      console.warn(`[API Client] Twitter API Axios Error Response - Status: ${status}, Data: ${JSON.stringify(responseData)}`);

      if (status === 429) { // Rate limit error
        // Try to get rate limit reset time from headers
        const rateLimitResetHeader = axiosError.response?.headers?.['x-rate-limit-reset'];
        const resetTimestamp = rateLimitResetHeader ? parseInt(String(rateLimitResetHeader), 10) : undefined;
        const resetTime = resetTimestamp ? new Date(resetTimestamp * 1000) : new Date(Date.now() + 60000);

        let calculatedWaitTime = Math.max(resetTime.getTime() - Date.now(), 1000);
        calculatedWaitTime = Math.min(calculatedWaitTime, 15 * 60 * 1000);

        waitTime = calculatedWaitTime;
        shouldRetry = true;
        console.warn(`[API Client] Twitter API rate limit (429). Waiting ${Math.round(waitTime / 1000)}s before retry... (${retries} retries left)`);
      } else if (status && status >= 500 && status < 600) {
        // Retry on 5xx server errors
        shouldRetry = true;
        waitTime = delay;
        console.warn(`[API Client] Twitter server error (${status}). Retrying in ${waitTime / 1000}s... (${retries} retries left)`);
      } else if (axiosError.code === 'ECONNABORTED' || axiosError.message.toLowerCase().includes('timeout')) {
         // Retry on specific timeout errors (ECONNABORTED is common for timeouts in Axios)
         console.warn(`[API Client] Request timed out (${axiosError.code || 'N/A'}). Retrying in ${waitTime / 1000}s... (${retries} retries left)`);
         shouldRetry = true;
         waitTime = delay;
      } else {
        // Don't retry on other client errors (4xx, except 429)
        console.error(`[API Client] Non-retryable API client error (${status || axiosError.code || 'N/A'}) encountered.`);
        throw error; // Re-throw non-retryable errors
      }
    } else if (error instanceof Error) {
        // Retry on generic network errors if they are not already AxiosErrors (less likely but possible)
        console.warn(`[API Client] Generic error occurred: ${error.message}. Retrying in ${waitTime / 1000}s... (${retries} retries left)`);
        shouldRetry = true;
        waitTime = delay;
    } else {
      // Unexpected error type
      console.error("[API Client] Unexpected error type encountered, not retrying:", error);
      throw error;
    }

    if (shouldRetry) {
      await new Promise(resolve => setTimeout(resolve, waitTime));
      // Exponential backoff for non-rate-limit errors
      const nextDelay = (axios.isAxiosError(error) && error.response?.status === 429) ? delay : delay * 2;
      return withRetry(fn, retries - 1, nextDelay);
    } else {
      throw error;
    }
  }
};