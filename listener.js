
const { exec } = require('child_process')

const clock = require('./clock')

const snifferCommand = process.env.SNIFFER_COMMAND

let rcCode
let sniffer

exports.start = (globalData) => {
  if (sniffer) {
    throw new Error('Listener already started')
  }

  sniffer = exec(snifferCommand, {
    killSignal: 'SIGINT'
  })

  let cooldown = false;
  sniffer.stdout.on('data', data => {
    if (!cooldown && Number(data) === rcCode) {
      cooldown = true
      const timeout = setTimeout(() => { cooldown = false }, 500)
      
      console.log('Buzzer received...')
      return clock.start(globalData)
        .then(() => {
          console.log('Clock started!')
        })
        .catch(() => {
          clearTimeout(timeout)
          cooldown = false
        })
    }
  })
  
  sniffer.stderr.on('data', error => {
    console.error(error)
  })

  sniffer.on('close', exitCode => {
    console.error(`sniffer closed with exit code: ${exitCode}`)

    process.exit(1)
  })

  globalData.get('rcCode')
    .then(exports.updateRcCode)
    .catch(console.error)
}

exports.updateRcCode = (newRcCode) => {
  rcCode = Number(newRcCode)
}