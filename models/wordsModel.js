const mongoose = require('mongoose')

const collection = 'words'

const wordsSchema = new mongoose.Schema({
  create    : { type: Number, default: 0 },                   // เวลาที่ถูกสร้าง
  modified  : { type: Number, default: 0 },                   // เวลาที่แก้ไขล่าสุด
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

const words = mongoose.model(collection, wordsSchema)

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
    const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
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
      await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
    } else {
      const treeA = docA.get('tree')
      await docA.$set(`tree.${edit}`, treeA[previous])
      await docA.$set(`tree.${previous}`, undefined, { strict: true })
    }
    await docA.save()
  } else {
    if (!docA.get(`tree.${previous}`)) {
      if (!docA.get(`tree.${edit}.${' '}`)) {
        await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
        await docA.$set(`tree.${previous}`, undefined, { strict: true })
        await docA.save()
        console.log(`Modity word ${previous} to ${edit} from previous of ${by} ${target} merge ${merge === 'merge' ? true : false}`)
        return res.json(docA.tree)
      }
      console.log(`Can't modity word ${previous} to ${edit} from previous of ${target} because ${edit} exist`)
      return res.status(304).end()
    } else {
      if (!docA.get(`tree.${edit}.${' '}`)) {
        await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
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



module.exports = {
  add,
  addPrev,
  modPrev,
  patch,
  patchKey,
  removePrev,
  remove,
  search,
  views,
  view
}