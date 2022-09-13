const born = new Date()
const thday = new Array("อาทิตย์", "จันทร์", "อังคาร", "พุธ", "พฤหัสบดี", "ศุกร์", "เสาร์")
const thmonth = new Array("มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม")
const dayofmonth = new Array(31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31)

const dtt = (d) => `วัน${thday[d.getDay()]} ที่ ${d.getDate()} เดือน${thmonth[d.getMonth()]} ปีพุทธศักราช ${(d.getFullYear() + 543)} เวลา ${(d.toLocaleTimeString('TH'))} นาฬิกา`
const sdtt = (d) => `${d.getDate()}/${d.getMonth() + 1}/${(d.getFullYear() + 543)}-${(d.toLocaleTimeString('TH'))}`

const runtime = (start) => {
  const now = new Date()
  const dyy = now.getFullYear() - start.getFullYear()
  const dmm = now.getMonth() < start.getMonth()
    ? (12 + now.getMonth()) - start.getMonth()
    : now.getMonth() - start.getMonth()
  const ddd = now.getDate() < start.getDate()
    ? (dayofmonth[now.getDate()] + now.getDate()) - start.getDate()
    : now.getDate() - start.getDate()
  const dhh = now.getHours() < start.getHours()
    ? (24 + now.getHours()) - start.getHours()
    : now.getHours() - start.getHours()
  const dMM = now.getMinutes() < start.getMinutes()
    ? (60 + now.getMinutes()) - start.getMinutes()
    : now.getMinutes() - start.getMinutes()
  const dss = now.getSeconds() < start.getSeconds()
    ? (60 + now.getSeconds()) - start.getSeconds()
    : now.getSeconds() - start.getSeconds()
  return `${dyy} ปี ${dmm} เดือน ${ddd} วัน ${dhh} ชั่วโมง ${dMM} นาที ${dss} วินาที`
}

const COLOR = {
  Reset: "\x1b[0m",
  Bright: "\x1b[1m",
  Dim: "\x1b[2m",
  Underscore: "\x1b[4m",
  Blink: "\x1b[5m",
  Reverse: "\x1b[7m",
  Hidden: "\x1b[8m",

  FgBlack: "\x1b[30m",
  FgRed: "\x1b[31m",
  FgGreen: "\x1b[32m",
  FgYellow: "\x1b[33m",
  FgBlue: "\x1b[34m",
  FgMagenta: "\x1b[35m",
  FgCyan: "\x1b[36m",
  FgWhite: "\x1b[37m",

  BgBlack: "\x1b[40m",
  BgRed: "\x1b[41m",
  BgGreen: "\x1b[42m",
  BgYellow: "\x1b[43m",
  BgBlue: "\x1b[44m",
  BgMagenta: "\x1b[45m",
  BgCyan: "\x1b[46m",
  BgWhite: "\x1b[47m"
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกใช้ Modules libraries ที่จำเป็น                                             |
// └────────────────────────────────────────────────────────────────────────────┘

const config    = require('./config')

const os        = require('os')
const fs			  = require('fs')
const path		  = require('path')
const https		  = require('https')
const express	  = require('express')
const favicon	  = require('serve-favicon')
const RateLimit = require('express-rate-limit')
const app			  = express()

const credentials	= {
  key: fs.readFileSync(path.resolve(__dirname, config.sslKey), 'utf8'),
  cert: fs.readFileSync(path.resolve(__dirname, config.sslCert), 'utf8'),
  ca: fs.readFileSync(path.resolve(__dirname, config.sslCa), 'utf8')
}
const httpsServer	= https.createServer(credentials, app)
const io					= require('socket.io')(httpsServer)
const compression = require('compression')

const nets = os.networkInterfaces()
config.ip = '127.0.0.1'
for (const name of Object.keys(nets)) {
  for (const net of nets[name]) {
    if (net.family === 'IPv4' && !net.internal) config.ip = net.address
  }
}

const mongoose  = require('mongoose')
const words     = require('./models/wordsModel.js')
const logFile   = fs.createWriteStream('app.log', { flags: 'a' })

new Array('log', 'info', 'warn', 'error').forEach((methodName) => {
  const originalMethod = console[methodName]
  console[methodName] = (...args) => {
    let initiator = 'unknown place'
    let initiator_file = 'unknown place'
    try {
      throw new Error()
    } catch (e) {
      if (typeof e.stack === 'string') {
        let isFirst = true
        for (const line of e.stack.split('\n')) {
          const matches = line.match(/^\s+at\s+(.*)/)
          if (matches) {
            let result = matches[1].split(':')
            let row = result[1]
            let col = result[2].replace(')', '')
            if (!isFirst) {
              let result = matches[1].split(' ')
              if (result.length > 1) {
                result = result[1].replace(`(${__dirname}/`, '')
                result = result.replace(')', '')
              } else {
                result = result[0].replace(`${__dirname}/`, '')
              }
              result = result.split(':')
              initiator = COLOR.FgBlue + result[0] + COLOR.Reset + ' [' + COLOR.FgYellow + row + COLOR.Reset + ':' + COLOR.FgMagenta + col + COLOR.Reset + ']'
              initiator_file = `${result[0]} [${row}:${col}]`
              break
            }
            isFirst = false
          }
        }
      }
    }
    const t = sdtt(new Date())
    if (methodName == 'error') {
      logFile.write(`${t} [ERROR] ${initiator_file} ✘ ${args}\n`)
      originalMethod.apply(console, [`${initiator} => ${COLOR.FgRed}✘ ${args}${COLOR.Reset}`])
    } else if (methodName == 'warn') {
      logFile.write(`${t} [WARN]  ${initiator_file} ${args}\n`)
      originalMethod.apply(console, [`${initiator} => ${COLOR.FgYellow}${args}${COLOR.Reset}`])
    } else if (methodName == 'info') {
      logFile.write(`${t} [INFO]  ${initiator_file} ${args}\n`)
      originalMethod.apply(console, [`${initiator} => ${COLOR.FgCyan}${args}${COLOR.Reset}`])
    } else {
      logFile.write(`${t} [LOG]   ${initiator_file} ${args}\n`)
      originalMethod.apply(console, [`${initiator} => ${COLOR.FgGreen}${args}${COLOR.Reset}`])
    }
  }
})


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ กำหนดบริการ                                                                 |
// └────────────────────────────────────────────────────────────────────────────┘

app.set('env', config.nodeEnv)
app.set('port_https', config.port)
app.use(favicon(path.resolve(__dirname, 'public', 'assets', 'favicon.png')))
app.use(express.static(path.join(__dirname, 'public')))
app.use(express.json({ limit: '10mb', inflate: true }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))
app.use((err, req, res, next) => {
  console.error(err)
  res.status(500).send(err.message)}
)
app.use(compression({
  filter: (req, res) => req.headers['x-no-compression'] ? false : compression.filter(req, res)
}))

// set up rate limiter: maximum of five requests per minute
// apply rate limiter to all requests
app.use(RateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minutes
  max: 100,                 // Limit each IP to 100 requests per `window` (here, per 1 minutes)
  standardHeaders: true,    // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false      // Disable the `X-RateLimit-*` headers
}))


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เส้นทางบริการ API                                                             |
// └────────────────────────────────────────────────────────────────────────────┘

const checkCore = async (req, res, next) => {
  let allow = false
  const { hostname } = req
  for (const name of config.whiteHost) {
    if (hostname === name) {
      allow = true
      break
    }
  }
  if (!allow) return res.status(503).send('เอร๊ย!! ใครอ่ะ')
  next()
}

app.get('/', checkCore, (req, res) => {
  res.sendFile('index.html')
  res.status(200).send('complete')
  res.end()
})

app.get('/statistics', checkCore, words.rest_stat)
app.get('/views/:skip/:end', checkCore, words.rest_views)
app.get('/views/:skip/:end/:key/:by', checkCore, words.rest_views)
app.get('/view/:by/:target', checkCore, words.rest_view)
app.get('/search/:name', checkCore, words.rest_search)

app.get('/add/:name', checkCore, words.rest_add)
app.get('/add/prev/:by/:target/:previous', checkCore, words.rest_addPrev)
app.get('/add/next/:by/:target/:previous/:next', checkCore, words.rest_addNext)

app.get('/modify/prev/:by/:target/:previous/:edit', checkCore, words.rest_modPrev)
app.get('/modify/prev/:by/:target/:previous/:edit/:merge', checkCore, words.rest_modPrev)
app.get('/modify/next/:by/:target/:previous/:next/:edit', checkCore, words.rest_modNext)

app.put('/patch/:by/:target', checkCore, words.rest_patch)
app.put('/patch/:by/:target/:key', checkCore, words.rest_patchKey)
app.put('/patch/prev/:by/:target/:previous', checkCore, words.rest_patchPrev)
app.put('/patch/next/:by/:target/:previous/:next', checkCore, words.rest_patchNext)

app.delete('/remove/:by/:target', checkCore, words.rest_remove)
app.delete('/remove/prev/:by/:target/:previous', checkCore, words.rest_removePrev)
app.delete('/remove/next/:by/:target/:previous/:next', checkCore, words.rest_removeNext)


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เส้นทางบริการ socket                                                          |
// └────────────────────────────────────────────────────────────────────────────┘

io.on('connection', (socket) => {
  new words.wordsIO(socket)
  // สร้าง socket client สำหรับใช้กับ modules อื่นๆ ได้ที่นี่
})


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เปิดบริการ                                                                    |
// └────────────────────────────────────────────────────────────────────────────┘

httpsServer.listen(app.get('port_https'), () => {
  console.log(`\n\n
┌────────────────────────────────────────────────────────────────────────────┐
│ เปิดบริการ
| ${sdtt(born)}
| ${dtt(born)}
| ${born}
└────────────────────────────────────────────────────────────────────────────┘\n\n`)
  console.info(`✔ Copyright © 2022 Chaimongkol Mangklathon (TypeNan)`)
  console.info(`✎ Source code -> https://github.com/TypeNaN`)
  console.info(`♥ Buymecoffee -> https://buymeacoffee.com/TypeNaN`)
  console.info(`♥ Ko-fi       -> https://ko-fi.com/TypeNaN\n`)

  console.info(`✔ HTTPS Server running on host ${config.hostname} ip ${config.ip } port ${app.get('port_https')} in ${app.get('env')}`)
  
  mongoose.connect(
    `mongodb://${config.dbUser}:${config.dbPass}@${config.dbUrl}/${config.dbUse}`, {
      retryWrites: true,
      w: 'majority',
      //useNewUrlParser: true, // Boilerplate for Mongoose 5.x
      useUnifiedTopology: true,
      autoIndex: true, // Build indexes
      maxPoolSize: 1, // Maintain up to 1 socket connections
      serverSelectionTimeoutMS: 10000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4 // Use IPv4, skip trying IPv6
    }, (err) => {
      if (err) throw err
      console.info("✔ MongoDB database ready to use")
    }
  )
  const db = mongoose.connection
  db.on('error', console.error.bind(console, 'mongoose connection error:'))
  db.once("open", () => console.info("✔ MongoDB database connection established successfully"))
})


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ก่อนจบโปรแกรม                                                               |
// └────────────────────────────────────────────────────────────────────────────┘

const exitHandler = (options, err) => {
  if (err) {
    if (err['stack']) {
      console.error(`${err.stack}\n\n
******************************************************************************
* ปิดบริการ
* ${dtt(new Date())}
* รวมเวลา ${runtime(born)}
******************************************************************************\n\n`)
      // console.error(err.stack)
    } else {
      if (err === 'SIGINT') {
        console.log(`\n\n
******************************************************************************
* ปิดบริการ
* ${dtt(new Date())}
* รวมเวลา ${runtime(born)}
******************************************************************************\n\n`)
      }
      console.error(err)
    }
  }
  if (options.cleanup) {
    console.info('✔ คืนหน่วยความจำ')
    process.exit()
  }
  if (options.exit) console.info('✔ ปิดระบบโดยสมบูรณ์')
}

// เมื่อปิดแอพหรือแอพถูกปิดโดยเกิดจากปัญหาใดๆ ก็ตาม จะให้ทำอะไรก่อนจบปิดตัวลง
process.stdin.resume()                                                      // โปรแกรมจะไม่ปิดในทันที
process.on('exit', exitHandler.bind(null, { exit: true }))                  // ออกจากโปรแกรม
process.on('SIGINT', exitHandler.bind(null, { cleanup: true }))             // catches ctrl+c event
process.on('uncaughtException', exitHandler.bind(null, { cleanup: true }))  // catches uncaught exceptions
