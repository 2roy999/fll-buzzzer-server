
const connect = require('connect')
const http = require('http')
const url = require('url')

const app = connect()

app.use('/', (req, res, next) => {
  if (req.method === 'POST') {
    console.log(url.parse(req.url).path.replace(/^\//, ''))
    res.end()
  }

  next()
})

http.createServer(app).listen(3200)
