import uuid from 'uuid/v4'
import DB from './db'
import Table from './table'
import { Pool } from 'pg'

interface TestObject {
  id: string
  example: string
}

const testSchema = {
  type: 'object',
  table: 'test_object',
  required: ['id', 'example'],
  properties: {
    id: {
      type: 'string',
      readOnly: true,
    },
    example: {
      type: 'string',
      unique: true,
    },
  },
}

describe('DB', () => {
  let db: DB
  let table: Table<TestObject>
  beforeEach(async () => {
    db = new DB({ postgresUrl: `postgresql://postgres@localhost/test` })
    await db.ready
    table = new Table<TestObject>({ db, schema: testSchema })
    await table.ensureTable()
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
    const doc = <TestObject>{
      id: uuid(),
      example: 'test text',
    }
    await table.create(doc)
    let ret = await table.get(doc.id)
    expect(ret.example).toEqual(doc.example)
    await table.replace({
      id: doc.id,
      example: 'changed text',
    })
    ret = await table.get(doc.id)
    expect(ret.example).toEqual('changed text')
    await table.delete(doc.id)
    ret = await table.get(doc.id)
    expect(ret).toEqual(null)
  })
})
