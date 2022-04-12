import { pascalCase } from "pascal-case";
import { Element } from "react-scroll";
import { Tree } from "components/Marketing/TableOfContents";
import { Stripe, loadStripe } from "@stripe/stripe-js";
import { theme } from "../theme";

export const getComponent = (component) => {
  const componentName = pascalCase(component._type);

  try {
    const Component = require(`components/Marketing/${componentName}`).default;

    return (
      <Element
        offset={-20}
        key={component._type}
        id={component._type}
        name={component._type}>
        <Component {...component} />
      </Element>
    );
  } catch (e) {
    return null;
  }
};

export function pathJoin2(p1: string, p2: string): string {
  if (!p1) {
    return p2;
  }
  if (p1[p1.length - 1] === "/") {
    p1 = p1.slice(0, p1.length - 1);
  }
  if (p2 && p2[0] === "/") {
    p2 = p2.slice(1);
  }
  return p1 + "/" + (p2 || "");
}

export function pathJoin(...items: Array<string>): string {
  return items.reduce(pathJoin2, "");
}

export function breakablePath(path: string): string {
  if (!path) {
    return path;
  }
  return path.split("/").join("/\u{200B}");
}

export function buildTree(toc): Tree[] {
  // [h1, children]
  const tree = [undefined, []];

  // references to latest
  // [h1, h2, h3, h4, h5] (h6 excluded because cannot have children)
  let references = [null, tree]; // usable indexes are 1,2,3,4,5

  for (const heading of toc) {
    const h = Math.min(6, heading.lvl); // h1-h6

    // h1
    if (h === 1) {
      tree[0] = { ...heading, iconComponentName: "FiCloud" };
      continue;
    }

    // create prior reference for references[h] if they don't exist
    // EXAMPLE: inserting h4 but prior h2 and h3 don't exist
    if (!references[h - 1]) {
      for (let i = 2; i < h; i++) {
        // start from h2

        // h2 doesn't exist, create it from the parent h1
        if (!references[i]) {
          let parentChildren = references[i - 1][1];
          let newReference = [undefined, []];

          parentChildren.push(newReference);
          references[i] = newReference;
        }
      }
    }

    // insert newItem
    let newItem = [heading, []];
    references[h - 1][1].push(newItem); // 1. insert newItem
    references[h] = newItem; // 2. newItem becomes references[h]
    references.splice(h + 1); // 3. remove deeper references
  }

  // Return the tree. We don't care about the heading though.
  return [tree] as Tree[]; // TODO type this [hard function to type].
}

export function getAspectRatio(height: number, width: number, forCss = false) {
  const percentage = (height / width) * 100;
  return forCss ? percentage + "%" : percentage;
}

/**
 * Gets line height of element
 * Credits: https://stackoverflow.com/a/4515470
 */
function getLineHeight(el: HTMLElement) {
  const temp = document.createElement(el.nodeName);
  temp.setAttribute(
    "style",
    `margin:0; padding:0;font-family:${
      el.style.fontFamily || "inherit"
    };font-size:${el.style.fontSize || "inherit"};`
  );
  temp.innerHTML = "A";

  el.parentNode.appendChild(temp);
  const { clientHeight: lineHeight } = temp;
  temp.parentNode.removeChild(temp);

  return lineHeight;
}

export function getMaxLines(element: HTMLElement, height: number) {
  const lineHeight = getLineHeight(element);
  if (lineHeight <= 0) return 0;
  return Math.floor(height / lineHeight);
}

export function blocksToText(blocks, opts = {}) {
  const options = Object.assign({}, { nonTextBehavior: "remove" }, opts);
  return blocks
    .map((block) => {
      if (block._type !== "block" || !block.children) {
        return options.nonTextBehavior === "remove"
          ? ""
          : `[${block._type} block]`;
      }

      return block.children.map((child) => child.text).join("");
    })
    .join("\n\n");
}

/**
 * This is a singleton to ensure we only instantiate Stripe once.
 */
let stripePromise: Promise<Stripe | null>;
export const getStripe = () => {
  const key = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if (!key) {
    return Promise.resolve(null);
  }
  if (!stripePromise) {
    stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export function formatAmountForDisplay(
  amount: number,
  currency: string
): string {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });
  return numberFormat.format(amount);
}

export function formatAmountForStripe(
  amount: number,
  currency: string
): number {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    style: "currency",
    currency: currency,
    currencyDisplay: "symbol",
  });
  const parts = numberFormat.formatToParts(amount);
  let zeroDecimalCurrency: boolean = true;
  for (let part of parts) {
    if (part.type === "decimal") {
      zeroDecimalCurrency = false;
    }
  }
  return zeroDecimalCurrency ? amount : Math.round(amount * 100);
}

export function formatNumber(
  val: number,
  maximumFractionDigits: number
): string {
  let numberFormat = new Intl.NumberFormat(["en-US"], {
    maximumFractionDigits,
  });
  return numberFormat.format(val);
}

export class HttpError extends Error {
  constructor(public status: number, public body: any) {
    super(HttpError.makeMessage(status, body));
  }

  static makeMessage(status: number, body: any) {
    const msg =
      body?.errors?.length > 0 ? body.errors[0] : JSON.stringify(body);
    return `http error status ${status}: ${msg}`;
  }
}

export async function fetchGetJSON(url: string) {
  try {
    const data = await fetch(url).then((res) => res.json());
    return data;
  } catch (err) {
    throw new Error(err.message);
  }
}

export async function fetchPostJSON(url: string, data?: {}) {
  try {
    // Default options are marked with *
    const response = await fetch(url, {
      method: "POST", // *GET, POST, PUT, DELETE, etc.
      mode: "cors", // no-cors, *cors, same-origin
      cache: "no-cache", // *default, no-cache, reload, force-cache, only-if-cached
      credentials: "same-origin", // include, *same-origin, omit
      headers: {
        "Content-Type": "application/json",
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: "follow", // manual, *follow, error
      referrerPolicy: "no-referrer", // no-referrer, *client
      body: JSON.stringify(data || {}), // body data type must match "Content-Type" header
    });
    return await response.json(); // parses JSON response into native JavaScript objects
  } catch (err) {
    throw new Error(err.message);
  }
}

export const CARD_OPTIONS = {
  iconStyle: "solid" as const,
  style: {
    base: {
      width: "100%",
      iconColor: theme.colors.primary,
      color: theme.colors.text,
      fontWeight: "500",
      fontFamily: "Roboto, Open Sans, Segoe UI, sans-serif",
      fontSize: "16px",
      fontSmoothing: "antialiased",
      "::placeholder": {
        color: "#a0aec0",
      },
      ":-webkit-autofill": {
        color: "transparent",
      },
    },
    invalid: {
      iconColor: theme.colors.red,
      color: theme.colors.red,
    },
  },
};

export function isStaging(): boolean {
  return (
    typeof window !== "undefined" &&
    (window.location.hostname.includes("livepeer.monster") ||
      window.location.hostname.includes("livepeer.vercel.app") ||
      window.location.hostname.includes("livepeerorg.vercel.app") ||
      window.location.hostname.includes("livepeerorg.now.sh"))
  );
}

export function isDevelopment(): boolean {
  return process.env.NODE_ENV === "development";
}

export function truncate(str, n) {
  return str.length > n ? str.substr(0, n - 1) + "…" : str;
}
