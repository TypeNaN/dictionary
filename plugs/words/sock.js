const {
  add,
  addPrev,
  addNext,
  modPrev,
  modNext,
  patch,
  patchKey,
  patchPrev,
  patchNext,
  remove,
  removePrev,
  removeNext,
  search,
  views,
  view,
  stat
} = require('./control')


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ จัดการข้อมูลผ่าน socket requests                                               |
// └────────────────────────────────────────────────────────────────────────────┘

class io {
  constructor(socket) {
    const respond = async (label, process, data) => {
      console.log(`[SOCKET] ${socket.id} | ${label} | ${JSON.stringify(data)}`)
      process(...data).then((chunk) => {
        const { event, code, message, result } = chunk
        socket.emit(event, { code: code, message: message, result: result })
      }).catch((err) => {
        console.error(err)
        socket.emit(`${label}-error`, { code: 500, message: err.message, result: null })
      })
    }

    const broadcast = async (label, process, data) => {
      console.log(`[SOCKET] ${socket.id} | ${label} | ${JSON.stringify(data)}`)
      return process(...data).then((chunk) => {
        const { event, code, message, result } = chunk
        socket.emit(event, { code: code, message: message, result: result })
        socket.broadcast.emit(event, { code: code, message: message, result: result })
      }).catch((err) => {
        console.error(err)
        socket.emit(`${label}-error`, { code: 500, message: err.message, result: null })
      })
    }

    console.log(`Socket connection: ${socket.id}`)
    socket.broadcast.emit('hello', `Hi, I am ${socket.id}`)

    socket.on('word-stat',        async (data) => respond('word-stat',          stat,       [data]))
    socket.on('word-view',        async (data) => respond('word-view',          view,       [data]))
    socket.on('word-views',       async (data) => respond('word-views',         views,      [data]))
    socket.on('word-search',      async (data) => respond('word-search',        search,     [data]))
    socket.on('word-add',         async (data) => broadcast('word-add',         add,        [data]))
    socket.on('word-remove',      async (data) => broadcast('word-remove',      remove,     [data]))
    socket.on('word-patch',       async (data) => broadcast('word-patch',       patch,      [data.params, data.data]))
    socket.on('word-patch-key',   async (data) => broadcast('word-patch-key',   patchKey,   [data.params, data.data]))
    socket.on('word-add-prev',    async (data) => broadcast('word-add-prev',    addPrev,    [data]))
    socket.on('word-mod-prev',    async (data) => broadcast('word-mod-prev',    modPrev,    [data]))
    socket.on('word-patch-prev',  async (data) => broadcast('word-patch-prev',  patchPrev,  [data.params, data.data]))
    socket.on('word-remove-prev', async (data) => broadcast('word-remove-prev', removePrev, [data]))
    socket.on('word-add-next',    async (data) => broadcast('word-add-next',    addNext,    [data]))
    socket.on('word-mod-next',    async (data) => broadcast('word-mod-next',    modNext,    [data]))
    socket.on('word-patch-next',  async (data) => broadcast('word-patch-next',  patchNext,  [data.params, data.data]))
    socket.on('word-remove-next', async (data) => broadcast('word-remove-next', removeNext, [data]))
    socket.on('disconnect',       async () => console.log(`Good bye ${socket.id}`))
  }
}


module.exports = {
  io
}