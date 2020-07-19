import axios from 'axios';
import { createInterface } from 'readline'
import { stringify } from 'querystring'

const getToken = async (user: string, password: string): Promise<string> => {
  try {
    const response = await axios.post(
      `${URL}/host/login.json?`,
      `user=${user}&pass=${password}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    return response.data.access_token
  } catch (e) {
    console.error(e)
    throw e
  }
}

const getMonitors = async (token: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${URL}/monitors.json?token=${token}`)
    return response.data.monitors
  } catch (e) {
    console.error(e)
    throw e
  }
}

// @ts-ignore
const setConfig = async (token: string, key: string, value: string): Promise<void> => {
  try {
    await axios.put(
      `${URL}/configs/edit/${key}.json?token=${token}`,
      `Config[Value]=${value}`,
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    console.log(`Config ${key} set to ${value}`)
  } catch (e) {
    console.error(e)
    throw e
  }
}

// @ts-ignore
const createMonitor = async (token: string, name: string, path: string) => {
  const val =   (key: string, value: string) => ({ [`Monitor[${key}]`]: value })

  try {
    const body = {
      ...val('Name', name),
      ...val('Path', path),
      ...val('Type', 'Ffmpeg'),
      ...val('Colours', '4'),
      ...val('Function', 'Modect'),
      ...val('Width', '1920'),
      ...val('Height', '1080'),
      ...val('ImageBufferCount', '25'),
      ...val('WarmupCount', '0'),
      ...val('PreEventCount', '10'),
      ...val('PostEventCount', '100'),
      ...val('StreamReplayBuffer', '0'),
      ...val('AlarmFrameCount', '1')
    }

    await axios.post(
      `${URL}/monitors.json?token=${token}`,
      stringify(body),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    console.log(`Monitor ${name} saved`)
  } catch (e) {
    console.error(e)
    throw (e)
  }
}

// @ts-ignore
const createZone = async (token: string, monitor: string, name: string, coords: string) => {
  const val =   (key: string, value: string) => ({ [`Zone[${key}]`]: value })

  try {

    const monitors = await getMonitors(token)
    const found = monitors.find(m => m.Monitor.Name === monitor)

    const body = {
      ...val('MonitorId', found.Monitor.Id),
      ...val('Name', name),
      ...val('Type', 'Active'),
      ...val('Units', 'Percent'),
      ...val('NumCoords', '4'),
      ...val('Coords', coords),
      ...val('CheckMethod', 'Blobs'),
      ...val('MinPixelThreshold', '25'),
      ...val('FilterX', '3'),
      ...val('FilterY', '3'),
    }

    await axios.post(
      `${URL}/zones.json?token=${token}`,
      stringify(body),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    console.log(`Zone ${name} saved for monitor ${monitor}`)
  } catch (e) {
    console.error(e)
    throw (e)
  }


}

// TODO: inject
const URL = 'https://zoneminder.mgilbride.com/zm/api'

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('ZM User: ', user => {
  rl.question('ZM Password: ', async password => {
    try {
      let token = await getToken(user, password)
      await setConfig(token, 'ZM_OPT_USE_EVENTNOTIFICATION', '1')
      await setConfig(token, 'ZM_AUTH_HASH_SECRET', 'short')
      await setConfig(token, 'ZM_OPT_USE_AUTH', '1')
      token = await getToken(user, password)
      await setConfig(token, 'ZM_AUTH_HASH_LOGINS', '1')
      await setConfig(token, 'ZM_TIMEZONE', 'America/New_York')

      // await createMonitor(token, 'Front', 'rtsp://camera.zoneminder.mgilbride.com:8554/11')
      // await createMonitor(token, 'Back', 'rtsp://camera.zoneminder.mgilbride.com:9554/11')

      // await createZone(token, 'Front', 'All', '463,689 1916,682 1919,1079 0,1079')
      // await createZone(token, 'Back', 'All', '0,0 1916,390 1919,1079 0,1079')

      await axios.post(
        `${URL}/states/change/restart.json?token=${token}`
      )
    } catch (e) {
      console.error(e)
      throw e
    } finally {
      rl.close()
    }
  })
})


