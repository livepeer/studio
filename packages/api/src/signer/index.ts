import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";
import fs from "fs/promises";
import path from "path";
import keythereum from "keythereum";
import { types, domain } from "./schema";
import * as ethers from "ethers";

// (async () => {
//   try {
//     const res = await fetch("http://localhost:8989/action", {
//       method: "post",
//       body: JSON.stringify(body),
//       headers: {
//         "content-type": "application/json",
//       },
//     });
//     console.log(res.status);
//   } catch (err) {
//     console.error(err);
//   }
// })();

function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export class Signer {
  keystoreDir: string;
  catalystAddr: string;
  key: Buffer;
  address: string;

  constructor(opts: { keystoreDir: string; catalystAddr: string }) {
    this.keystoreDir = opts.keystoreDir;
    this.catalystAddr = opts.catalystAddr;
  }

  // We store our domain salt a string, but @metamask/eth-sig-util requires an arraybuffer
  _prepareDomain(domain) {
    return {
      ...domain,
      salt: str2ab(domain.salt),
    };
  }

  async loadKey(keystorePassword: string) {
    const files = await fs.readdir(this.keystoreDir);
    if (!files[0]) {
      throw new Error(
        `error starting signer: no keystores found in ${this.keystoreDir}`
      );
    }
    const keystoreFile = path.resolve(this.keystoreDir, files[0]);
    const str = await fs.readFile(keystoreFile, "utf8");
    const data = JSON.parse(str);
    const key = keythereum.recover(keystorePassword, data);
    this.key = key;
    this.address = ethers.utils.computeAddress(key);
  }

  async sign(action) {
    const signerAction = {
      ...action,
      signer: this.address,
    };
    debugger;
    const sig = signTypedData({
      privateKey: this.key,
      version: SignTypedDataVersion.V4,
      data: {
        types: types,
        primaryType: "ChannelDefinition",
        domain: this._prepareDomain(domain),
        message: signerAction,
      },
    });
    const body = {
      primaryType: "ChannelDefinition",
      domain: domain,
      message: signerAction,
      signature: sig,
    };
    return body;
  }
}

export default async function makeSigner(opts: {
  keystoreDir: string;
  keystorePassword: string;
  catalystAddr: string;
}) {
  const signer = new Signer({
    keystoreDir: opts.keystoreDir,
    catalystAddr: opts.catalystAddr,
  });
  await signer.loadKey(opts.keystorePassword);
  return signer;
}
