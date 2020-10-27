import { addProtocol, geoLocateFactory } from './geolocate'

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}

describe('geolocate middleware', () => {
  it('should return unchanged url if already has protocol', () => {
    const url = addProtocol('rtmp://host.live')
    expect(url).toEqual('rtmp://host.live')
  })

  it('should add default https', () => {
    const url = addProtocol('host.live')
    expect(url).toEqual('https://host.live')
  })

  it('should add provided protocol', () => {
    const url = addProtocol('host.live', 'hls')
    expect(url).toEqual('hls://host.live')
  })

  it('should timeout', async () => {
    const req = {
      query: {},
      config: {
        test: ['http://localhost:3489', 'http://localhost:3490'],
      },
    }

    window.fetch = async (url) => {
      if (url.includes(3489)) {
        await sleep(100000)
      }
      return {
        status: 200,
        text: () => '',
      }
    }
    const geo = geoLocateFactory({ first: true, region: 'test' })
    await geo(req, undefined, () => {})
    expect(req.region).toBeDefined()
    expect(req.region.chosenServer).toEqual('http://localhost:3490')
    expect(req.region.servers).toHaveLength(1)
    expect(req.region.servers[0].server).toEqual('http://localhost:3490')
  })
})
