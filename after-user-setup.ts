import axios from 'axios';
import { createInterface } from 'readline'
import { stringify } from 'querystring'
import frontMonitor from './zm_reference_data/cameras/front/monitor.json'
import backMonitor from './zm_reference_data/cameras/back/monitor.json'
import frontZone from './zm_reference_data/cameras/front/zone.json'
import backZone from './zm_reference_data/cameras/back/zone.json'
import { SecretsManager, SSM } from "aws-sdk";
import { promisify } from "util";
import { exec } from "child_process";

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

const createMonitor = async (URL: string, token: string, domainName: string, monitor: typeof frontMonitor) => {
  const pathPrefix = `rtsp://camera.zoneminder.${domainName}:`
  const val =   (key: string, value: any) => {
    if (!value) { return {} }
    if (key === 'Path') {
      return { [`Monitor[${key}]`]: `${pathPrefix}${value}` }
    }
    return { [`Monitor[${key}]`]: value }
  }

  try {
    const body = Object.entries(monitor).reduce(
      (result, [key, value]) => ({
        ...result,
        ...val(key, value)
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
      { ...val('MonitorId', found.Monitor.Id) }
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

rl.question('EC2 Hostname: ', host => {
  rl.question('debug event server? (y/n): ', async debug => {
    try {
      const ssm = new SSM()
      const secretsManager = new SecretsManager()

      const zmUserParameter = await ssm.getParameter({ Name: 'zmUser' }).promise()
      const zmUser = zmUserParameter.Parameter?.Value as string

      const zmApiUrlParameter = await ssm.getParameter({ Name: 'zmApiUrl' }).promise()
      const apiUrl = zmApiUrlParameter.Parameter?.Value as string

      const domainNameParameter = await ssm.getParameter({ Name: 'domainName' }).promise()
      const domainName = domainNameParameter.Parameter?.Value as string

      const zmPasswordSecret = await secretsManager.getSecretValue({ SecretId: 'zmPassword' }).promise()
      const zmPassword = zmPasswordSecret.SecretString as string

      const iniString = secretsIni({ domainName, zmUser, zmPassword })

      const shell = promisify(exec)

      await shell(`ssh ubuntu@${host} "echo '${iniString}' > secrets.ini && sudo mv secrets.ini /etc/zm && sudo chown www-data:www-data /etc/zm/secrets.ini"`)

      // s3 upload script
      await shell(`ssh ubuntu@${host} "sudo -H pip3 install boto3"`)
      await shell(`scp ./zm-s3-upload.js ubuntu@${host}:`)
      await shell(`ssh ubuntu@${host} "sudo chmod a+x zm-s3-upload.js && sudo chown www-data:www-data zm-s3-upload.js && sudo mv zm-s3-upload.js /usr/bin"`)

      let token = await getToken(apiUrl, zmUser, zmPassword)
      await setConfig(apiUrl,token, 'ZM_OPT_USE_EVENTNOTIFICATION', '1')
      const secret = Math.random().toString(36).substring(7);
      await setConfig(apiUrl, token, 'ZM_AUTH_HASH_SECRET', secret)
      await setConfig(apiUrl, token, 'ZM_OPT_USE_AUTH', '1')
      token = await getToken(apiUrl, zmUser, zmPassword)
      await setConfig(apiUrl, token, 'ZM_AUTH_HASH_LOGINS', '1')
      await setConfig(apiUrl, token, 'ZM_TIMEZONE', 'America/New_York')

      if (debug === 'y') {
        await setConfig(apiUrl, token, 'ZM_LOG_DEBUG', '1')
        await setConfig(apiUrl, token, 'ZM_LOG_DEBUG_TARGET', '_zmesdetect|_zmeventnotification')
      }

      await createMonitor(apiUrl, token, domainName, frontMonitor)
      await createMonitor(apiUrl, token, domainName, backMonitor)

      await createZone(apiUrl, token, frontMonitor, frontZone)
      await createZone(apiUrl, token, backMonitor, backZone)

      await axios.post(
        `${apiUrl}/states/change/restart.json?token=${token}`
      )
    } catch (e) {
      console.error(e)
      throw e
    } finally {
      rl.close()
    }
  })
})

interface SecretsIniProps {
  domainName: string,
  zmUser: string,
  zmPassword: string,
}

function secretsIni({ domainName, zmUser, zmPassword }: SecretsIniProps) {

  const portalUrl = `https://zoneminder.${domainName}/zm`

  return `[secrets]
ZMES_PICTURE_URL=${portalUrl}/index.php?view=image&eid=EVENTID&fid=objdetect&width=600
ZM_USER=${zmUser}
ZM_PASSWORD=${zmPassword}
ZM_PORTAL=${portalUrl}
ZM_API_PORTAL=${portalUrl}/api`

}


