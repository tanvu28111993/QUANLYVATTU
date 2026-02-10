import { API_URL } from '../utils/constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const HttpService = {
  fetchWithRetry: async (url: string, options: RequestInit, retries = 3, backoff = 300): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      
      // Check for HTML response which indicates an API error (e.g. 404, Auth page, Google Script Error)
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
         // Consume the text to keep the stream clean, and throw a descriptive error
         const text = await response.text();
         console.error("API returned HTML instead of JSON:", text.substring(0, 500));
         throw new Error(`API Configuration Error: Endpoint returned HTML (Status ${response.status}). Check API_URL.`);
      }

      // Nếu gặp lỗi server (5xx) hoặc quá nhiều request (429), thử lại
      if (!response.ok && (response.status >= 500 || response.status === 429)) {
         throw new Error(`Server Error: ${response.status}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed. Retrying in ${backoff}ms... (${retries} left)`);
        await wait(backoff);
        return HttpService.fetchWithRetry(url, options, retries - 1, backoff * 2); // Exponential backoff
      }
      throw err;
    }
  },

  post: async (body: any) => {
     return HttpService.fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      }, 1, 500);
  },

  get: async (params: URLSearchParams) => {
      const url = `${API_URL}?${params.toString()}`;
      return HttpService.fetchWithRetry(url, { method: 'GET' }, 3, 1000);
  }
};