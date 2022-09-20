const { io } = require('./sock')
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

const rest_stat   = async (req, res) => stat().then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_search = async (req, res) => search(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_view   = async (req, res) => view(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_views  = async (req, res) => {
  let { skip, end, key, by } = req.params
  const sort = (key && by) ? { key: key, by: by } : false
  views({ skip: skip, end: end, sort: sort }).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
}
const rest_add        = async (req, res) => add(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_patch      = async (req, res) => patch(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_patchKey   = async (req, res) => patchKey(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_remove     = async (req, res) => remove(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))

const rest_addPrev    = async (req, res) => addPrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_modPrev    = async (req, res) => modPrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_patchPrev  = async (req, res) => patchPrev(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_removePrev = async (req, res) => removePrev(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))

const rest_addNext    = async (req, res) => addNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_modNext    = async (req, res) => modNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_patchNext  = async (req, res) => patchNext(req.params, req.body).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err))
const rest_removeNext = async (req, res) => removeNext(req.params).then((data) => SUCCESS(res, data)).catch((err) => ERROR(res, err)) 


module.exports = {
  io,
  rest_add,
  rest_addPrev,
  rest_addNext,
  rest_modPrev,
  rest_modNext,
  rest_patch,
  rest_patchKey,
  rest_patchPrev,
  rest_patchNext,
  rest_remove,
  rest_removePrev,
  rest_removeNext,
  rest_search,
  rest_views,
  rest_view,
  rest_stat
}