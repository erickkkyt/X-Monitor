import { withRetry } from './client'; // apiClient is implicitly used within withRetry
import axios, { AxiosError } from 'axios'; // Import axios itself for isAxiosError check

// Define expected shape of the user data from Twitter API v2
// Based on https://developer.twitter.com/en/docs/twitter-api/data-dictionary/object-model/user
interface TwitterUserData {
  id: string;
  name: string;
  username: string;
  profile_image_url?: string; // Add profile image URL (optional)
}

// Define the expected shape of the Axios response data for this specific call
interface TwitterUserAxiosResponse {
  data: TwitterUserData;
  // Axios response.data usually contains the direct JSON payload from the API
}

/**
 * 根据用户名获取Twitter用户信息 (使用 axios)
 * @param username Twitter用户名
 * @returns 用户信息对象 (包含 id, name, username) 或 null (未找到)，如果发生其他 API 错误则抛出异常
 */
export async function fetchTwitterUserByUsername(username: string): Promise<TwitterUserData | null> {
  console.log(`[Twitter Utils] Fetching user by username: ${username} using Axios`);
  try {
    // Use withRetry, passing a function that uses the Axios apiClient
    const response = await withRetry(async (client) => 
      // Axios GET request. URL path is relative to baseURL in apiClient config.
      // Type parameter <TwitterUserAxiosResponse> tells Axios the expected shape of response.data
      client.get<TwitterUserAxiosResponse>(`/users/by/username/${username}`, { 
        params: {
          // Request profile_image_url in addition to other fields
          'user.fields': 'id,name,username,profile_image_url'
        }
      })
    );
    
    // Axios throws for non-2xx. If successful, response.data contains the parsed JSON body.
    if (response.data && response.data.data) {
        console.log(`[Twitter Utils] Successfully fetched user: ${response.data.data.username} (ID: ${response.data.data.id})`);
        return response.data.data; // Return the user data object directly
    } else {
        console.warn(`[Twitter Utils] User not found or no data returned in 200 OK response for: ${username}`);
        return null;
    }

  } catch (error: unknown) {
    console.error(`[Twitter Utils] Error fetching user ${username} with Axios:`, error);

    // Check if it's an AxiosError
    if (axios.isAxiosError(error)) { 
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;

      if (status === 404) {
        // User not found
        console.warn(`[Twitter Utils] User @${username} not found (404).`);
        return null; 
      } else {
        // For other HTTP errors (401, 403, 429 handled by retry, 5xx etc.)
        // Construct a more informative error message
        let errorMessage = `Twitter API Axios 错误 (${status || 'N/A'}) 获取 @${username} 时发生`;
        try {
          const errorData = axiosError.response?.data as Record<string, unknown>;
          if (errorData?.title && typeof errorData.title === 'string') {
            errorMessage += `: ${errorData.title}`;
          }
          if (errorData?.detail && typeof errorData.detail === 'string') {
            errorMessage += ` - ${errorData.detail}`;
          }
        } catch { /* Ignore parsing error, removed unused _parseError */ }
        
        throw new Error(errorMessage);
      }
    } else if (error instanceof Error) {
      // Handle generic errors (network, etc., not caught as AxiosError)
      throw new Error(`获取用户 @${username} 时发生网络或未知错误: ${error.message}`);
    } else {
      // Handle completely unexpected errors
      throw new Error(`获取用户 @${username} 时发生极其意外的错误: ${String(error)}`);
    }
  }
}

// 可以根据需要在此处添加其他工具函数，如 fetchLatestTweets, extractMediaUrls 等 (也需要用 got 重构) 