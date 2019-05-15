
const axios = require('axios')

exports.start = (globalData) => {
  return Promise.all([
    globalData.get('token'),
    globalData.get('timerUrl')
  ])
    .then(([token, timerUrl]) => axios.post(`${timerUrl}/api/action/start`, null, {
      headers: {
        'Auth-Token': token
      },
      validateStatus: code => 200 <= code && code < 300 || code === 400,
      maxRedirects: 0
    }))
}