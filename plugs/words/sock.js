const control = require('./control')


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ จัดการข้อมูลผ่าน socket requests                                               |
// └────────────────────────────────────────────────────────────────────────────┘

module.exports = class {
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

    socket.on('word-stat',        async (data) => respond('word-stat',          control.stat,       [data]))
    socket.on('word-view',        async (data) => respond('word-view',          control.view,       [data]))
    socket.on('word-views',       async (data) => respond('word-views',         control.views,      [data]))
    socket.on('word-search',      async (data) => respond('word-search',        control.search,     [data]))
    socket.on('word-add',         async (data) => broadcast('word-add',         control.add,        [data]))
    socket.on('word-remove',      async (data) => broadcast('word-remove',      control.remove,     [data]))
    socket.on('word-patch',       async (data) => broadcast('word-patch',       control.patch,      [data.params, data.data]))
    socket.on('word-patch-key',   async (data) => broadcast('word-patch-key',   control.patchKey,   [data.params, data.data]))
    socket.on('word-add-prev',    async (data) => broadcast('word-add-prev',    control.addPrev,    [data]))
    socket.on('word-mod-prev',    async (data) => broadcast('word-mod-prev',    control.modPrev,    [data]))
    socket.on('word-patch-prev',  async (data) => broadcast('word-patch-prev',  control.patchPrev,  [data.params, data.data]))
    socket.on('word-remove-prev', async (data) => broadcast('word-remove-prev', control.removePrev, [data]))
    socket.on('word-add-next',    async (data) => broadcast('word-add-next',    control.addNext,    [data]))
    socket.on('word-mod-next',    async (data) => broadcast('word-mod-next',    control.modNext,    [data]))
    socket.on('word-patch-next',  async (data) => broadcast('word-patch-next',  control.patchNext,  [data.params, data.data]))
    socket.on('word-remove-next', async (data) => broadcast('word-remove-next', control.removeNext, [data]))

    socket.on('word-unknow-views',  async (data) => respond('word-unknow-views',    control.viewsUnknow,  [data]))
    socket.on('word-unknow-add',    async (data) => broadcast('word-unknow-add',    control.addUnknow,    [data]))

    socket.on('disconnect',       async () => console.log(`Good bye ${socket.id}`))
  }
}