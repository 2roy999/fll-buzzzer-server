
const axios = require('axios')

exports.start = (globalData) => {
  return Promise.all([
    globalData.get('token'),
    globalData.get('timerUrl')
  ])
    .then(([token, timerUrl]) => axios.post(`${timerUrl}/api/action/start`, {
      headers: {
        'Auth-Token': token
      }
    }))
}