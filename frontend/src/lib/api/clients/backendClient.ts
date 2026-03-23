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

// Track public team mode (set via setPublicTeamId)
let currentPublicTeamId: string | null = null;

export const setPublicTeamId = (teamId: string | null) => {
  currentPublicTeamId = teamId;
};

export const getPublicTeamId = () => currentPublicTeamId;

// Request interceptor to add auth token from Supabase and inject team_id if public
backendClient.interceptors.request.use(
  async (config) => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Inject team_id query param if in public mode
    // Priority: currentPublicTeamId global (set by usePublicTeam) OR read from URL
    let teamId = currentPublicTeamId;
    
    if (!teamId && typeof window !== 'undefined') {
      // Fallback: extract teamId from URL path (e.g., /[teamId]/brand/settings)
      // Path structure is /[teamId]/... so first segment is the team ID
      const pathSegments = window.location.pathname.split('/').filter(Boolean);
      if (pathSegments.length > 0) {
        teamId = pathSegments[0];
        console.log(`📍 Extracted teamId from path: ${teamId}`);
      }
    }
    
    if (teamId) {
      // Convert existing params (could be object or string) to proper format
      const existingParams = new URLSearchParams();
      
      if (config.params) {
        if (typeof config.params === 'string') {
          const parsed = new URLSearchParams(config.params);
          parsed.forEach((value, key) => existingParams.set(key, value));
        } else if (typeof config.params === 'object') {
          Object.keys(config.params).forEach(key => {
            existingParams.set(key, config.params[key]);
          });
        }
      }
      
      existingParams.set('team_id', teamId);
      config.params = Object.fromEntries(existingParams);
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.url}?team_id=${teamId}`);
    } else {
      console.log(`📤 [${config.method?.toUpperCase()}] ${config.url} (auth=${token ? 'yes' : 'no'})`);
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

    if (err.response?.status === 403) {
      // Forbidden - demo account tried to use credits (don't redirect, just throw)
      throw {
        status: "error",
        code: "DEMO_OPERATION_BLOCKED",
        message: payload?.detail || "This operation is not available for demo accounts",
      } as APIError;
    }

    if (err.response?.status === 401) {
      // Unauthorized - but check if this is a public team access request (has team_id param)
      let teamId = currentPublicTeamId;
      
      if (!teamId && typeof window !== 'undefined') {
        // Fallback: read team_id from URL query params directly
        const params = new URLSearchParams(window.location.search);
        teamId = params.get('team_id');
      }
      
      const isPublicTeamRequest = teamId !== null;
      
      if (isPublicTeamRequest) {
        // Public team request failed - throw error without redirect
        throw {
          status: "error",
          code: "PUBLIC_TEAM_UNAUTHORIZED",
          message: payload?.detail || "Public team access denied or team not found",
        } as APIError;
      }
      
      // Regular authenticated user - redirect to login
      console.log("Not authorized error: ", err.response)
      supabase.auth.signOut();
      window.location.href = '/login?error=unauthorized-credit';
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