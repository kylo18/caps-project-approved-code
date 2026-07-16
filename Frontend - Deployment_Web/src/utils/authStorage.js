const REMEMBER_KEY = "rememberMe";
const TOKEN_KEY = "token";
const USER_KEY = "user";
const REMEMBERED_USER_CODE_KEY = "rememberedUserCode";

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

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY);
}

export function getUser() {
  const raw =
    sessionStorage.getItem(USER_KEY) || localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setAuth({ token, user, rememberMe }) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));

  if (rememberMe) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    localStorage.setItem(REMEMBER_KEY, "true");
  } else {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(REMEMBER_KEY);
  }
}

export function clearAuth() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  localStorage.removeItem(REMEMBERED_USER_CODE_KEY);
}

export function syncPersistedSession() {
  if (!isRememberMeEnabled()) return;

  const token = localStorage.getItem(TOKEN_KEY);
  const user = localStorage.getItem(USER_KEY);

  if (token) sessionStorage.setItem(TOKEN_KEY, token);
  if (user) sessionStorage.setItem(USER_KEY, user);
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
