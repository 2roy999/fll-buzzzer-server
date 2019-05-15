const connect = require('connect')
const bodyParser = require('body-parser')
const http = require('http')
const url = require('url')
const qs = require('qs')
const serveStatic = require('serve-static')
const axios = require('axios')

const clock = require('./clock')

exports.start = (globalData, updateRcCode) => {
  const app = connect()

  app.use(bodyParser.urlencoded({ extended: false }))

  app.use('/auth', (req, res, next) => {
    if (req.body.url && req.headers['host']) {
      console.log('Starting auth process...')

      globalData.set('timerUrl', req.body.url.replace(/\/$/, ''))
        .then(() => axios.get(req.body.url, {
          validateStatus: code => 300 <= code && code < 400,
          maxRedirects: 0
        }))
        .then(response => {
          console.log('IDP located...')
          const { protocol, host, pathname } = url.parse(response.headers.location)

          res.setHeader('Location', `${protocol}//${host}${pathname}?` +
            qs.stringify({ callbackUrl: `http://${req.headers['host']}/auth` }))
          res.statusCode = 302
          res.end()
        })
        .catch(err => {
          console.log('Auth process failed!!')
          console.error(err)

          res.statusCode = 500
          res.end(err.toString())
        })
    } else {
      const token = url.parse(req.url, true).query.token

      if (token) {
        globalData.set('token', token)
          .then(() => {
            console.log('Auth process finished!')
          })
          .then(next)
          .catch(next)
      }

      next()
    }

  })

  app.use('/rc-code', (req, res, next) => {
    if (req.body.rcCode) {
      globalData.set('rcCode', Number(req.body.rcCode))
        .then(() => {
          console.log('rc code saved!')
          updateRcCode(req.body.rcCode)

          next()
        })
        .catch(next)
    } else {
      next()
    }
  })

  app.use('/state', (req, res, next) => {
    Promise.all([
      globalData.get('token'),
      globalData.get('timerUrl'),
      globalData.get('rcCode')
    ])
      .then(([token, timerUrl, rcCode]) => {
        let body = JSON.stringify({
          auth: Boolean(token),
          timerUrl: timerUrl,
          rcCode: rcCode
        })

        let callback = url.parse(req.url, true).query.jsonpCallback

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('X-Content-Type-Options', 'nosniff');

        // fixup callback
        if (Array.isArray(callback)) {
          callback = callback[0];
        }

        // jsonp
        if (typeof callback === 'string' && callback.length !== 0) {
          res.setHeader('Content-Type', 'text/javascript');

          // restrict callback charset
          callback = callback.replace(/[^\[\]\w$.]/g, '');

          // replace chars not allowed in JavaScript that are in JSON
          body = body
            .replace(/\u2028/g, '\\u2028')
            .replace(/\u2029/g, '\\u2029');

          // the /**/ is a specific security mitigation for "Rosetta Flash JSONP abuse"
          // the typeof check is just to reduce client error noise
          body = '/**/ typeof ' + callback + ' === \'function\' && ' + callback + '(' + body + ');';
        }

        res.end(body);
      })
      .catch(next)
  })

  app.use('/clock', (req, res, next) => {
    Promise.all([
      globalData.get('token'),
      globalData.get('timerUrl')
    ])
      .then(([token, timerUrl]) => {
        if (token && timerUrl) {
          console.log('Checking clock...')
          clock.start(globalData)
            .then(() => {
              console.log('Clock check succeeded!')

              next()
            })
            .catch((err) => {
              console.log('Clock check failed!!')

              next(err)
            })
        } else {
          next()
        }
      })
      .catch(next)
  })

  app.use('/', serveStatic('./public', { index: 'index.html' }))

  app.use((req, res) => {
    res.setHeader('Location', '/')
    res.statusCode = 302
    res.end()
  })

  app.use((error, req, res, next) => {
    console.error(error)

    res.setHeader('Content-Type', 'text/plain')
    res.statusCode = 500
    res.end(error.stack)
  })

  http.createServer(app).listen(3000, () => {
    console.log('Starting Http server...')
  })
}
