import makeSigner, { Signer } from ".";
import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";
import keythereum from "keythereum";
import { v4 as uuid } from "uuid";
import os from "os";
import path from "path";
import fs from "fs/promises";
import * as ethers from "ethers";

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
    let signer;
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
        time: 1681403259137,
      };
      const signed = await signer.sign(message);
      expect(signed.message.id).toEqual(message.id);
      expect(signed.message.signer).toEqual(addr);
    });
  });
});
