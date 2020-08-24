import Firestore from './firestore-store'
import db from './db'
;(async () => {
  await db.start({
    postgresUrl: 'postgresql://postgres@localhost/imported_db',
  })
  const store = new Firestore({
    firestoreCredentials: process.env.LP_FIRESTORE_CREDENTIALS,
    firestoreCollection: process.env.LP_FIRESTORE_COLLECTION,
  })
  let i = 0
  for await (const doc of store.listWholeDatabase()) {
    i += 1
    console.log(docs.name)
  }
  console.log(i)
  store.close()
})().catch((err) => console.error(err))
