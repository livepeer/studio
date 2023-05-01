import { Signer, makeSigner, SignedMessage } from ".";
import {
  SignTypedDataVersion,
  recoverTypedSignature,
} from "@metamask/eth-sig-util";
import keythereum from "keythereum";
import { v4 as uuid } from "uuid";
import os from "os";
import path from "path";
import fs from "fs/promises";
import * as ethers from "ethers";
import { types, domain } from "./schema";

const testMessage: SignedMessage = {
  primaryType: "ChannelDefinition",
  domain: {
    name: "Livepeer Decentralized Video Protocol",
    version: "0.0.1",
  },
  message: {
    id: "my-awesome-stream",
    multistreamTargets: [
      {
        url: "rtmp://localhost/foo/bar",
      },
    ],
    signer: "0x1964035e4C3cD05b8Ff839EFBf37063D8d1Ba7ae",
    time: 1681403259137,
  },
  signature:
    "0x34ed2b69881f79f153c0a4e6e3313e58b642be227cd91cc2ef1e7e8d04d3c89a272a3cea8da87b0b3b52c91b484d6f6d36ed9921bda89755ff60d1918d6268861c",
};

describe("Signer", () => {
  let tmpdir;
  let password;
  let addr;
  const catalystAddr = "http://127.0.0.1:8989";
  beforeAll(async () => {
    const dk = keythereum.create();
    tmpdir = path.resolve(os.tmpdir(), uuid());
    await fs.mkdir(tmpdir);
    password = uuid();
    const keyDump = keythereum.dump(
      password,
      dk.privateKey,
      dk.salt,
      dk.iv,
      {}
    );
    const key = keythereum.recover(password, keyDump);
    addr = ethers.utils.computeAddress(key);
    keythereum.exportToFile(keyDump, tmpdir);
  });

  afterAll(async () => {
    await fs.rm(tmpdir, { recursive: true });
  });

  it("should load a key from a file", async () => {
    const signer = new Signer({
      keystoreDir: tmpdir,
      catalystAddr: catalystAddr,
    });
    await signer.loadKey(password);
    expect(signer.key).toBeTruthy();
  });

  describe("instance functions", () => {
    let signer: Signer;
    beforeEach(async () => {
      signer = await makeSigner({
        keystoreDir: tmpdir,
        catalystAddr: catalystAddr,
        keystorePassword: password,
      });
    });

    it("should sign", async () => {
      const message = {
        id: "my-awesome-stream",
        multistreamTargets: [
          {
            url: "rtmp://localhost/foo/bar",
          },
        ],
        time: Date.now(),
      };
      const signed = await signer.sign("ChannelDefinition", message);
      expect(signed.message.id).toEqual(message.id);
      expect(signed.message.signer).toEqual(addr);
    });

    it("should verify good messages", async () => {
      await signer.verify(testMessage);
    });

    it("should not verify bad messages", async () => {
      const badMessage = {
        ...testMessage,
        message: {
          ...testMessage.message,
          id: "my-terrible-stream",
        },
      };
      let threw = false;
      try {
        await signer.verify(badMessage);
      } catch (e) {
        threw = true;
      }
      expect(threw).toBe(true);
    });
  });
});
