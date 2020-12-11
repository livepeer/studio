import serverPromise from '../test-server'
import { TestClient, clearDatabase } from '../test-helpers'
import uuid from 'uuid/v4'
import hash from '../hash'

let server
let mockUser
let mockAdminUser
let mockNonAdminUser

const delay = (ms) => new Promise((r) => setTimeout(r, ms))

// jest.setTimeout(70000)

beforeAll(async () => {
  server = await serverPromise
  mockUser = {
    email: `mock_user@gmail.com`,
    password: 'z'.repeat(64),
  }

  mockAdminUser = {
    email: 'user_admin@gmail.com',
    password: 'x'.repeat(64),
  }

  mockNonAdminUser = {
    email: 'user_non_admin@gmail.com',
    password: 'y'.repeat(64),
  }
})

afterEach(async () => {
  await clearDatabase(server)
})

describe('controllers/region', () => {
  describe('basic CRUD with JWT authorization', () => {
    let client
    let adminUser

    beforeEach(async () => {
      client = new TestClient({
        server,
      })

      // setting up admin user and token
      const userRes = await client.post(`/user/`, { ...mockAdminUser })
      adminUser = await userRes.json()

      let tokenRes = await client.post(`/user/token`, { ...mockAdminUser })
      const adminToken = await tokenRes.json()
      client.jwtAuth = `${adminToken['token']}`

      const user = await server.store.get(`user/${adminUser.id}`, false)
      if (!user) {
        throw new Error('user not found')
      }
      adminUser = { ...user, admin: true, emailValid: true }
      await server.store.replace(adminUser)
    })

    it('should be able to upsert a region as admin', async () => {
      const region = {
        region: 'BER',
        orchestrators: [
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
        ],
      }

      let res = await client.put(`/region/${region.region}`, { ...region })
      expect(res.status).toBe(200)

      let getResp = await client.get(`/region/${region.region}`)
      expect(getResp).toBeDefined()
      expect(getResp.status).toBe(200)
      let regionObj = await getResp.json()
      expect(regionObj).toBeDefined()
      expect(regionObj.orchestrators).toBeDefined()
      expect(regionObj.region).toBeDefined()
    })

    it('get a list of regions', async () => {
      const region = {
        region: 'BER',
        orchestrators: [
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
        ],
      }

      let res = await client.put(`/region/${region.region}`, { ...region })
      expect(res.status).toBe(200)

      const region2 = {
        region: 'VNO',
        orchestrators: [
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
        ],
      }

      let res2 = await client.put(`/region/${region2.region}`, { ...region2 })
      expect(res2.status).toBe(200)

      const region3 = {
        region: 'OTP',
        orchestrators: [
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
          { address: 'https://orchestrator.example.com:443' },
        ],
      }
      let res3 = await client.put(`/region/${region3.region}`, { ...region3 })
      expect(res3.status).toBe(200)

      let getResp = await client.get(`/region`)
      expect(getResp).toBeDefined()
      expect(getResp.status).toBe(200)
      let regionObj = await getResp.json()
      expect(regionObj).toBeDefined()
      expect(regionObj.length).toBeDefined()
    })
  })
})
