import { PROJECT_ID_KEY } from "hooks/use-project";

export const TOKEN_KEY = "PERSISTENT_TOKEN";
export const REFRESH_TOKEN_KEY = "REFRESH_TOKEN";

export const storeToken = (token: string, refreshToken: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  } catch (err) {
    console.error(`
      Error storing persistent token: ${err.message}. Usually this means that you're in a
      Safari private window and you don't want the token to persist anyway.
    `);
  }
};

export const getStoredToken = () => getStorageItem(TOKEN_KEY);

export const getRefreshToken = () => getStorageItem(REFRESH_TOKEN_KEY);

const getStorageItem = (key: string) => {
  if (!("browser" in process)) {
    return null;
  }
  try {
    return localStorage.getItem(key);
  } catch (err) {
    console.error(`Error retrieving ${key} from storage: ${err.message}.`);
    return null;
  }
};

export const clearTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.remove(PROJECT_ID_KEY);
  } catch (err) {
    console.error(`Error clearing persistent token: ${err.message}.`);
  }
};
