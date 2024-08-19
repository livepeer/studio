import { randomBytes } from "crypto";
import anyBase from "any-base";
import { db } from "../store";
import { customAlphabet } from "nanoid";

export const nanoid = customAlphabet(
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz"
);

const BASE_36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const SEGMENT_COUNT = 4;
const SEGMENT_LENGTH = 4;
const hexToBase36 = anyBase(anyBase.HEX, BASE_36);

const prefixes = {
  asset: "ast",
  stream: "str",
  playback: "pid",
  key: "key",
  webhook: "wbh",
  project: "prj",
  signingKey: "sk",
  session: "ses",
  task: "tsk",
  clip: "cli",
  experiment: "exp",
  ai: "ai",
  objectStore: "obj",
} as const;

function randomBytesAsync(size: number) {
  return new Promise<Buffer>((resolve, reject) => {
    randomBytes(size, (err, buf) => {
      err ? reject(err) : resolve(buf);
    });
  });
}

/**
 * Securely generate a stream key of a given length. Goals for stream keys: be reasonably secure
 * but also easy to type if necessary. Base36 facilitates this.
 *
 * Returns stream keys of the form XXXX-XXXX-XXXX in Base36. 62-ish bits of entropy.
 * It is wrapped in an object so it's mockable, check __mocks__/generate-keys.ts
 */
export const randomKey = {
  async generate() {
    const buf = await randomBytesAsync(128);
    const raw = hexToBase36(buf.toString("hex"));
    let result = "";
    const TOTAL_LENGTH = SEGMENT_COUNT * SEGMENT_LENGTH;
    for (let i = 0; i < TOTAL_LENGTH; i += 1) {
      // Pull from the end of the raw string, the start has least siginificant bits
      // and isn't likely to be fully random.
      result += raw[raw.length - 1 - i];
      if ((i + 1) % SEGMENT_LENGTH === 0 && i < TOTAL_LENGTH - 1) {
        result += "-";
      }
    }
    return result;
  },
};

function formatPlaybackId(key: string): string {
  // Mist doesn't allow dashes in the URLs
  return key.replace(/-/g, "");
}

/**
 * Returns whether the given key exists in the database or matches any of the
 * other keys sent.
 */
async function keyExists(key: string, otherKeys: string[]) {
  const playbackId = formatPlaybackId(key);
  if (otherKeys.includes(key) || otherKeys.includes(playbackId)) {
    return true;
  }

  const streamByKey = db.stream.find({ streamKey: key });
  const streamByPid = db.stream.find({ playbackId });
  const assetByPid = db.asset.find({ playbackId });

  const results = await Promise.all([streamByKey, streamByPid, assetByPid]);
  return results.some((r) => r[0].length > 0);
}

async function generateUniqueKey(shardBase: string, otherKeys: string[] = []) {
  const shardKey = shardBase.slice(0, 4);
  while (true) {
    const key: string = await randomKey.generate();
    const shardedKey = shardKey + key.slice(shardKey.length);
    if (shardedKey === shardBase) {
      continue;
    }
    const exists = await keyExists(shardedKey, otherKeys);
    if (!exists) {
      return shardedKey;
    }
    console.warn(
      `Generated conflicting database key. key=${shardedKey} otherKeys="${otherKeys}"`
    );
  }
}

export const generateUniqueStreamKey = generateUniqueKey;

export const generateUniquePlaybackId = async (
  shardBase: string,
  otherKeys: string[] = []
) => formatPlaybackId(await generateUniqueKey(shardBase, otherKeys));

export function newId(prefix: keyof typeof prefixes) {
  const id = [prefixes[prefix], nanoid(16)].join("-");

  return id;
}
