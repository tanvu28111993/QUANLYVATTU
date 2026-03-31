import { User } from '../types';
import { HttpService } from './http';

export const UserService = {
  fetchUsers: async (): Promise<{ users: User[], headers: string[] }> => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'getUsers');
      params.append('sheet', 'DN');
      
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.error) throw new Error(data.error);
      
      return {
        users: data.data || [],
        headers: data.headers || []
      };
    } catch (error) {
      console.error("User Fetch Error:", error);
      throw error;
    }
  },

  updateUser: async (user: User, operation: 'add' | 'edit' | 'delete'): Promise<void> => {
    try {
      const body = {
        action: 'updateUser',
        sheet: 'DN',
        operation,
        data: user
      };
      
      const response = await HttpService.post(body);
      const data = await response.json();

      if (!data.success) throw new Error(data.message || 'Failed to update user');
    } catch (error) {
      console.error("User Update Error:", error);
      throw error;
    }
  }
};
