import { NextRouter } from "next/dist/client/router";

export const isDev = process.env.NODE_ENV === "development";

// Be sure to include Vercel System Env Vars
export const originURL = isDev
  ? "http://localhost:3000"
  : `https://${
      process.env.VERCEL_URL ??
      process.env.NEXT_PUBLIC_VERCEL_URL ??
      "livepeer.studio"
    }`;

export type QueryParams = { [key: string]: string | null };

const cleanPath = (asPath: string) => {
  const uri = new URL(asPath, originURL);
  return uri.pathname;
};

export const checkIsExternal = (href: string) => {
  try {
    const url = new URL(href);
    const { hostname } = new URL(originURL);
    if (url.hostname !== hostname) return true;
  } catch (error) {
    // failed cause href is relative
    return false;
  }
};

const getHrefWithQuery = (
  asPath: string,
  newQueryParams?: QueryParams,
  override = true,
) => {
  const uri = new URL(asPath, originURL);

  if (newQueryParams) {
    Object.keys(newQueryParams).forEach((key) => {
      const value = newQueryParams[key];
      if (value === null) {
        if (override) uri.searchParams.delete(key);
        return;
      }
      if (uri.searchParams.has(key) && override) {
        uri.searchParams.delete(key);
      }
      uri.searchParams.append(key, value);
    });
  }

  return `${uri.pathname}${uri.search}${uri.hash}`;
};

export type TransitionOptions = Parameters<NextRouter["push"]>["2"];

/**
 * Don't use this inside a useEffect with `router` as a dependency (infinite loop alert).
 */
const makeQuery = (
  router: NextRouter,
  queryParams: QueryParams,
  opts?: { replace?: boolean } & TransitionOptions,
) => {
  const url = getHrefWithQuery(router.asPath, queryParams);
  const replace = opts?.replace;
  delete opts?.replace;
  if (replace) return router.replace(url, url, { scroll: false, ...opts });
  else return router.push(url, url, { scroll: false, ...opts });
};

export { cleanPath, getHrefWithQuery, makeQuery };
