import api from './api';
import { Borewell, BorewellFormData, ApiResponse } from '../types';

export const borewellService = {
  async registerBorewell(borewellData: BorewellFormData): Promise<ApiResponse<Borewell>> {
    try {
      const response = await api.post('/borewell/register', borewellData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Borewell registration failed',
        errors: error.response?.data?.errors || []
      };
    }
  },

  async getMyBorewells(): Promise<ApiResponse<Borewell[]>> {
    try {
      const response = await api.get('/borewell/my-borewells');
      return {
        success: true,
        data: response.data.borewells,
        count: response.data.count
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch borewells'
      };
    }
  },

  async getAllBorewells(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
    limit?: number;
  }): Promise<ApiResponse<Borewell[]>> {
    try {
      const response = await api.get('/borewell/all', { params });
      return {
        success: true,
        data: response.data.borewells,
        count: response.data.count
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch borewells'
      };
    }
  },

  async getBorewellOwners(params?: {
    lat?: number;
    lng?: number;
    radius?: number;
  }): Promise<any[]> {
    try {
      const response = await api.get('/borewell/owners', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch borewell owners:', error);
      return [];
    }
  },

  async updateBorewell(
    id: string, 
    updateData: Partial<BorewellFormData & {
      currentWaterLevel?: number;
      status?: 'active' | 'inactive' | 'maintenance' | 'dry';
    }>
  ): Promise<ApiResponse<Borewell>> {
    try {
      const response = await api.put(`/borewell/${id}`, updateData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Borewell update failed'
      };
    }
  },

  async deleteBorewell(id: string): Promise<ApiResponse> {
    try {
      const response = await api.delete(`/borewell/${id}`);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Borewell deletion failed'
      };
    }
  }
};
