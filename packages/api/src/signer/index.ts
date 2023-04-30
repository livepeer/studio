// import { signTypedData, SignTypedDataVersion } from "@metamask/eth-sig-util";
import fs from "fs/promises";
import path from "path";
import keythereum from "keythereum";

// const types = {
//   EIP712Domain: [
//     {
//       name: "name",
//       type: "string",
//     },
//     {
//       name: "version",
//       type: "string",
//     },
//     {
//       name: "salt",
//       type: "string",
//     },
//   ],
//   ChannelDefinition: [
//     {
//       name: "id",
//       type: "string",
//     },
//     {
//       name: "time",
//       type: "int64",
//     },
//     {
//       name: "multistreamTargets",
//       type: "MultistreamTarget[]",
//     },
//   ],
//   MultistreamTarget: [
//     {
//       name: "url",
//       type: "string",
//     },
//   ],
// };

// function str2ab(str) {
//   var buf = new ArrayBuffer(str.length * 2); // 2 bytes for each char
//   var bufView = new Uint16Array(buf);
//   for (var i = 0, strLen = str.length; i < strLen; i++) {
//     bufView[i] = str.charCodeAt(i);
//   }
//   return buf;
// }

// const domain = {
//   name: "Livepeer Decentralized Video Protocol",
//   version: "0.0.1",
//   salt: "f8b3858ac49ca50b138587d5dace09bd102b9d24d2567d9a5cde2f6122810931",
// };

// const signingDomain = {
//   ...domain,
//   salt: str2ab(domain.salt),
// };

// const message = {
//   id: "my-awesome-stream",
//   multistreamTargets: [
//     {
//       url: "rtmp://localhost/foo/bar",
//     },
//   ],
//   time: 1681403259137,
// };

// const priv =
//   "0x60a6e29631432fe95e36a93a66e8ac29b566c7eb8c5139ccef9253669f521c23";
// const buf = Buffer.from(priv.slice(2), "hex");
// const sig = signTypedData({
//   privateKey: buf,
//   version: SignTypedDataVersion.V4,
//   data: {
//     types: types,
//     primaryType: "ChannelDefinition",
//     domain: signingDomain,
//     message: message,
//   },
// });
// const body = {
//   primaryType: "ChannelDefinition",
//   domain: domain,
//   message: message,
//   signature: sig,
// };

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

export class Signer {
  keystoreDir: string;
  catalystAddr: string;
  key: Buffer;

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
