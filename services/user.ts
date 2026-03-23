import { User } from '../types';
import { HttpService } from './http';

export const UserService = {
  fetchUsers: async (): Promise<User[]> => {
    try {
      const params = new URLSearchParams();
      params.append('action', 'getUsers');
      params.append('sheet', 'DN');
      
      const response = await HttpService.get(params);
      const data = await response.json();

      if (data.error) throw new Error(data.error);
      
      // Transform data from sheet columns to User object if needed
      // Assuming the backend returns objects with keys matching our User interface
      return data.data || [];
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
