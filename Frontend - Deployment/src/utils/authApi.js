import { clearAuth, getUser, isRememberMeEnabled, setAuth } from "./authStorage";
import { normalizeUserProfile } from "./userProfileUtils";

export const AUTH_CREDENTIALS = "include";

export function authFetch(url, options = {}) {
  return fetch(url, {
    credentials: AUTH_CREDENTIALS,
    ...options,
    headers: {
      ...(options.headers || {}),
    },
  });
}

export function jsonAuthHeaders(extra = {}) {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...extra,
  };
}

/** Validate the httpOnly session cookie and refresh cached user profile. */
export async function restoreSession() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL;

  try {
    const response = await authFetch(`${apiUrl}/user/profile`, {
      method: "GET",
      headers: jsonAuthHeaders(),
    });

    if (response.status === 401) {
      clearAuth();
      return null;
    }

    if (!response.ok) {
      return getUser();
    }

    const body = await response.json();
    const user = normalizeUserProfile(body);

    if (!user) {
      clearAuth();
      return null;
    }

    setAuth({ user, rememberMe: isRememberMeEnabled() });
    return user;
  } catch {
    return getUser();
  }
}
