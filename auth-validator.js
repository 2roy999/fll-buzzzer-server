
const axios = require('axios')

const INTERVAL = 5 * 1000

const validateAuth = (globalData) => {
  return Promise.all([
    globalData.get('token'),
    globalData.get('timerUrl')
  ])
    .then(([token, timerUrl]) => {
      if (token && timerUrl) {
        return axios.get(timerUrl, {
          headers: {
            'Auth-Token': token
          },
          timeout: 500,
          validateStatus: code => 200 <= code && code < 300,
          maxRedirects: 0
        })
      }
    })
    .catch(() => {
      console.error('Error authenticating to clock!!')
      console.error('Removing authentication')

      return globalData.delete('token')
    })
}

exports.start = globalData => {
  return validateAuth(globalData)
    .then(() => {
      setInterval(() => validateAuth(globalData).catch(console.error), INTERVAL)
    })
}