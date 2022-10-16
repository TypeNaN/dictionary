const io      = require('./sock')
const control = require('./control')

// ┌────────────────────────────────────────────────────────────────────────────┐
// │ จัดการข้อมูลผ่าน https requests                                                |
// └────────────────────────────────────────────────────────────────────────────┘

const SUCCESS = (res, data) => {
  if (data.code == 200) res.status(200).json(data.result)
  else res.status(data.code).send(data.message)
}
const ERROR = (res, err) => {
  console.error(err)
  res.status(500).send(err.message)
}

const stat   = async (req, res) => control.stat().then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const search = async (req, res) => control.search(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const view   = async (req, res) => control.view(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const views  = async (req, res) => {
  let { skip, end, key, by } = req.params
  const sort = (key && by) ? { key: key, by: by } : false
  control.views({ skip: skip, end: end, sort: sort }).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
}

const viewsUnknow = async (req, res) => {
  let { skip, end, key, by } = req.params
  const sort = (key && by) ? { key: key, by: by } : false
  control.viewsUnknow({ skip: skip, end: end, sort: sort }).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
}

const add        = async (req, res) => control.add(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const patch      = async (req, res) => control.patch(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const patchKey   = async (req, res) => control.patchKey(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const remove     = async (req, res) => control.remove(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))

const addPrev    = async (req, res) => control.addPrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const modPrev    = async (req, res) => control.modPrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const patchPrev  = async (req, res) => control.patchPrev(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const removePrev = async (req, res) => control.removePrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))

const addNext    = async (req, res) => control.addNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const modNext    = async (req, res) => control.modNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const patchNext  = async (req, res) => control.patchNext(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const removeNext = async (req, res) => control.removeNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err)) 


module.exports = {
  io,
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
  viewsUnknow,
  views,
  view,
  stat
}