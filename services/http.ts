
import { API_URL } from '../utils/constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const HttpService = {
  fetchWithRetry: async (url: string, options: RequestInit, retries = 3, backoff = 300): Promise<Response> => {
    try {
      const response = await fetch(url, options);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
         const text = await response.text();
         console.error("API returned HTML instead of JSON. Possible redirection or script error.");
         throw new Error(`Lỗi cấu hình: Backend trả về HTML thay vì JSON. Vui lòng kiểm tra lại quyền truy cập (Anyone) của Google Script.`);
      }

      if (!response.ok && (response.status >= 500 || response.status === 429)) {
         throw new Error(`Lỗi máy chủ: ${response.status}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        console.warn(`Fetch failed. Retrying in ${backoff}ms... (${retries} left)`);
        await wait(backoff);
        return HttpService.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      
      // Detailed error for production debugging
      const errorMessage = err instanceof Error ? err.message : 'Unknown network error';
      throw new Error(`Không thể kết nối máy chủ backend. 
        \n- URL: ${url.substring(0, 50)}...
        \n- Chi tiết: ${errorMessage}`);
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
