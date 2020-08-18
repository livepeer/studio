import Model from './model'
import DB from './db'

export default function makeStore(params) {
  const db = new DB(params)
  const store = new Model({ db })
  return { db, store }
}
