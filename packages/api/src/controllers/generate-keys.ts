import { randomBytes } from "crypto";
import anyBase from "any-base";
import { db } from "../store";
import { IStore } from "../types/common";

const BASE_36 = "0123456789abcdefghijklmnopqrstuvwxyz";
const SEGMENT_COUNT = 4;
const SEGMENT_LENGTH = 4;
const hexToBase36 = anyBase(anyBase.HEX, BASE_36);

/**
 * Securely generate a stream key of a given length. Goals for stream keys: be reasonably secure
 * but also easy to type if necessary. Base36 facilitates this.
 *
 * Returns stream keys of the form XXXX-XXXX-XXXX in Base36. 62-ish bits of entropy.
 */
export function generateStreamKey() {
  return new Promise<string>((resolve, reject) => {
    randomBytes(128, (err, buf) => {
      if (err) {
        return reject(err);
      }
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
      resolve(result);
    });
  });
}

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
    const key: string = await generateStreamKey();
    const shardedKey = shardKey + key.slice(shardKey.length);
    if (shardedKey === shardBase) {
      continue;
    }
    const exists = await keyExists(shardedKey, otherKeys);
    if (!exists) {
      return shardedKey;
    }
  }
}

export const generateUniqueStreamKey = generateUniqueKey;

export const generateUniquePlaybackId = async (
  shardBase: string,
  otherKeys: string[] = []
) => formatPlaybackId(await generateUniqueKey(shardBase, otherKeys));
