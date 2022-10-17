const {
  words,
  removeds,
  unknows
} = require('./schema')


const remove_spacails = (data) => data.replace(/[~!@#$%^&*\(\)+=\[\]\{\};:\`\'\"\\|,.<>/?]/g, '')
const isId = (id) => mongoose.isObjectIdOrHexString(id) ? { _id: id } : { statusCode: 400 }
const hline = '\n────────────────────────────────────────────────────────────────────────────────\n'

const field_extract = (data) => (data ? {
  create  : data.get('create'),
  modified: data.get('modified'),
  counter : data.get('counter'),
  name    : data.get('name'),
  previous: Object.keys(data.get(`tree`)),
  next    : Object.keys(data.get(`tree.${' '}`))
} : {
  create  : 0,
  modified: 0,
  counter : 0,
  name    : ' ',
  previous: [],
  next    : []
})

const field_extracts = (data) => (data ? Array.from(data.map((chunk) => ({
  create  : chunk.get('create'),
  modified: chunk.get('modified'),
  counter : chunk.get('counter'),
  name    : chunk.get('name'),
  previous: Object.keys(chunk.get(`tree`)),
  next    : Object.keys(chunk.get(`tree.${' '}`))
}))) : [{
  create  : 0,
  modified: 0,
  counter : 0,
  name    : ' ',
  previous: [],
  next    : []
}])

const field_extracts_removed = (data) => (data ? Array.from(data.map((chunk) => ({
  create  : chunk.get('create'),
  modified: chunk.get('modified'),
  counter : chunk.get('counter'),
  name    : chunk.get('name'),
  previous: chunk.get('previous'),
  next    : chunk.get('next')
}))) : [{
  create  : 0,
  modified: 0,
  counter : 0,
  name    : ' ',
  previous: [],
  next    : []
}])


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ Template การตอบกลับ                                                         |
// └────────────────────────────────────────────────────────────────────────────┘

const R200 = (event, message, result) => {
  console.log(message)
  return { event: event, code: 200, message: message, result: result }
}
const E304 = (event, message) => {
  console.warn(message)
  return { event: event, code: 304, message: message, result: null }
}
const E400 = (event, message) => {
  console.warn(message)
  return { event: event, code: 400, message: message, result: null }
}
const E404 = (event, message) => {
  console.warn(message)
  return { event: event, code: 404, message: message, result: null }
}
const E500 = (event, err) => {
  console.error(err)
  return { event: event, code: 500, message: err.message, result: null }
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูสรุปคำศัพท์ทั้งหมดจาก collection words                                     |
// └────────────────────────────────────────────────────────────────────────────┘

const stat = async () => {
  return Promise.all([
    words.countDocuments(),
    words.findOne().sort({ create: 'asc' }),
    words.find().sort({ create: 'desc' }).limit(100),
    words.find().sort({ modified: 'desc' }).limit(100),
    words.find().sort({ counter: 'desc' }).limit(100),
    words.find().sort({ counter: 'asc' }).limit(100),
    removeds.find().sort({ modified: 'desc' }).limit(100)
  ]).then(([total, first, lastAdd, lastMod, lastHigh, lastLow, lastDel]) => {
    const data = {
      total   : total,
      first   : field_extract(first),
      lastAdd : field_extracts(lastAdd),
      lastMod : field_extracts(lastMod),
      lastHigh: field_extracts(lastHigh),
      lastLow : field_extracts(lastLow),
      lastDel : field_extracts_removed(lastDel)
    }
    return R200('word-stat-success', 'Get words statistics success', data)
  }).catch((err) => E500('word-stat-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ 1 รายการจาก collection words                                     |
// └────────────────────────────────────────────────────────────────────────────┘

const view = async (data) => {
  let { by, target } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-view-error', `View word by ${by} ${target} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then((doc) => {
    if (!doc) return E404('word-view-error', `View word ${by} ${target} don't existing`, doc)
    return R200('word-view-success', `View word ${by} ${target} from dictionary successfully`, doc)
  }).catch((err) => E500('word-view-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ทั้งหมดจาก collection words                                        |
// └────────────────────────────────────────────────────────────────────────────┘

const views = async (data) => {
  let skip, end, sort, key, by
  if (data) skip, end, sort = data
  if (typeof skip !== Number || skip < 0) skip = 0
  if (typeof end !== Number || end < skip) end = skip + 100
  if (sort) {
    key, by = sort
    if (!key) key = 'create'
    if (!by) by = 'asc'
    return words.find().sort({ [key]: by }).skip(skip).limit(end).then((docs) => {
      if (!docs) return E404('word-views-error', `View words are not found`, docs)
      return R200('word-views-success', `View words skip ${skip} end ${end} sort ${sort.key} by ${sort.by}`, docs)
    }).catch((err) => E500('word-views-error', err))
  }
  return words.find().skip(skip).limit(end).then((docs) => {
    if (!docs) return E404('word-views-error', `View words are not found`, docs)
    return R200('word-views-success', `View words skip ${skip} end ${end}`, docs)
  }).catch((err) => E500('word-views-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ทั้งหมดที่ชึ้นต้นด้วยคำค้นหาจาก collection words                         |
// └────────────────────────────────────────────────────────────────────────────┘

const search = async (data) => {
  let { name } = data
  name = remove_spacails(decodeURIComponent(name))
  return words.find({ name: { $regex: name, $options: 'i' } }).then((docs) => {
    if (!docs || docs.length < 1) return E404('word-search-error', `Search words ${name} are miss match`, docs)
    return R200('word-search-success', `Search words match ${name} successfully`, docs)
  }).catch((err) => E500('word-search-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำศัพท์ลงใน collection words                                              |
// └────────────────────────────────────────────────────────────────────────────┘

const add = async (data) => {
  let { name } = data
  name = remove_spacails(decodeURIComponent(name))
  return words.create({ name: name }).then((doc) => {
    return R200('word-add-success', `Add word ${name} into the dictionary successfully`, doc)
  }).catch((err) => {
    if (err.message.startsWith('E11000 duplicate key error collection')) {
      return E304('word-add-error', `Can't add word ${name} into the dictionary ${name} are existing`)
    }
    return E500('word-add-error', err)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำศัพท์ 1 รายการจาก collection words                                       |
// └────────────────────────────────────────────────────────────────────────────┘

const remove = async (data) => {
  let { by, target } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-remove-error', `Remove word by ${by} ${target} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then((doc) => {
    if (!doc) return E304('word-remove-error', `Can't remove word ${target} because ${target} don't existing`)
    const raw = {
      create  : doc.create,
      modified: Math.floor(new Date().getTime()),
      counter : doc.counter,
      name    : doc.name,
      previous: Object.keys(doc.tree),
      next    : Object.keys(doc.tree[' '])
    }
    doc.remove()
    removeds.findOne(fillter).then((docDel) => {
      if (!docDel) {
        docDel = new removeds(raw)
      } else {
        docDel.create   = raw.create
        docDel.modified = raw.modified
        docDel.counter  = raw.counter
        docDel.previous = raw.previous
        docDel.next     = raw.next
      }
      docDel.save()
    }).catch((err) => E500('word-remove-error', err))
    return R200('word-remove-success', `Remove word ${target} from dictionary successfully`, raw)
  }).catch((err) => E500('word-remove-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดของคำศัพท์ 1 รายการจาก collection words                         |
// └────────────────────────────────────────────────────────────────────────────┘
// ไม่มีการตรวจสอบ data แบบนี้เป็นอันตรายอย่างมาก ต้องการ function verify data ด่วนๆ

const patch = async (params, data) => {
  let { by, target } = params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-patch-error', `Patch word by ${by} ${target} status code ${fillter.statusCode} bad request`)
  return words.findOneAndUpdate(fillter, data, {
    new: false,
    upsert: false,
    rawResult: true
  }).then((doc) => {
    if (!doc.lastErrorObject.updatedExisting) return E404('word-patch-error', `Can't patch word ${target} because ${target} don't existing`)
    let message = `Patch word by ${by} ${target} existing ${doc.lastErrorObject.updatedExisting} are updated ${doc.ok}${hline}`
    message += `Old data ${JSON.stringify(doc.value)}${hline}`
    message += `Patch ${JSON.stringify(data)}${hline}`
    return R200('word-patch-success', message, { original: doc.value, patch: data })
  }).catch((err) => E500('word-patch-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลในคีย์ที่กำหนดของคำศัพท์ 1 รายการจาก collection words                    |
// └────────────────────────────────────────────────────────────────────────────┘
// ไม่มีการตรวจสอบ data แบบนี้เป็นอันตรายอย่างมาก ต้องการ function verify data ด่วนๆ

const patchKey = async (params, data) => {
  let { by, target, key } = params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  key = remove_spacails(decodeURIComponent(key))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-patch-key-error', `Patch word by ${by} ${target} ${key} status code ${fillter.statusCode} bad request`)
  return words.findOneAndUpdate(fillter, { [key]: data[key] }, {
    new: false,
    upsert: false,
    rawResult: true
  }).then((doc) => {
    if (!doc.lastErrorObject.updatedExisting) return E404('word-patch-key-error', `Can't patch word ${target} because ${target} don't existing`)
    if (!doc[key]) return E304('word-patch-key-error', `Can't patch word ${target} ${key} because $ ${key}  don't existing`)
    let message = `Patch word by ${by} ${target} ${key} existing ${doc.lastErrorObject.updatedExisting} are updated ${doc.ok}${hline}`
    message += `Old data ${JSON.stringify(doc.value)}${hline}`
    message += `Patch ${JSON.stringify(data)}${hline}`
    return R200('word-patch-key-success', message, { original: doc.value[key], patch: data })
  }).catch((err) => E500('word-patch-key-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                            |
// └────────────────────────────────────────────────────────────────────────────┘

const addPrev = async (data) => {
  let { by, target, previous } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-add-prev-error', `Add word ${previous} as previous of ${by} ${target} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-add-prev-error', `Can't add word ${previous} as previous of ${by} ${target} because ${target} don't existing`)
    if (!doc.get(`tree.${previous}`)) {
      const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }).save()
      return R200('word-add-prev-success', `Add word ${previous} as previous of ${target} successfully`, result)
    } else {
      return E304('word-add-prev-error', `Can't add ${previous} as previous of ${target} because ${previous} existing`)
    }
  }).catch((err) => E500('word-add-prev-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                           |
// └────────────────────────────────────────────────────────────────────────────┘

const modPrev = async (data) => {
  let { by, target, previous, edit, merge } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  edit = remove_spacails(decodeURIComponent(edit))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-mod-prev-error', `Modity word previous of ${by} ${target} from ${previous} to ${edit} status code ${fillter.statusCode}`)
  return Promise.all([
    words.findOne(fillter),
    words.findOne({ name: edit })
  ]).then(async ([docA, docB]) => {
    // ยอมให้แก้ไข หากคำที่ต้องการแก้ เป็นคำศัพท์ที่มีอยู่ในพจนานุกรมอยู่ก่อนแล้วเท่านั้น
    if (!docA) return E304('word-mod-prev-error', `Can't modity word previous of ${by} ${target} from ${previous} to ${edit} because ${target} don't existing`)
    if (!docB) return E304('word-mod-prev-error', `Can't modity word previous of ${by} ${target} from ${previous} to ${edit} need add word ${edit} before`)
    if (!docA.get(`tree.${previous}`)) {
      if (docA.get(`tree.${edit}`)) return E304('word-mod-prev-error', `Can't modity word previous of ${by} ${target} from ${previous} to ${edit}  because ${edit} existing`)
      const result = await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }).save()
      return R200('word-mod-prev-success', `Modify word previous from ${previous} to ${edit} successfully`, result)
    } else {
      if (!docA.get(`tree.${edit}.${' '}`)) await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
        if (merge === 'merge') {
        const treeAprev = docA.get(`tree.${previous}`)
        const treeAedit = docA.get(`tree.${edit}`)
        const keyEdit   = Object.keys(treeAedit)
        Object.keys(treeAprev).forEach(key => {
          if (keyEdit.includes(key)) {
            treeAedit[key].freq = treeAedit[key].freq > treeAprev[key].freq ? treeAedit[key].freq : treeAprev[key].freq
          } else {
            treeAedit[key] = treeAprev[key]
          }
        })
      }
      const result = await docA.$set(`tree.${previous}`, undefined).save()
      return R200('word-mod-prev-success', `Modify word previous from ${previous} to ${edit} successfully`, result)
    }
  }).catch((err) => E500('word-mod-prev-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดของคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words               |
// └────────────────────────────────────────────────────────────────────────────┘
// ไม่มีการตรวจสอบ data แบบนี้เป็นอันตรายอย่างมาก ต้องการ function verify data ด่วนๆ

const patchPrev = async (params, data) => {
  let { by, target, previous } = params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-patch-prev-error', `Patch word previous ${previous} to ${by} ${target} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-patch-prev-error', `Can't patch word previous ${previous} to ${by} ${target} because ${target} don't existing`)
    const result = await doc.$set(`tree.${previous}`, data).save()
    return R200('word-patch-prev-success', `Patch word previous ${previous} to ${by} ${target} successfully`, result)
  }).catch((err) => E500('word-patch-prev-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                             |
// └────────────────────────────────────────────────────────────────────────────┘

const removePrev = async (data) => {
  let { by, target, previous } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-remove-prev-error', `Remove word previous ${previous} from ${by} ${target} status code ${fillter.statusCode} bad request`)
  return  words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-remove-prev-error', `Can't remove word previous ${previous} from ${by} ${target} because ${target} don't existing`)
    if (!doc.get(`tree.${previous}`)) return E304('word-remove-prev-error', `Can't remove word previous ${previous} from ${by} ${target} because ${previous} don't existing`)
    const result = await doc.$set(`tree.${previous}`, undefined).save()
    return R200('word-remove-prev-success', `Remove word previous ${previous} from ${by} ${target} successfully`, result)
  }).catch((err) => E500('word-remove-prev-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำถัดไปในคำศัพท์ 1 รายการจาก collection words                              |
// └────────────────────────────────────────────────────────────────────────────┘

const addNext = async (data) => {
  let { by, target, previous, next } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-add-next-error', `Add word next ${next} to ${by} ${target} ${previous} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-remove-next-error', `Can't add word next ${next} to ${by} ${target} ${previous} because ${target} don't existing`)
    if (!doc.get(`tree.${previous}`)) return E304('word-add-next-error', `Can't add word next ${next} to ${by} ${target} ${previous} because ${previous} don't existing`)
    if (doc.get(`tree.${previous}.${next}`)) return E304('word-add-next-error', `Can't add word next ${next} to ${by} ${target} ${previous} because ${next} existing`)
    const result = await doc.$set(`tree.${previous}.${next}`, { freq: 1, feel: 0, type: '', posi: '', mean: '' }).save()
    return R200('word-add-next-success', `Add word next ${next} from ${by} ${target} ${previous} successfully`, result)
  }).catch ((err) => E500('word-remove-next-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขคำถัดไปในคำศัพท์ 1 รายการจาก collection words                             |
// └────────────────────────────────────────────────────────────────────────────┘

const modNext = async (data) => {
  let { by, target, previous, next, edit } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  edit = remove_spacails(decodeURIComponent(edit))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-mod-next-error', `Modify word next ${next} from ${by} ${target} ${previous} status code ${fillter.statusCode} bad request`)
  return Promise.all([
    words.findOne(fillter),
    words.findOne({ name: edit })
  ]).then(async ([docA, docB]) => {
    if (!docB) return E304('word-mod-next-error', `Can't modity word next of ${by} ${target} ${previous} from ${next} to ${edit} because ${edit} don't existing`)
    if (!docA) return E304('word-mod-next-error', `Can't modity word next of ${by} ${target} ${previous} from ${next} to ${edit} because ${target} don't existing`)
    if (!docA.get(`tree.${previous}`)) return E304('word-mod-next-error', `Can't modity word next of ${by} ${target} ${previous} from ${next} to ${edit} because ${previous} don't existing`)
    if (!docA.get(`tree.${previous}.${next}`)) return E304('word-mod-next-error', `Can't modity word next of ${by} ${target} ${previous} from ${next} to ${edit} because ${next} don't existing`)
    if (docA.get(`tree.${previous}.${edit}`)) return E304('word-mod-next-error', `Can't modity word next of ${by} ${target} ${previous} from ${next} to ${edit} because ${edit} existing`)
    const nxt = Object.assign({}, docA.get(`tree.${previous}.${next}`))
    const merge = Object.assign({}, docA.get(`tree.${previous}.${edit}`), nxt)
    const result = await docA.$set(`tree.${previous}.${next}`, undefined).$set(`tree.${previous}.${edit}`, merge).save()
    return R200('word-add-next-success', `Modity word next of ${by} ${target} ${previous} from ${next} to ${edit} successfully`, result)
  }).catch((err) => E500('word-mod-next-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดในคำถัดไปในคำศัพท์ 1 รายการจาก collection words                  |
// └────────────────────────────────────────────────────────────────────────────┘
// ไม่มีการตรวจสอบ data แบบนี้เป็นอันตรายอย่างมาก ต้องการ function verify data ด่วนๆ

const patchNext = async (params, data) => {
  let { by, target, previous, next } = params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-patch-next-error', `Patch word next ${next} to ${by} ${target} ${previous} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-patch-next-error', `Can't patch word next ${next} to ${by} ${target} ${previous} because ${target} don't existing`)
    if (!doc.get(`tree.${previous}`)) return E304('word-patch-next-error', `Can't patch word next ${next} to ${by} ${target} ${previous} because ${previous} don't existing`)
    if (!doc.get(`tree.${previous}.${next}`)) return E304('word-patch-next-error', `Can't patch word next ${next} to ${by} ${target} ${previous} because ${next} don't existing`)
    const result = await doc.$set(`tree.${previous}.${next}`, data).save()
    return R200('word-patch-next-success', `Patch word next ${next} to ${by} ${target} ${previous} successfully`, result)
  }).catch((err) => E500('word-patch-next-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำถัดไปในคำศัพท์ 1 รายการจาก collection words                               |
// └────────────────────────────────────────────────────────────────────────────┘

const removeNext = async (data) => {
  let { by, target, previous, next } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-remove-next-error', `Remove word next ${next} from ${by} ${target} ${previous} status code ${fillter.statusCode} bad request`)
  return words.findOne(fillter).then(async (doc) => {
    if (!doc) return E304('word-remove-next-error', `Can't remove word next ${next} from ${by} ${target} ${previous} because ${target} don't existing`)
    if (!doc.get(`tree.${previous}`)) return E304('word-remove-next-error', `Can't remove word next ${next} from ${by} ${target} ${previous} because ${previous} don't existing`)
    if (!doc.get(`tree.${previous}.${next}`)) return E304('word-remove-next-error', `Can't remove word next ${next} from ${by} ${target} ${previous} because ${next} don't existing`)
    const result = await doc.$set(`tree.${previous}.${next}`, undefined).save()
    return R200('word-remove-next-success', `Remove word next ${next} from ${by} ${target} ${previous} successfully`, result)
  }).catch((err) => E500('word-remove-next-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ทั้งหมดจาก collection unknows                                      |
// └────────────────────────────────────────────────────────────────────────────┘

const viewsUnknow = async (data) => {
  let skip, end, sort, key, by
  if (data) skip, end, sort = data
  if (typeof skip !== Number || skip < 0) skip = 0
  if (typeof end !== Number || end < skip) end = skip + 100
  if (sort) {
    key, by = sort
    if (!key) key = 'create'
    if (!by) by = 'asc'
    return unknows.find().sort({ [key]: by }).skip(skip).limit(end).then((docs) => {
      if (!docs) return E404('word-unknow-views-error', `View unknow words are not found`, docs)
      return R200('word-unknow-views-success', `View unknow words skip ${skip} end ${end} sort ${key} by ${by}`, docs)
    }).catch((err) => E500('word-unknow-views-error', err))
  }
  return unknows.find().skip(skip).limit(end).then((docs) => {
    if (!docs) return E404('word-unknow-views-error', `View unknow words are not found`, docs)
    return R200('word-unknow-views-success', `View unknow words skip ${skip} end ${end}`, docs)
  }).catch((err) => E500('word-unknow-views-error', err))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำศัพท์ลงใน collection unknows                                            |
// └────────────────────────────────────────────────────────────────────────────┘

const addUnknow = async (data) => {
  let { name } = data
  name = remove_spacails(decodeURIComponent(name))
  return unknows.create({ name: name }).then((doc) => {
    return R200('word-unknow-add-success', `Add unknow word ${name} into the dictionary successfully`, doc)
  }).catch((err) => {
    if (err.message.startsWith('E11000 duplicate key error collection')) {
      return E304('word-unknow-add-error', `Can't add unknow word ${name} into the dictionary ${name} are existing`)
    }
    return E500('word-unknow-add-error', err)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำศัพท์ 1 รายการจาก collection unknows                                     |
// └────────────────────────────────────────────────────────────────────────────┘

const removeUnknow = async (data) => {
  let { by, target } = data
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) return E400('word-unknow-remove-error', `Remove unknow word by ${by} ${target} status code ${fillter.statusCode} bad request`)
  return unknows.findOne(fillter).then((doc) => {
    if (!doc) return E304('word-unknow-remove-error', `Can't remove unknow word ${target} because ${target} don't existing`)
    doc.remove()
    return R200('word-unknow-remove-success', `Remove unknow word ${target} from dictionary successfully`, doc)
  }).catch((err) => E500('word-unknow-remove-error', err))
}



module.exports = {
  add,
  addPrev,
  addNext,
  addUnknow,
  modPrev,
  modNext,
  patch,
  patchKey,
  patchPrev,
  patchNext,
  remove,
  removePrev,
  removeNext,
  removeUnknow,
  search,
  viewsUnknow,
  views,
  view,
  stat
}
