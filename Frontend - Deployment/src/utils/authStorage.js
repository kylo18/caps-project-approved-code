const REMEMBER_KEY = "rememberMe";
const USER_KEY = "user";
const REMEMBERED_USER_CODE_KEY = "rememberedUserCode";

const LEGACY_TOKEN_KEY = "token";

export function getRememberedUserCode() {
  return localStorage.getItem(REMEMBERED_USER_CODE_KEY) || "";
}

export function setRememberedUserCode(userCode) {
  if (userCode) {
    localStorage.setItem(REMEMBERED_USER_CODE_KEY, userCode);
  } else {
    localStorage.removeItem(REMEMBERED_USER_CODE_KEY);
  }
}

export function isRememberMeEnabled() {
  return localStorage.getItem(REMEMBER_KEY) === "true";
}

export function isAuthenticated() {
  return Boolean(getUser());
}

/** @deprecated Tokens are stored in httpOnly cookies; use isAuthenticated() instead. */
export function getToken() {
  return null;
}

export function getUser() {
  const raw =
    sessionStorage.getItem(USER_KEY) ||
    (isRememberMeEnabled() ? localStorage.getItem(USER_KEY) : null);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth({ user, rememberMe }) {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  if (rememberMe) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(REMEMBER_KEY, "true");
  } else {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }

  purgeLegacyTokens();
}

export function clearAuth() {
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(REMEMBERED_USER_CODE_KEY);
  purgeLegacyTokens();
}

export function purgeLegacyTokens() {
  sessionStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
}

export function getDashboardPathForRole(roleId) {
  switch (Number(roleId)) {
    case 1:
      return "/student-dashboard";
    case 2:
      return "/faculty-dashboard";
    case 3:
      return "/program-chair-dashboard";
    case 4:
      return "/dean-dashboard";
    case 5:
      return "/asso-dean-dashboard";
    default:
      return null;
  }
}
