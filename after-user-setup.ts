import axios from 'axios';
import { createInterface } from 'readline'
import { stringify } from 'querystring'
import frontMonitor from './zm_reference_data/cameras/front/monitor.json'
import backMonitor from './zm_reference_data/cameras/back/monitor.json'
import frontZone from './zm_reference_data/cameras/front/zone.json'

const getToken = async (URL: string, user: string, password: string): Promise<string> => {
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

const getMonitors = async (URL: string, token: string): Promise<any[]> => {
  try {
    const response = await axios.get(`${URL}/monitors.json?token=${token}`)
    return response.data.monitors
  } catch (e) {
    console.error(e)
    throw e
  }
}

const setConfig = async (URL: string, token: string, key: string, value: string): Promise<void> => {
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
const createMonitor = async (URL: string, token: string, monitor: typeof frontMonitor) => {
  const val =   (key: string, value: any) => ({ [`Monitor[${key}]`]: value })

  try {
    const body = Object.entries(monitor).reduce(
      (result, [key, value]) => ({
        ...result,
        ...(value ? val(key, value) : {})
      }),
      {}
    )

    await axios.post(
      `${URL}/monitors.json?token=${token}`,
      stringify(body),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    console.log(`Monitor ${monitor.Name} saved`)
  } catch (e) {
    console.error(e)
    throw (e)
  }
}

// @ts-ignore
const createZone = async (URL: string, token: string, monitor: typeof frontMonitor, zone: typeof frontZone) => {
  const val =   (key: string, value: any) => ({ [`Zone[${key}]`]: value })

  try {

    const monitors = await getMonitors(URL, token)
    const found = monitors.find(m => m.Monitor.Name === monitor.Name)

    const body = Object.entries(zone).reduce(
      (result, [key, value]) => ({
        ...result,
        ...val(key, value)
      }),
      { MonitorId: found.Monitor.Id }
    )

    await axios.post(
      `${URL}/zones.json?token=${token}`,
      stringify(body),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }}
    )

    console.log(`Zone saved for monitor ${monitor.Name}`)
  } catch (e) {
    console.error(e)
    throw (e)
  }


}

const rl = createInterface({
  input: process.stdin,
  output: process.stdout
})

rl.question('ZM API URL: ', URL => {
  rl.question('ZM User: ', user => {
    rl.question('ZM Password: ', async password => {
      try {
        let token = await getToken(URL, user, password)
        await setConfig(URL,token, 'ZM_OPT_USE_EVENTNOTIFICATION', '1')
        await setConfig(URL, token, 'ZM_AUTH_HASH_SECRET', 'short')
        await setConfig(URL, token, 'ZM_OPT_USE_AUTH', '1')
        token = await getToken(URL, user, password)
        await setConfig(URL, token, 'ZM_AUTH_HASH_LOGINS', '1')
        await setConfig(URL, token, 'ZM_TIMEZONE', 'America/New_York')


        await createMonitor(URL, token, frontMonitor)
        await createMonitor(URL, token, backMonitor)

        // await createZone(URL, token, frontMonitor, frontZone)
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
})


