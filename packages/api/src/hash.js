// This file is used directly by the www code as well, so we use isomorphic
// libraries for consistent implementation between back and frontend.
import crypto from "isomorphic-webcrypto";
import util from "util";

let Encoder;
if (typeof TextEncoder === "undefined") {
  Encoder = util.TextEncoder;
} else {
  Encoder = TextEncoder;
}

const ITERATIONS = 10000;

export default async function hash(password, salt) {
  let saltBuffer;
  if (salt) {
    saltBuffer = fromHexString(salt);
  } else {
    saltBuffer = crypto.getRandomValues(new Uint8Array(8));
  }

  var encoder = new Encoder("utf-8");
  var passphraseKey = encoder.encode(password);

  // You should firstly import your passphrase Uint8array into a CryptoKey
  const key = await crypto.subtle.importKey(
    "raw",
    passphraseKey,
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"],
  );
  const webKey = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBuffer,
      // don't get too ambitious, or at least remember
      // that low-power phones will access your app
      iterations: ITERATIONS,
      hash: "SHA-256",
    },
    key,

    // Note: for this demo we don't actually need a cipher suite,
    // but the api requires that it must be specified.
    // For AES the length required to be 128 or 256 bits (not bytes)
    { name: "AES-CBC", length: 256 },

    // Whether or not the key is extractable (less secure) or not (more secure)
    // when false, the key can only be passed as a web crypto object, not inspected
    true,

    // this web crypto object will only be allowed for these functions
    ["encrypt", "decrypt"],
  );
  const buffer = await crypto.subtle.exportKey("raw", webKey);

  const outKey = bytesToHexString(new Uint8Array(buffer));
  const outSalt = bytesToHexString(saltBuffer);
  return [outKey, outSalt];
}

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

function bytesToHexString(bytes, separate) {
  /// <signature>
  ///     <summary>Converts an Array of bytes values (0-255) to a Hex string</summary>
  ///     <param name="bytes" type="Array"/>
  ///     <param name="separate" type="Boolean" optional="true">Inserts a separator for display purposes (default = false)</param>
  ///     <returns type="String" />
  /// </signature>

  var result = "";
  if (typeof separate === "undefined") {
    separate = false;
  }

  for (var i = 0; i < bytes.length; i++) {
    if (separate && i % 4 === 0 && i !== 0) {
      result += "-";
    }

    var hexval = bytes[i].toString(16).toUpperCase();
    // Add a leading zero if needed.
    if (hexval.length === 1) {
      result += "0";
    }

    result += hexval;
  }

  return result;
}
