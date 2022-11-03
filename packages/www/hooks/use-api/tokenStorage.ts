export const TOKEN_KEY = "PERSISTENT_TOKEN";

export const storeToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch (err) {
    console.error(`
      Error storing persistent token: ${err.message}. Usually this means that you're in a
      Safari private window and you don't want the token to persist anyway.
    `);
  }
};

export const getStoredToken = () => {
  if (!("browser" in process)) {
    return null;
  }
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch (err) {
    console.error(`Error retrieving persistent token: ${err.message}.`);
    return null;
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.error(`Error clearing persistent token: ${err.message}.`);
  }
};
