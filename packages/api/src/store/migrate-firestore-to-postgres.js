import Firestore from './firestore-store'
import db from './db'
import { kebabToCamel } from '../util'
const params = {}
let exit = false
for (const key of [
  'LP_FIRESTORE_CREDENTIALS',
  'LP_FIRESTORE_COLLECTION',
  'LP_POSTGRES_URL',
]) {
  params[key] = process.env[key]
  if (!params[key]) {
    console.log(`missing environment variable ${key}`)
    exit = true
  }
}
if (exit) {
  process.exit(1)
}

const COLLECTIONS = {
  apiToken: 'api_token',
  objectStore: 'object_store',
  passwordResetToken: 'password_reset_token',
  stream: 'stream',
  user: 'users', // 😔 user is a reserved word in postgres
  webhook: 'webhook',
}
;(async () => {
  const have = new Set()
  await db.start({
    postgresUrl: params.LP_POSTGRES_URL,
  })
  await Promise.all(
    Object.entries(COLLECTIONS).map(async ([name, table]) => {
      const results = await db.query(`SELECT id from ${table}`)
      for (const { id } of results.rows) {
        have.add(`${name}/${id}`)
      }
    }),
  )
  const store = new Firestore({
    firestoreCredentials: params.LP_FIRESTORE_CREDENTIALS,
    firestoreCollection: params.LP_FIRESTORE_COLLECTION,
  })
  let i = 0
  for await (const doc of store.listWholeDatabase()) {
    const parts = doc.name.split('/')
    const id = parts.pop()
    const table = kebabToCamel(parts.pop())
    const key = `${table}/${id}`
    if (have.has(key)) {
      // Already moved. Skip.
      continue
    } else {
    }
    if (!db[table]) {
      throw new Error(`couldn't find table ${table}`)
    }
    const parsed = JSON.parse(doc.fields.data.stringValue)
    // Don't block here so we do everything in parallel
    console.log(`creating ${key}`)
    await db[table]
      .create(parsed)
      .then(() => {
        console.log(`created ${table} ${id}`)
      })
      .catch((err) => {
        console.log(err)
      })
    i += 1
  }
  console.log(i)
  store.close()
})().catch((err) => console.error(err))
