import { apiRequest } from '../services/apiClient';

interface ConnectionStatus {
  status: 'connected' | 'disconnected';
  message: string;
  responseTime?: string;
}

export async function testConnection(): Promise<ConnectionStatus> {
  const startTime = Date.now();
  
  try {
    const response = await apiRequest('/api/health');
    const responseTime = `${Date.now() - startTime}ms`;
    
    return {
      status: 'connected',
      message: 'Backend is reachable',
      responseTime,
    };
  } catch (error: unknown) {
    return {
      status: 'disconnected',
      message: error instanceof Error ? error.message : 'Unable to connect to backend',
    };
  }
}
