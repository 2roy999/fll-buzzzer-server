const Keyv = require('keyv')
const KeyvFile = require('keyv-file')

const configServer = require('./config-server')
const rcListener = require('./listener')
const authValidator = require('./auth-validator')

const globalData = new Keyv({
  store: new KeyvFile({
    filename: `data.json`, // the file path to store the data
    expiredCheckDelay: 24 * 3600 * 1000, // ms, check and remove expired data in each ms
    writeDelay: 100, // ms, batch write to disk in a specific duration, enhance write performance.
    encode: JSON.stringify, // serialize function
    decode: JSON.parse // deserialize function
  })
})

Promise.resolve()
  .then(() => rcListener.start(globalData))
  .then(() => authValidator.start(globalData))
  .then(() => configServer.start(globalData, rcListener.updateRcCode))
