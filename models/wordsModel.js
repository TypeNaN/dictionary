const mongoose = require('mongoose')

const collection = 'words'
const collection_stat = 'statistics'

const wordsSchema = new mongoose.Schema({
  create    : { type: Number, default: 0 },                   // เวลาที่ถูกสร้าง
  modified  : { type: Number, default: 0 },                   // เวลาที่แก้ไขล่าสุด
  populate  : { type: Number, default: 0 },                   // จำนวนครั้งที่ถูกใช้
  lang      : { type: String, default: 'th' },                // TH,EN
  age       : { type: String, default: 'ทั่วไป' },              // โบราณ, ทั่วไป, ทับศัพท์, กระแสนิยม
  name      : { type: String, required: true, unique: true }, // ชื่อคำ
  read      : { type: String, default: '' },                  // คำอ่าน
  type      : { type: [String], default: [] },                // ประเภทคำ เช่น คำนาม, คำกริยา
  example   : { type: [String], default: [] },                // ตัวอย่างประโยค
  correct   : { type: [String], default: [] },                // คำที่ถูกต้อง (กรณีแก้จากคำที่มักเขียนผิด)
  opposite  : { type: [String], default: [] },                // คำที่มีความหมายตรงข้าม
  tree: {                                                     // คำก่อนหน้าและคำถัดไป
    rquired: true,
    type: mongoose.Schema.Types.Mixed,
    default: {
      ' ': {        // คำก่อนหน้า
        ' ': {      // คำถัดไป
          freq: 0,  // ความถี่การต่อคำ
          feel: 0,  // คำที่มีทัศนคติทั้งเชิงบวกและลบ จากเชิงลบที่สุด -2 เฉยๆ 0 และเชิงบวกที่สุด 2 
          type: '', // ประเภทคำ เช่น คำนาม, คำกริยา
          posi: '', // ตำแหน่งของประโยค เช่น ประธาน, กรรม
          mean: ''  // ความหมายตามชนิดคำ
        }
      }
    } 
  }
}, {
  timestamps: {
    createdAt: 'create',
    updatedAt: 'modified',
    currentTime: () => Math.floor(new Date().getTime())
  },
  versionKey: false,
  strict: true,
  collection
})

const wordsStat = new mongoose.Schema({
  create  : { type: Number, default: 0 },
  modified: { type: Number, default: 0 },
  populate: { type: Number, default: 0 },
  name    : { type: String, required: true, unique: true},
  previous: { type: [String], default: [] },
  next    : { type: [String], default: [] }
})

const statSchema = new mongoose.Schema({
  total   : { type: Number, default: 0 },
  first   : { type: wordsStat },
  lastAdd : { type: [wordsStat] },
  lastMod : { type: [wordsStat] },
  lastDel : { type: [wordsStat] },
},
{
  versionKey: false,
  strict: true,
  collection_stat
})

const words = mongoose.model(collection, wordsSchema)
const statistics = mongoose.model(collection_stat, statSchema)

const remove_spacails = (data) => data.replace(/[~!@#$%^&*\(\)+=\[\]\{\};:\`\'\"\\|,.<>/?]/g, '')
const isId = (id) => mongoose.isObjectIdOrHexString(id) ? { _id: id } : { statusCode: 400 }
const hline = '\n────────────────────────────────────────────────────────────────────────────────\n'


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำศัพท์ลงใน collection words                                              |
// └────────────────────────────────────────────────────────────────────────────┘

const add = async (req, res) => {
  let { name } = req.params
  name = remove_spacails(decodeURIComponent(name))
  words.create({ name: name }).then((result) => {
    console.log(`Add word ${name} in to Dictionary`)
    res.status(200).send(result)
  }).catch((err) => {
    if (err.message.startsWith('E11000 duplicate key error collection')) {
      console.log(`Can't add word ${name} in to Dictionary ${name} is exist`)
      return res.status(304).end()
    }
    console.error(err)
    return res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ 1 รายการจาก collection words                                     |
// └────────────────────────────────────────────────────────────────────────────┘

const view = async (req, res) => {
  let { by, target } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`View word by ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  words.findOne(fillter).then((result) => {
    console.log(`View word by ${by} ${target}`)
    res.status(200).json(result)
  }).catch((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ทั้งหมดจาก collection words                                        |
// └────────────────────────────────────────────────────────────────────────────┘

const views = async (req, res) => {
  words.find().then((result) => {
    console.log(`View all ${result.length} words`)
    res.status(200).json(result)
  }).catch((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูคำศัพท์ทั้งหมดที่ชึ้นต้นด้วยคำค้นหาจาก collection words                         |
// └────────────────────────────────────────────────────────────────────────────┘

const search = async (req, res) => {
  let { name } = req.params
  name = remove_spacails(decodeURIComponent(name))
  words.find({ name: { $regex: name, $options: 'i' } }).then((result) => {
    console.log(`Search words match ${name}`)
    res.status(200).json(result)
  }).catch((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำศัพท์ 1 รายการจาก collection words                                       |
// └────────────────────────────────────────────────────────────────────────────┘

const remove = async (req, res) => {
  let { by, target } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Remove word by ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  words.deleteOne(fillter).then((result) => {
    console.log(`Remove word by ${by} ${target} deleted count ${result.deletedCount}`)
    res.status(200).json(result)
  }).catch ((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดของคำศัพท์ 1 รายการจาก collection words                         |
// └────────────────────────────────────────────────────────────────────────────┘

const patch = async (req, res) => {
  const data = req.body
  let { by, target } = req.params
  by = remove_spacails(decodeURIComponent(by))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Patch word by ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  words.findOneAndUpdate(fillter, data, {
    new: false,
    upsert: true,
    rawResult: true 
  }).then((result) => {
    console.log(`Patch word by ${by} ${target} existing ${result.lastErrorObject.updatedExisting} updated ${result.ok}${hline}Old data ${JSON.stringify(result.value)}${hline}Patch ${JSON.stringify(data)}${hline}`)
    res.json({ original: result.value, patch: data })
  }).catch ((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลในคีย์ที่กำหนดของคำศัพท์ 1 รายการจาก collection words                    |
// └────────────────────────────────────────────────────────────────────────────┘

const patchKey = async (req, res) => {
  const data = req.body
  let { by, target, key } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  key = remove_spacails(decodeURIComponent(key))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Patch word by ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  words.findOneAndUpdate(fillter, {[key]: data[key] }, {
    new: false,
    upsert: true,
    rawResult: true
  }).then((result) => {
    console.log(`Patch word by ${by} ${target} key ${key} existing ${result.lastErrorObject.updatedExisting} updated ${result.ok}${hline}Old data ${JSON.stringify(result.value)}${hline}Patch ${JSON.stringify(data)}${hline}`)
    res.json({ original: result.value, patch: data })
  }).catch((err) => {
    console.error(err)
    res.status(500).send(err.message)
  })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                            |
// └────────────────────────────────────────────────────────────────────────────┘

const addPrev = async (req, res) => {
  let { by, target, previous } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Add word ${previous} as previous of ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.log(`Can't add ${previous} as previous of ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (!doc.get(`tree.${previous}`)) {
    const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    const newDoc = await doc.save()
    console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
    return res.json(newDoc)
  }
  console.log(`Can't add ${previous} as previous of ${target} because ${previous} existing`)
  res.status(304).end()
}

// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                           |
// └────────────────────────────────────────────────────────────────────────────┘

const modPrev = async (req, res) => {
  let { by, target, previous, edit, merge } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  edit = remove_spacails(decodeURIComponent(edit))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Modity word ${previous} to ${edit} from previous of ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const docA = await words.findOne(fillter).catch((err) => err)
  if (docA && 'message' in docA) {
    console.error(docA)
    return res.status(500).send(docA.message)
  }
  if (!docA) {
    console.error(`Can't modify word ${previous} to ${edit} from previous of ${target} because ${target} don't exist`) 
    return res.status(304).end()
  }
  if (!docA.get(`tree.${edit}`)) {
    if (!docA.get(`tree.${previous}`)) {
      await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    } else {
      const treeA = docA.get('tree')
      await docA.$set(`tree.${edit}`, treeA[previous])
      await docA.$set(`tree.${previous}`, undefined, { strict: true })
    }
    await docA.save()
  } else {
    if (!docA.get(`tree.${previous}`)) {
      if (!docA.get(`tree.${edit}.${' '}`)) {
        await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
        await docA.$set(`tree.${previous}`, undefined, { strict: true })
        await docA.save()
        console.log(`Modity word ${previous} to ${edit} from previous of ${by} ${target} merge ${merge === 'merge' ? true : false}`)
        return res.json(docA.tree)
      }
      console.log(`Can't modity word ${previous} to ${edit} from previous of ${target} because ${edit} exist`)
      return res.status(304).end()
    } else {
      if (!docA.get(`tree.${edit}.${' '}`)) {
        await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
      }
      const treeAprev = docA.get(`tree.${previous}`)
      const treeAedit = docA.get(`tree.${edit}`)
      const keyEdit = Object.keys(treeAedit)
      if (merge === 'merge') {
        Object.keys(treeAprev).forEach(key => {
          if (keyEdit.includes(key)) {
            treeAedit[key].freq = treeAedit[key].freq > treeAprev[key].freq ? treeAedit[key].freq : treeAprev[key].freq
          } else {
            treeAedit[key] = treeAprev[key]
          }
        })
      }
      await docA.$set(`tree.${previous}`, undefined, { strict: true })
      await docA.save()
    }
  }
  console.log(`Modity word ${previous} to ${edit} from previous of ${by} ${target} merge ${merge === 'merge' ? true : false}`)  
  res.json(docA.tree)
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดของคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words               |
// └────────────────────────────────────────────────────────────────────────────┘

const patchPrev = async (req, res) => {
  const data = req.body
  let { by, target, previous } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Patch word ${previous} as previous of ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.error(`Can't Patch word previous ${previous} of ${by} ${target} from ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  const result = await doc.$set(`tree.${previous}`, data, { strict: true })
  await doc.save()
  console.log(`Patch word previous ${previous} of ${by} ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
  res.json(result.get(`tree.${previous}`))
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                             |
// └────────────────────────────────────────────────────────────────────────────┘

const removePrev = async (req, res) => {
  let { by, target, previous } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Remove word previous ${previous} from ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.error(`Can't remove word previous ${previous} from ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (doc.get(`tree.${previous}`)) {
    await doc.$set(`tree.${previous}`, undefined, { strict: true })
    console.log(`Remove word previous ${previous} from ${target} successfully`)
    const newDoc = await doc.save()
    return res.json(newDoc)
  }
  console.error(`Can't remove word previous ${previous} from ${target} because ${previous} don't exist`)
  return res.status(304).end()
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เพิ่มคำถัดไปในคำศัพท์ 1 รายการจาก collection words                              |
// └────────────────────────────────────────────────────────────────────────────┘

const addNext = async (req, res) => {
  let { by, target, previous, next } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Add word ${next} as next of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.error(`Can't add word next ${next} to ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (!doc.get(`tree.${previous}`)) {
    const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
  }
  if (!doc.get(`tree.${previous}.${next}`)) {
    const result = await doc.$set(`tree.${previous}.${next}`, { freq: 1, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    console.log(`Add word ${next} as next of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
    const newDoc = await doc.save()
    return res.json({ [previous]: { [next]: newDoc.tree[previous][next] } })
  }
  console.error(`Can't add word next ${next} to ${target} because ${next} exist`)
  res.status(304).end()
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขคำถัดไปในคำศัพท์ 1 รายการจาก collection words                             |
// └────────────────────────────────────────────────────────────────────────────┘

const modNext = async (req, res) => {
  let { by, target, previous, next, edit } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  edit = remove_spacails(decodeURIComponent(edit))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Modify word ${next} as next of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const docA = await words.findOne(fillter).catch((err) => err)
  if (docA && 'message' in docA) {
    console.error(docA)
    return res.status(500).send(docA.message)
  }
  if (!docA) {
    console.error(`Can't Modify word next ${next} of ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (!docA.get(`tree.${previous}`)) {
    const result = await docA.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
  }

  if (!docA.get(`tree.${previous}.${next}`)) {
    await docA.$set(`tree.${previous}.${next}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    console.log(`Add word ${next} as next of ${previous} in ${by} ${target} successfully`)
  }

  const docB = await words.findOne({ name: edit }).catch((err) => err)
  if (docB && 'message' in docB) {
    console.error(docB)
    return res.status(500).send(docB.message)
  }

  if (!docB) {
    console.log('add', edit)
    const created = await words.create({ name: edit }).catch((err) => err)
    if (created && 'message' in created) {
      console.error(created)
      return res.status(500).send(created.message)
    }
    if (!created) return res.status(304).end()
  }

  if (!docA.get(`tree.${previous}.${edit}`)) {
    await docA.$set(`tree.${previous}.${edit}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
  }

  const nxt = Object.assign({}, docA.get(`tree.${previous}.${next}`))
  const merge = Object.assign({}, docA.get(`tree.${previous}.${edit}`), nxt)
  await docA.$set(`tree.${previous}.${next}`, undefined, { strict: true })
  await docA.$set(`tree.${previous}.${edit}`, merge, { strict: true })
  await docA.save()
  console.log(`Add word next ${next} to ${edit} successfully`)
  res.json({ [previous]: { [edit]: docA.get(`tree.${previous}.${edit}`) } })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ แก้ไขข้อมูลทั้งหมดในคำถัดไปในคำศัพท์ 1 รายการจาก collection words                  |
// └────────────────────────────────────────────────────────────────────────────┘

const patchNext = async (req, res) => {
  const data = req.body
  let { by, target, previous, next } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Patch word next ${next} of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.error(`Can't patch word next ${next} to ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (!doc.get(`tree.${previous}`)) {
    const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' }, { strict: true })
    console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
  }
  const result = await doc.$set(`tree.${previous}.${next}`, data, { strict: true })
  console.log(`Patch word next ${next} of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
  const newDoc = await doc.save()
  res.json({ [previous]: { [next]: newDoc.tree[previous][next] } })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ ลบคำถัดไปในคำศัพท์ 1 รายการจาก collection words                               |
// └────────────────────────────────────────────────────────────────────────────┘

const removeNext = async (req, res) => {
  let { by, target, previous, next } = req.params
  by = remove_spacails(decodeURIComponent(by))
  target = remove_spacails(decodeURIComponent(target))
  previous = remove_spacails(decodeURIComponent(previous))
  next = remove_spacails(decodeURIComponent(next))
  fillter = (by == 'id' ? isId(target) : { name: target })
  if ('statusCode' in fillter) {
    console.error(`Remove word next ${next} in ${by} ${target} status code ${fillter.statusCode}`)
    return res.status(fillter.statusCode).end()
  }
  const doc = await words.findOne(fillter).then((doc) => doc).catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    console.error(`Can't remove word next ${next} from ${target} because ${target} don't exist`)
    return res.status(304).end()
  }
  if (!doc.get(`tree.${previous}`)) {
    console.error(`Can't remove word next ${next} from ${target} because previous ${previous} don't exist`)
    return res.status(304).end()
  }
  if (!doc.get(`tree.${previous}.${next}`)) {
    console.error(`Can't remove word next ${next} from ${target} because next ${next} don't exist`)
    return res.status(304).end()
  }
  const result = await doc.$set(`tree.${previous}.${next}`, undefined, { strict: true })
  await doc.save()
  console.log(`Patch word next ${next} of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
  res.json({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูสรุปคำศัพท์ทั้งหมดจาก collection statistics                                |
// └────────────────────────────────────────────────────────────────────────────┘

const stat = async (req, res) => {
  const doc = await statistics.findOne().catch((err) => err)
  if (doc && 'message' in doc) {
    console.error(doc)
    return res.status(500).send(doc.message)
  }
  if (!doc) {
    const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
    if (first && 'message' in first) {
      console.error(first)
      return res.status(500).send(first.message)
    }
    if (!first) {
      console.log('Dictionary is empty')
      return res.status(304).end()
    }
    const lastAdd = await words.find().sort({ create: 'desc' }).limit(10).catch((err) => err)
    if (lastAdd && 'message' in lastAdd) {
      console.error(lastAdd)
      return res.status(500).send(lastAdd.message)
    }
    const lastMod = await words.find().sort({ modified: 'desc' }).limit(10).catch((err) => err)
    if (lastMod && 'message' in lastMod) {
      console.error(lastMod)
      return res.status(500).send(lastMod.message)
    }
    const all = await words.find().catch((err) => err)
    if (all && 'message' in all) {
      console.error(all)
      return res.status(500).send(all.message)
    }
    const data = {
      total: all.length,
      first: {
        create  : first.get('create'),
        modified: first.get('modified'),
        populate: first.get('populate'),
        name    : first.get('name'),
        previous: Object.keys(first.get(`tree`)),
        next    : Object.keys(first.get(`tree.${' '}`))
      },
      lastAdd: Array.from(lastAdd.map((chunk)=>{
        return {
          create  : chunk.get('create'),
          modified: chunk.get('modified'),
          populate: chunk.get('populate'),
          name    : chunk.get('name'),
          previous: Object.keys(chunk.get(`tree`)),
          next    : Object.keys(chunk.get(`tree.${' '}`))
        }
      })),
      lastMod: Array.from(lastMod.map((chunk)=>{
        return {
          create  : chunk.get('create'),
          modified: chunk.get('modified'),
          populate: chunk.get('populate'),
          name    : chunk.get('name'),
          previous: Object.keys(chunk.get(`tree`)),
          next    : Object.keys(chunk.get(`tree.${' '}`))
        }
      })),
      lastDel: []
    }
    const result = await statistics.create(data).catch((err) => err)
    if (result && 'message' in result) {
      console.error(result)
      return res.status(500).send(result.message)
    }
    console.log(`Add statistics in to Dictionary`)
    res.status(200).json(data)
  }

  const data = {
    total: doc.get('total'),
    first: {
      create  : doc.get('first.create'),
      modified: doc.get('first.modified'),
      populate: doc.get('first.populate'),
      name    : doc.get('first.name'),
      previous: doc.get('first.previous'),
      next    : doc.get('first.next')
    },
    lastAdd: Array.from(doc.get('lastAdd').map((chunk) => {
      return {
        create:   chunk.create,
        modified: chunk.modified,
        populate: chunk.populate,
        name    : chunk.name,
        previous: chunk.previous,
        next    : chunk.next
      }
    })),
    lastMod: Array.from(doc.get('lastMod').map((chunk) => {
      return {
        create:   chunk.create,
        modified: chunk.modified,
        populate: chunk.populate,
        name    : chunk.name,
        previous: chunk.previous,
        next    : chunk.next
      }
    })),
    lastDel: Array.from(doc.get('lastDel').map((chunk) => {
      return {
        create:   chunk.create,
        modified: chunk.modified,
        populate: chunk.populate,
        name    : chunk.name,
        previous: chunk.previous,
        next    : chunk.next
      }
    }))
  }
  res.status(200).json(data)
}


module.exports = {
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
}