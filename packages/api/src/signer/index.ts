import {
  signTypedData,
  recoverTypedSignature,
  SignTypedDataVersion,
} from "@metamask/eth-sig-util";
import fs from "fs/promises";
import path from "path";
import keythereum from "keythereum";
import { types, domain } from "./schema";
import * as ethers from "ethers";
import fetch from "node-fetch";
import db from "../store/db";

function str2ab(str) {
  var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
  var bufView = new Uint16Array(buf);
  for (var i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

export type SignedMessageDomain = {
  name: string;
  version: string;
};

export type SignedMessage = {
  primaryType: string;
  domain: SignedMessageDomain;
  message: any;
  signature: string;
};

export class Signer {
  keystoreDir: string;
  catalystAddr: string;
  key: Buffer;
  address: string;
  constructor(opts: { keystoreDir: string; catalystAddr: string }) {
    this.keystoreDir = opts.keystoreDir;
    this.catalystAddr = opts.catalystAddr;
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

  async sign(primaryType: keyof typeof types, action) {
    const signerAction = {
      ...action,
      signer: this.address,
    };
    const sig = signTypedData({
      privateKey: this.key,
      version: SignTypedDataVersion.V4,
      data: {
        types: types,
        primaryType: primaryType,
        domain: domain,
        message: signerAction,
      },
    });
    const body = {
      primaryType: primaryType,
      domain: domain,
      message: signerAction,
      signature: sig,
    };
    return body;
  }

  async verify(unverified: SignedMessage) {
    let recoveredAddr = recoverTypedSignature({
      version: SignTypedDataVersion.V4,
      signature: unverified.signature,
      data: {
        types: types,
        primaryType: unverified.primaryType,
        domain: unverified.domain,
        message: unverified.message,
      },
    });
    recoveredAddr = ethers.utils.getAddress(recoveredAddr);
    if (recoveredAddr !== unverified.message.signer) {
      throw new Error(
        `signature mismatch! signer=${recoveredAddr} action.signer=${unverified.message.signer}`
      );
    }
  }

  async send(signedAction) {
    const res = await fetch(`${this.catalystAddr}/action`, {
      method: "post",
      body: JSON.stringify(signedAction),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error(
        `error dispatching action to catalyst: ${await res.text()}`
      );
    }
  }

  async updateMultistreamTargets(streamId: string) {
    const stream = await db.stream.get(streamId);
    const targets = stream.multistream?.targets || [];
    const multistreams = await Promise.all(
      targets.map((tar) => db.multistreamTarget.get(tar.id))
    );
    console.log("MULTISTREAMS: " + JSON.stringify(multistreams));
    const action = {
      id: stream.playbackId,
      multistreamTargets: multistreams
        .filter((m) => !m.disabled)
        .map((m) => ({
          url: m.url,
        })),
      signer: this.address,
      time: Date.now(),
    };
    const signedAction = await this.sign("ChannelDefinition", action);
    return this.send(signedAction);
  }
}

export async function makeSigner(opts: {
  keystoreDir: string;
  keystorePassword: string;
  catalystAddr: string;
}): Promise<Signer> {
  const signer = new Signer({
    keystoreDir: opts.keystoreDir,
    catalystAddr: opts.catalystAddr,
  });
  await signer.loadKey(opts.keystorePassword);
  return signer;
}

class StubSigner {
  keystoreDir: string;
  catalystAddr: string;
  key: Buffer;
  address: string;
  async updateMultistreamTargets(streamId: string) {}
  async loadKey(keystorePassword: string) {}
  async sign(action) {}
  async send(signedAction) {}
  _prepareDomain(domain) {}
}

// No-op signer for when it doesn't exist
export async function makeStubSigner(): Promise<Signer> {
  return new StubSigner();
}
