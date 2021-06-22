import pbkdf2Import from "pbkdf2"

const fromHexString = (hexString) =>
  new Uint8Array(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

export default async function hash(password: string, salt: string) {
  if (!pbkdf2Import) {

  }
  const pbkdf2 = await pbkdf2Import;
  return new Promise((resolve, reject) => {
    const saltBuffer = fromHexString(salt)
    pbkdf2.pbkdf2(password, saltBuffer, 10000, 32, "sha256", (err, derivedKey) => {
      if (err) {
        reject(err)
      }
      console.log(`output: ${derivedKey.toString("hex")}`)
      resolve(derivedKey.toString("hex").toUpperCase())
    })
  })
}
