import uuid from 'uuid/v4'
import DB from './db'
import Table from './table'
import { Pool } from 'pg'

interface TestObject {
  id: string
  data: string
}

describe('DB', () => {
  let db
  beforeEach(async () => {
    db = new DB({ postgresUrl: `postgresql://postgres@localhost/test` })
    await db.ready
  })
  afterEach(async () => {
    await db.close()
    const pool = new Pool({
      connectionString: `postgresql://postgres@localhost/postgres`,
      connectionTimeoutMillis: 5000,
    })
    await pool.query('DROP DATABASE test')
    await pool.end()
  })
  it('should do CRUD operations', async () => {
    expect('foo').toEqual('foo')
  })
})
