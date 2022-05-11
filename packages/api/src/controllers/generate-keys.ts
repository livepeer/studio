import { randomBytes } from "crypto";
import anyBase from "any-base";
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

export async function generateUniqueStreamKey(
  store: IStore,
  otherKeys: string[]
) {
  while (true) {
    const streamKey: string = await generateStreamKey();
    const qres = await store.query({
      kind: "stream",
      query: { streamKey },
    });
    if (!qres.data.length && !otherKeys.includes(streamKey)) {
      return streamKey;
    }
  }
}

export async function generateUniquePlaybackId(store: IStore, assetId: string) {
  const shardKey = assetId.substring(0, 4);
  while (true) {
    const playbackId: string = await generateStreamKey();
    const qres = await store.query({
      kind: "asset",
      query: { playbackId },
    });
    if (!qres.data.length && playbackId != assetId) {
      const shardedId = shardKey + playbackId.slice(shardKey.length);
      return shardedId.replace(/-/g, "");
    }
  }
}
