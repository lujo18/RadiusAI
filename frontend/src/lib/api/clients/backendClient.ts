import axios from 'axios';
import { supabase } from '@/lib/supabase/client';
import { APIError } from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const backendClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token from Supabase
backendClient.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


backendClient.interceptors.response.use(
  (res) => res,
  (err) => {
    // FastAPI wraps HTTPException detail in { detail: ... }
    const payload = err.response?.data?.detail ?? err.response?.data;

    // Case 1: FastAPI returned a structured error
    if (payload?.status === "error") {
      throw payload as APIError;
    }

    if (err.response?.status === 401) {
      // Unauthorized - clear session and redirect to login
      supabase.auth.signOut();
      window.location.href = '/login';
      throw (payload ?? err.response.data) as APIError;
    }

    // Case 2: FastAPI returned something unexpected
    if (err.response?.data) {
      throw {
        status: "error",
        code: "UNKNOWN_BACKEND_ERROR",
        message: "Unexpected error format from server",
        details: err.response.data,
      } as APIError;
    }

    // Case 3: Network error
    throw {
      status: "error",
      code: "NETWORK_ERROR",
      message: "Unable to reach server",
      details: err.message,
    } as APIError;
  }
);



export default backendClient;