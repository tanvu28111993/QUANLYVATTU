
import { API_URL } from '../utils/constants';

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const HttpService = {
  fetchWithRetry: async (url: string, options: RequestInit, retries = 2, backoff = 500): Promise<Response> => {
    const fetchOptions: RequestInit = {
      ...options,
      redirect: 'follow', // GAS requires following redirects
      mode: 'cors',
    };

    try {
      const response = await fetch(url, fetchOptions);
      
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("text/html")) {
         throw new Error(`Backend trả về HTML. Có thể script bị lỗi hoặc quyền truy cập chưa để 'Anyone'.`);
      }

      if (!response.ok) {
         throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
      }
      return response;
    } catch (err) {
      if (retries > 0) {
        await wait(backoff);
        return HttpService.fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      
      const msg = err instanceof Error ? err.message : 'Lỗi kết nối mạng';
      console.error(`[HTTP] Failed to fetch ${url}:`, err);
      throw new Error(`Không thể kết nối Backend.\nURL: ${url.substring(0, 45)}...\nLỗi: ${msg}`);
    }
  },

  post: async (body: any) => {
     return HttpService.fetchWithRetry(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(body)
      });
  },

  get: async (params: URLSearchParams) => {
      const url = `${API_URL}?${params.toString()}`;
      return HttpService.fetchWithRetry(url, { method: 'GET' });
  }
};
