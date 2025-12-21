import Cookies from "js-cookie";

const TOKEN_KEY = "auth_token";
const USER_KEY = "auth_user";

export const setAuthCookies = (token, user) => {
  Cookies.set(TOKEN_KEY, token);
  Cookies.set(USER_KEY, JSON.stringify(user));
};

export const clearAuthCookies = () => {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_KEY);
};

export const getAuthToken = () => Cookies.get(TOKEN_KEY);

export const getStoredUser = () => {
  const user = Cookies.get(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const isAuthenticated = () => !!getAuthToken();
