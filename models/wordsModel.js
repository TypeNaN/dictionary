const mongoose = require('mongoose')

const collection = 'words'
// const collection_stat = 'statistics'
const collection_removed = 'words_removed'

const wordsSchema = new mongoose.Schema({
  create    : { type: Number, default: 0 },                   // เวลาที่ถูกสร้าง
  modified  : { type: Number, default: 0 },                   // เวลาที่แก้ไขล่าสุด
  counter   : { type: Number, default: 0 },                   // จำนวนครั้งที่ถูกใช้
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
  strict: true
})

// const wordsStat = new mongoose.Schema({
//   create  : { type: Number, default: 0 },
//   modified: { type: Number, default: 0 },
//   counter : { type: Number, default: 0 },
//   name    : { type: String, required: true, unique: true},
//   previous: { type: [String], default: [] },
//   next    : { type: [String], default: [] }
// })

// const statSchema = new mongoose.Schema({
//   total   : { type: Number, default: 0 },
//   first   : { type: wordsStat },
//   lastAdd : { type: [wordsStat] },
//   lastMod : { type: [wordsStat] },
//   lastDel : { type: [wordsStat] },
//   lastHigh: { type: [wordsStat] },
//   lastLow : { type: [wordsStat] },
// },
// {
//   versionKey: false,
//   strict: true,
//   collection_stat
// })

const wordsRemovedSchema = new mongoose.Schema({
  create  : { type: Number, default: 0 },
  modified: { type: Number, default: 0 },
  counter : { type: Number, default: 0 },
  name    : { type: String, required: true, unique: true},
  previous: { type: [String], default: [] },
  next    : { type: [String], default: [] }
},
{
  versionKey: false,
  strict: true
})

const words = mongoose.model(collection, wordsSchema)
// const statistics = mongoose.model(collection_stat, statSchema)
const wordsRemoved = mongoose.model(collection_removed, wordsRemovedSchema)

const remove_spacails = (data) => data.replace(/[~!@#$%^&*\(\)+=\[\]\{\};:\`\'\"\\|,.<>/?]/g, '')
const isId = (id) => mongoose.isObjectIdOrHexString(id) ? { _id: id } : { statusCode: 400 }
const hline = '\n────────────────────────────────────────────────────────────────────────────────\n'

const field_extract = (data) => (data ? {
  create  : data.create,
  modified: data.modified,
  counter : data.counter,
  name    : data.name,
  previous: Object.keys(data.tree),
  next    : Object.keys(data.tree[' '])
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

// const field_extract_removed = (data) => ({
//   create  : data.create,
//   modified: data.modified,
//   counter : data.counter,
//   name    : data.name,
//   previous: data.previous,
//   next    : data.next
// })

const field_extracts_removed = (data) => Array.from(data.map((chunk) => ({
  create  : chunk.create,
  modified: chunk.modified,
  counter : chunk.counter,
  name    : chunk.name,
  previous: chunk.previous,
  next    : chunk.next
})))


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เพิ่มคำศัพท์ลงใน collection words                                              |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_add = async (req, res) => {
//   let { name } = req.params
//   name = remove_spacails(decodeURIComponent(name))
//   const doc = await words.create({ name: name }).catch((err) => err)
//   if (doc && 'message' in doc) {
//     if (doc.message.startsWith('E11000 duplicate key error collection')) {
//       console.log(`Can't add word ${name} in to Dictionary ${name} is exist`)
//       return res.status(304).end()
//     }
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   console.log(`Add word ${name} in to Dictionary`)
//   const stat = await statistics.findOne().catch((err) => err)
//   if (stat && 'message' in stat) {
//     console.error(stat)
//     return res.status(500).send(stat.message)
//   }
//   const lastAdd = await words.find().sort({ create: 'desc' }).limit(100).catch((err) => err)
//   if (lastAdd && 'message' in lastAdd) {
//     console.error(lastAdd)
//     return res.status(500).send(lastAdd.message)
//   }
//   const lastMod = await words.find().sort({ modified: 'desc' }).limit(100).catch((err) => err)
//   if (lastMod && 'message' in lastMod) {
//     console.error(lastMod)
//     return res.status(500).send(lastMod.message)
//   }
//   const lastHigh = await words.find().sort({ counter: 'desc' }).limit(100).catch((err) => err)
//   if (lastHigh && 'message' in lastHigh) {
//     console.error(lastHigh)
//     return res.status(500).send(lastHigh.message)
//   }
//   const lastLow = await words.find().sort({ counter: 'asc' }).limit(100).catch((err) => err)
//   if (lastLow && 'message' in lastLow) {
//     console.error(lastLow)
//     return res.status(500).send(lastLow.message)
//   }
//   if (!stat) {
//     const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
//     if (first && 'message' in first) {
//       console.error(first)
//       return res.status(500).send(first.message)
//     }
//     if (!first) {
//       console.log('Dictionary is empty')
//       return res.status(304).end()
//     }
//     const all = await words.find().catch((err) => err)
//     if (all && 'message' in all) {
//       console.error(all)
//       return res.status(500).send(all.message)
//     }
//     const data = {
//       total   : all.length,
//       first   : {
//         create  : first.get('create'),
//         modified: first.get('modified'),
//         counter : first.get('counter'),
//         name    : first.get('name'),
//         previous: Object.keys(first.get(`tree`)),
//         next    : Object.keys(first.get(`tree.${' '}`))
//       },
//       lastAdd : field_extracts(lastAdd),
//       lastMod : field_extracts(lastMod),
//       lastDel : [],
//       lastHigh: field_extracts(lastHigh),
//       lastLow : field_extracts(lastLow)
//     }
//     const result = await statistics.create(data).catch((err) => err)
//     if (result && 'message' in result) {
//       console.error(result)
//       return res.status(500).send(result.message)
//     }
//     console.log(`Add statistics in to Dictionary`)
//     return res.status(200).json(doc)
//   }
//   await stat.$set('total', parseInt(stat.get('total')) + 1)
//   await stat.$set('lastAdd', field_extracts(lastAdd))
//   await stat.$set('lastMod', field_extracts(lastMod))
//   await stat.$set('lastHigh', field_extracts(lastHigh))
//   await stat.$set('lastLow', field_extracts(lastLow))
//   await stat.save()
//   res.status(200).json(doc)
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เรียกดูคำศัพท์ 1 รายการจาก collection words                                     |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_view = async (req, res) => {
//   let { by, target } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`View word by ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   words.findOne(fillter).then((result) => {
//     console.log(`View word by ${by} ${target}`)
//     res.status(200).json(result)
//   }).catch((err) => {
//     console.error(err)
//     res.status(500).send(err.message)
//   })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เรียกดูคำศัพท์ทั้งหมดจาก collection words                                        |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_views = async (req, res) => {
//   words.find().then((result) => {
//     console.log(`View all ${result.length} words`)
//     res.status(200).json(result)
//   }).catch((err) => {
//     console.error(err)
//     res.status(500).send(err.message)
//   })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เรียกดูคำศัพท์ทั้งหมดที่ชึ้นต้นด้วยคำค้นหาจาก collection words                         |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_search = async (req, res) => {
//   let { name } = req.params
//   name = remove_spacails(decodeURIComponent(name))
//   words.find({ name: { $regex: name, $options: 'i' } }).then((result) => {
//     console.log(`Search words match ${name}`)
//     res.status(200).json(result)
//   }).catch((err) => {
//     console.error(err)
//     res.status(500).send(err.message)
//   })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ ลบคำศัพท์ 1 รายการจาก collection words                                       |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_remove = async (req, res) => {
//   let { by, target } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Remove word by ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.log(`Can't remove word ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   const data = {
//     create  : doc.create,
//     modified: doc.modified,
//     counter : doc.counter,
//     name    : doc.name,
//     previous: Object.keys(doc.tree),
//     next    : Object.keys(doc.tree[' '])
//   }
//   const del = await words.deleteOne(fillter, {rawResult: true}).catch((err) => err)
//   if (del && 'message' in del) {
//     return res.status(500).send(del.message)
//   }
//   if ('deletedCount' in del) {
//     if (del.deletedCount > 0) {
//       console.log(`Remove word ${target}`)
//       const stat = await statistics.findOne().catch((err) => err)
//       if (stat && 'message' in stat) {
//         console.error(stat)
//         return res.status(500).send(stat.message)
//       }
//       if (stat.lastDel.length > 99) await stat.lastDel.pull(stat.lastDel[99])
//       await stat.lastDel.push(data)
//       await stat.lastDel.sort((a, b) => b.modified - a.modified)
//       await stat.save()
//     }
//   }
//   res.status(200).json(del)
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขข้อมูลทั้งหมดของคำศัพท์ 1 รายการจาก collection words                         |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_patch = async (req, res) => {
//   const data = req.body
//   let { by, target } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Patch word by ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   words.findOneAndUpdate(fillter, data, {
//     new: false,
//     upsert: true,
//     rawResult: true 
//   }).then((result) => {
//     console.log(`Patch word by ${by} ${target} existing ${result.lastErrorObject.updatedExisting} updated ${result.ok}${hline}Old data ${JSON.stringify(result.value)}${hline}Patch ${JSON.stringify(data)}${hline}`)
//     res.json({ original: result.value, patch: data })
//   }).catch ((err) => {
//     console.error(err)
//     res.status(500).send(err.message)
//   })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขข้อมูลในคีย์ที่กำหนดของคำศัพท์ 1 รายการจาก collection words                    |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_patchKey = async (req, res) => {
//   const data = req.body
//   let { by, target, key } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   key = remove_spacails(decodeURIComponent(key))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Patch word by ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   words.findOneAndUpdate(fillter, {[key]: data[key] }, {
//     new: false,
//     upsert: true,
//     rawResult: true
//   }).then((result) => {
//     console.log(`Patch word by ${by} ${target} key ${key} existing ${result.lastErrorObject.updatedExisting} updated ${result.ok}${hline}Old data ${JSON.stringify(result.value)}${hline}Patch ${JSON.stringify(data)}${hline}`)
//     res.json({ original: result.value, patch: data })
//   }).catch((err) => {
//     console.error(err)
//     res.status(500).send(err.message)
//   })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เพิ่มคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                            |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_addPrev = async (req, res) => {
//   let { by, target, previous } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Add word ${previous} as previous of ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.log(`Can't add ${previous} as previous of ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (!doc.get(`tree.${previous}`)) {
//     const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     const newDoc = await doc.save()
//     console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
//     return res.json(newDoc)
//   }
//   console.log(`Can't add ${previous} as previous of ${target} because ${previous} existing`)
//   res.status(304).end()
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                           |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_modPrev = async (req, res) => {
//   let { by, target, previous, edit, merge } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   edit = remove_spacails(decodeURIComponent(edit))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Modity word ${previous} to ${edit} from previous of ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const docA = await words.findOne(fillter).catch((err) => err)
//   if (docA && 'message' in docA) {
//     console.error(docA)
//     return res.status(500).send(docA.message)
//   }
//   if (!docA) {
//     console.error(`Can't modify word ${previous} to ${edit} from previous of ${target} because ${target} don't exist`) 
//     return res.status(304).end()
//   }
//   if (!docA.get(`tree.${edit}`)) {
//     if (!docA.get(`tree.${previous}`)) {
//       await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     } else {
//       const treeA = docA.get('tree')
//       await docA.$set(`tree.${edit}`, treeA[previous])
//       await docA.$set(`tree.${previous}`, undefined)
//     }
//     await docA.save()
//   } else {
//     if (!docA.get(`tree.${previous}`)) {
//       if (!docA.get(`tree.${edit}.${' '}`)) {
//         await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//         await docA.$set(`tree.${previous}`, undefined)
//         await docA.save()
//         console.log(`Modity word ${previous} to ${edit} from previous of ${by} ${target} merge ${merge === 'merge' ? true : false}`)
//         return res.json(docA.tree)
//       }
//       console.log(`Can't modity word ${previous} to ${edit} from previous of ${target} because ${edit} exist`)
//       return res.status(304).end()
//     } else {
//       if (!docA.get(`tree.${edit}.${' '}`)) {
//         await docA.$set(`tree.${edit}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//       }
//       const treeAprev = docA.get(`tree.${previous}`)
//       const treeAedit = docA.get(`tree.${edit}`)
//       const keyEdit = Object.keys(treeAedit)
//       if (merge === 'merge') {
//         Object.keys(treeAprev).forEach(key => {
//           if (keyEdit.includes(key)) {
//             treeAedit[key].freq = treeAedit[key].freq > treeAprev[key].freq ? treeAedit[key].freq : treeAprev[key].freq
//           } else {
//             treeAedit[key] = treeAprev[key]
//           }
//         })
//       }
//       await docA.$set(`tree.${previous}`, undefined)
//       await docA.save()
//     }
//   }
//   console.log(`Modity word ${previous} to ${edit} from previous of ${by} ${target} merge ${merge === 'merge' ? true : false}`)  
//   res.json(docA.tree)
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขข้อมูลทั้งหมดของคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words               |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_patchPrev = async (req, res) => {
//   const data = req.body
//   let { by, target, previous } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Patch word ${previous} as previous of ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.error(`Can't Patch word previous ${previous} of ${by} ${target} from ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   const result = await doc.$set(`tree.${previous}`, data)
//   await doc.save()
//   console.log(`Patch word previous ${previous} of ${by} ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
//   res.json(result.get(`tree.${previous}`))
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ ลบคำก่อนหน้าในคำศัพท์ 1 รายการจาก collection words                             |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_removePrev = async (req, res) => {
//   let { by, target, previous } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Remove word previous ${previous} from ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.error(`Can't remove word previous ${previous} from ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (doc.get(`tree.${previous}`)) {
//     await doc.$set(`tree.${previous}`, undefined)
//     console.log(`Remove word previous ${previous} from ${target} successfully`)
//     const newDoc = await doc.save()
//     return res.json(newDoc)
//   }
//   console.error(`Can't remove word previous ${previous} from ${target} because ${previous} don't exist`)
//   return res.status(304).end()
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เพิ่มคำถัดไปในคำศัพท์ 1 รายการจาก collection words                              |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_addNext = async (req, res) => {
//   let { by, target, previous, next } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   next = remove_spacails(decodeURIComponent(next))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Add word ${next} as next of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.error(`Can't add word next ${next} to ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (!doc.get(`tree.${previous}`)) {
//     const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
//   }
//   if (!doc.get(`tree.${previous}.${next}`)) {
//     const result = await doc.$set(`tree.${previous}.${next}`, { freq: 1, feel: 0, type: '', posi: '', mean: '' })
//     console.log(`Add word ${next} as next of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
//     const newDoc = await doc.save()
//     return res.json({ [previous]: { [next]: newDoc.tree[previous][next] } })
//   }
//   console.error(`Can't add word next ${next} to ${target} because ${next} exist`)
//   res.status(304).end()
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขคำถัดไปในคำศัพท์ 1 รายการจาก collection words                             |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_modNext = async (req, res) => {
//   let { by, target, previous, next, edit } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   next = remove_spacails(decodeURIComponent(next))
//   edit = remove_spacails(decodeURIComponent(edit))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Modify word ${next} as next of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const docA = await words.findOne(fillter).catch((err) => err)
//   if (docA && 'message' in docA) {
//     console.error(docA)
//     return res.status(500).send(docA.message)
//   }
//   if (!docA) {
//     console.error(`Can't Modify word next ${next} of ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (!docA.get(`tree.${previous}`)) {
//     const result = await docA.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
//   }
//   if (!docA.get(`tree.${previous}.${next}`)) {
//     await docA.$set(`tree.${previous}.${next}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     console.log(`Add word ${next} as next of ${previous} in ${by} ${target} successfully`)
//   }
//   const docB = await words.findOne({ name: edit }).catch((err) => err)
//   if (docB && 'message' in docB) {
//     console.error(docB)
//     return res.status(500).send(docB.message)
//   }
//   if (!docB) {
//     console.log('add', edit)
//     const created = await words.create({ name: edit }).catch((err) => err)
//     if (created && 'message' in created) {
//       console.error(created)
//       return res.status(500).send(created.message)
//     }
//     if (!created) return res.status(304).end()
//   }
//   if (!docA.get(`tree.${previous}.${edit}`)) {
//     await docA.$set(`tree.${previous}.${edit}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//   }

//   const nxt = Object.assign({}, docA.get(`tree.${previous}.${next}`))
//   const merge = Object.assign({}, docA.get(`tree.${previous}.${edit}`), nxt)
//   await docA.$set(`tree.${previous}.${next}`, undefined)
//   await docA.$set(`tree.${previous}.${edit}`, merge)
//   await docA.save()
//   console.log(`Add word next ${next} to ${edit} successfully`)
//   res.json({ [previous]: { [edit]: docA.get(`tree.${previous}.${edit}`) } })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ แก้ไขข้อมูลทั้งหมดในคำถัดไปในคำศัพท์ 1 รายการจาก collection words                  |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_patchNext = async (req, res) => {
//   const data = req.body
//   let { by, target, previous, next } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   next = remove_spacails(decodeURIComponent(next))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Patch word next ${next} of ${previous} in ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.error(`Can't patch word next ${next} to ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (!doc.get(`tree.${previous}`)) {
//     const result = await doc.$set(`tree.${previous}.${' '}`, { freq: 0, feel: 0, type: '', posi: '', mean: '' })
//     console.log(`Add ${previous} as previous of ${target} successfully ${JSON.stringify(result.get(`tree.${previous}`))}`)
//   }
//   const result = await doc.$set(`tree.${previous}.${next}`, data)
//   console.log(`Patch word next ${next} of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
//   const newDoc = await doc.save()
//   res.json({ [previous]: { [next]: newDoc.tree[previous][next] } })
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ ลบคำถัดไปในคำศัพท์ 1 รายการจาก collection words                               |
// // └────────────────────────────────────────────────────────────────────────────┘

// const rest_removeNext = async (req, res) => {
//   let { by, target, previous, next } = req.params
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   previous = remove_spacails(decodeURIComponent(previous))
//   next = remove_spacails(decodeURIComponent(next))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     console.error(`Remove word next ${next} in ${by} ${target} status code ${fillter.statusCode}`)
//     return res.status(fillter.statusCode).end()
//   }
//   const doc = await words.findOne(fillter).then((doc) => doc).catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     console.error(`Can't remove word next ${next} from ${target} because ${target} don't exist`)
//     return res.status(304).end()
//   }
//   if (!doc.get(`tree.${previous}`)) {
//     console.error(`Can't remove word next ${next} from ${target} because previous ${previous} don't exist`)
//     return res.status(304).end()
//   }
//   if (!doc.get(`tree.${previous}.${next}`)) {
//     console.error(`Can't remove word next ${next} from ${target} because next ${next} don't exist`)
//     return res.status(304).end()
//   }
//   const result = await doc.$set(`tree.${previous}.${next}`, undefined)
//   await doc.save()
//   console.log(`Patch word next ${next} of ${previous} in ${by} ${target} successfully ${JSON.stringify({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })}`)
//   res.json({ [previous]: { [next]: result.get(`tree.${previous}.${next}`) } })
// }


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ เรียกดูสรุปคำศัพท์ทั้งหมดจาก collection statistics                                |
// └────────────────────────────────────────────────────────────────────────────┘

// const rest_stat = async (req, res) => {
//   const doc = await statistics.findOne().catch((err) => err)
//   if (doc && 'message' in doc) {
//     console.error(doc)
//     return res.status(500).send(doc.message)
//   }
//   if (!doc) {
//     const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
//     if (first && 'message' in first) {
//       console.error(first)
//       return res.status(500).send(first.message)
//     }
//     if (!first) {
//       console.log('Dictionary is empty')
//       return res.status(304).end()
//     }
//     const lastAdd = await words.find().sort({ create: 'desc' }).limit(100).catch((err) => err)
//     if (lastAdd && 'message' in lastAdd) {
//       console.error(lastAdd)
//       return res.status(500).send(lastAdd.message)
//     }
//     const lastMod = await words.find().sort({ modified: 'desc' }).limit(100).catch((err) => err)
//     if (lastMod && 'message' in lastMod) {
//       console.error(lastMod)
//       return res.status(500).send(lastMod.message)
//     }
//     const lastHigh = await words.find().sort({ counter: 'desc' }).limit(100).catch((err) => err)
//     if (lastHigh && 'message' in lastHigh) {
//       console.error(lastHigh)
//       return res.status(500).send(lastHigh.message)
//     }
//     const lastLow = await words.find().sort({ counter: 'asc' }).limit(100).catch((err) => err)
//     if (lastLow && 'message' in lastLow) {
//       console.error(lastLow)
//       return res.status(500).send(lastLow.message)
//     }
//     const total = await words.countDocuments()
//     const data = {
//       total: total,
//       first   : field_extract(first),
//       lastAdd : field_extracts(lastAdd),
//       lastMod : field_extracts(lastMod),
//       lastDel : [],
//       lastHigh: field_extracts(lastHigh),
//       lastLow : field_extracts(lastLow)
//     }
//     const result = await statistics.create(data).catch((err) => err)
//     if (result && 'message' in result) {
//       console.error(result)
//       return res.status(500).send(result.message)
//     }
//     console.log(`Add statistics in to Dictionary`)
//     return res.status(200).json(data)
//   }
//   const data = {
//     total   : doc.get('total'),
//     first   : field_extract_removed(doc.get('first')),
//     lastAdd : field_extracts_removed(doc.get('lastAdd')),
//     lastMod : field_extracts_removed(doc.get('lastMod')),
//     lastDel : field_extracts_removed(doc.get('lastDel')),
//     lastHigh: field_extracts_removed(doc.get('lastHigh')),
//     lastLow : field_extracts_removed(doc.get('lastLow'))
//   }
//   res.status(200).json(data)
// }






// ┌────────────────────────────────────────────────────────────────────────────┐
// │ จัดการข้อมูลผ่าน socket requests                                               |
// └────────────────────────────────────────────────────────────────────────────┘

class wordsIO {
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
      process(...data).then((chunk) => {
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
    socket.on('close', () => console.log('socket', socket.id, 'closed'))
  }
}


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

//// stat async await
// const stat = async () => {
//   const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
//   if (first && 'message' in first) return E500('word-stat-error', first)
//   if (!first) return E404('word-stat-error', 'Dictionary is empty')
//   const total = await words.countDocuments()
//   const lastAdd = await words.find().sort({ create: 'desc' }).limit(100).catch((err) => err)
//   if (lastAdd && 'message' in lastAdd) console.error(lastAdd)
//   const lastMod = await words.find().sort({ modified: 'desc' }).limit(100).catch((err) => err)
//   if (lastMod && 'message' in lastMod) console.error(lastMod)
//   const lastHigh = await words.find().sort({ counter: 'desc' }).limit(100).catch((err) => err)
//   if (lastHigh && 'message' in lastHigh) console.error(lastHigh)
//   const lastLow = await words.find().sort({ counter: 'asc' }).limit(100).catch((err) => err)
//   if (lastLow && 'message' in lastLow) console.error(lastLow)
//   const lastDel = await wordsRemoved.find().sort({ modified: 'desc' }).limit(100).catch((err) => err)
//   if (lastDel && 'message' in lastDel) console.error(lastDel)
//   const data = {
//     total    : total,
//     first    : field_extract(first),
//     lastAdd  : field_extracts(lastAdd),
//     lastMod  : field_extracts(lastMod),
//     lastDel  : field_extracts_removed(lastDel),
//     lastHigh : field_extracts(lastHigh),
//     lastLow  : field_extracts(lastLow)
//   }
//   return R200('word-stat-success', 'Get words statistics success', data)
// }

//// stat full async and hell
// const stat = async () => {
//   let total
//   let first
//   let lastAdd
//   let lastMod
//   let lastHigh

//   return words.findOne().sort({ create: 'asc' }).then((doc) => {
//     if (!doc) return E404('word-stat-error', 'Dictionary is empty')
//     first = doc
//     return words.countDocuments().then((num) => {
//       total = num
//       return words.find().sort({ create: 'desc' }).limit(100).then((doc) => {
//         lastAdd = doc
//         return words.find().sort({ modified: 'desc' }).limit(100).then((doc) => {
//           lastMod = doc
//           return words.find().sort({ counter: 'desc' }).limit(100).then((doc) => {
//             lastHigh = doc
//             return words.find().sort({ counter: 'asc' }).limit(100).then((doc) => {
//               lastLow = doc
//               return wordsRemoved.find().sort({ modified: 'desc' }).limit(100).then((doc) => {
//                 lastDel = doc
//                 const data = {
//                   total    : total,
//                   first    : field_extract(first),
//                   lastAdd  : field_extracts(lastAdd),
//                   lastMod  : field_extracts(lastMod),
//                   lastDel  : field_extracts_removed(lastDel),
//                   lastHigh : field_extracts(lastHigh),
//                   lastLow  : field_extracts(lastLow)
//                 }
//                 return R200('word-stat-success', 'Get words statistics success', data)
//               }).catch((err) => E500('word-stat-error', err))
//             }).catch((err) => E500('word-stat-error', err))
//           }).catch((err) => E500('word-stat-error', err))
//         }).catch((err) => E500('word-stat-error', err))
//       }).catch((err) => E500('word-stat-error', err))
//     }).catch((err) => E500('word-stat-error', err))
//   }).catch((err) => E500('word-stat-error', err))
// }


//// stat full async by Promise
const stat = async () => {
  return Promise.all([
    words.countDocuments(),
    words.findOne().sort({ create: 'asc' }),
    words.find().sort({ create: 'desc' }).limit(100),
    words.find().sort({ modified: 'desc' }).limit(100),
    words.find().sort({ counter: 'desc' }).limit(100),
    words.find().sort({ counter: 'asc' }).limit(100),
    wordsRemoved.find().sort({ modified: 'desc' }).limit(100)
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
  let { skip, end, sort } = data
  let { key, by } = sort
  if (typeof skip !== Number || skip < 0) skip = 0
  if (typeof end !== Number || end < skip) end = skip + 100
  if (sort) {
    if (!key) key = 'create'
    if (!by) by = 'asc'
    return words.find().sort({ [key]: by }).skip(skip).limit(end).then((docs) => {
      if (!docs) return E404('word-views-error', `View words are not found`, docs)
      return R200('word-views-success', `View words skip ${skip} end ${end} sort ${sort.key} by ${sort.by}`, docs)
    }).catch((err) => {
      return E500('word-views-error', err)
    })
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
    wordsRemoved.findOne(fillter).then((docDel) => {
      if (!docDel) {
        docDel = new wordsRemoved(raw)
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

  // const doc = await words.findOne(fillter).catch((err) => err)
  // if (doc && 'message' in doc) return E500('word-remove-error', doc)
  // if (!doc) return E304('word-remove-error', `Can't remove word ${target} because ${target} don't exist`)
  // const raw = {
  //   create: doc.create,
  //   modified: Math.floor(new Date().getTime()),
  //   counter: doc.counter,
  //   name: doc.name,
  //   previous: Object.keys(doc.tree),
  //   next: Object.keys(doc.tree[' '])
  // }
  // const del = await words.deleteOne(fillter).catch((err) => err)
  // if (del && 'message' in del) return E500('word-remove-error', del)
  // if ('deletedCount' in del) {
  //   if (del.deletedCount > 0) {
  //     const stat = await statistics.findOne().catch((err) => err)
  //     if (stat && 'message' in stat) return E500('word-remove-error', stat)
  //     if (stat.first.name == raw.name) {
  //       stat.first = {}
  //       const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
  //       if (first && 'message' in first) console.error(first)
  //       if (!first) {
  //         console.log('Dictionary is empty')
  //       } else {
  //         stat.first = field_extract(first)
  //       }
  //     }
  //     if (stat.lastDel.length > 99) await stat.lastDel.pull(stat.lastDel[99])
  //     await stat.lastDel.push(raw)
  //     await stat.lastDel.sort((a, b) => b.modified - a.modified)
  //     await stat.save()
  //   }
  // }
  // return R200('word-remove-success', `Remove word ${target} from dictionary`, raw)




// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ เพิ่มคำศัพท์ลงใน collection words                                              |
// // └────────────────────────────────────────────────────────────────────────────┘

// const add = async (data) => {
//   let { name } = data
//   name = remove_spacails(decodeURIComponent(name))
//   const doc = await words.create({ name: name }).catch((err) => err)
//   if (doc && 'message' in doc) {
//     if (doc.message.startsWith('E11000 duplicate key error collection')) {
//       return E304('word-add-error', `Can't add word ${name} in to Dictionary ${name} is exist`)
//     }
//     return E500('word-add-error', doc)
//   }

//   // จริงๆ แล้วแบบนี้จะทำให้ส่วนของ statistics ทำงานเร็ว
//   // แต่ถ้าเทียบกับปริมาณการใช้งาน add remove update อื่นๆ
//   // ดังนั้นควรออกแบบใหม่ให้ statistics ไปดึงข้อมูลเองดีกว่า
//   // ไม่งั้นการใช้งาน add remove update อื่นๆ ที่มีปริมาณสูงจะช้ามาก
//   const stat = await statistics.findOne().catch((err) => err)
//   if (stat && 'message' in stat) console.error(stat)
//   if (!stat) {
//     const raw = {
//       total   : 1,
//       first   : field_extract(doc),
//       lastAdd : field_extract(doc),
//       lastMod : field_extract(doc),
//       lastDel : [],
//       lastHigh: field_extract(doc),
//       lastLow : field_extract(doc)
//     }
//     const result = await statistics.create(raw).catch((err) => err)
//     if (result && 'message' in result) console.error(result)
//   } else {
//     // const raw = field_extract(doc)
//     // if (stat.lastAdd.length > 99) await stat.lastAdd.pull(stat.lastAdd[99])
//     // if (stat.lastMod.length > 99) await stat.lastMod.pull(stat.lastMod[99])
//     // await stat.lastAdd.push(raw)
//     // await stat.lastMod.push(raw)
//     // await stat.lastAdd.sort((a, b) => b.create - a.create)
//     // await stat.lastMod.sort((a, b) => b.modified - a.modified)
//     // await stat.save()
//     const lastAdd = await words.find().sort({ create: 'desc' }).limit(100).catch((err) => err)
//     if (lastAdd && 'message' in lastAdd) console.error(lastAdd)
//     const lastMod = await words.find().sort({ modified: 'desc' }).limit(100).catch((err) => err)
//     if (lastMod && 'message' in lastMod) console.error(lastMod)
//     const lastHigh = await words.find().sort({ counter: 'desc' }).limit(100).catch((err) => err)
//     if (lastHigh && 'message' in lastHigh) console.error(lastHigh)
//     const lastLow = await words.find().sort({ counter: 'asc' }).limit(100).catch((err) => err)
//     if (lastLow && 'message' in lastLow) console.error(lastLow)
//     stat.lastAdd  = field_extracts(lastAdd)
//     stat.lastMod  = field_extracts(lastMod)
//     stat.lastHigh = field_extracts(lastHigh)
//     stat.lastLow  = field_extracts(lastLow)
//     await stat.save()
//   }
//   // ข้างบนนี้จะตัดออกในอนาคต

//   const raw = field_extract(doc)
//   return R200('word-add-success', `Add word ${name} in to dictionary`, raw)
// }


// // ┌────────────────────────────────────────────────────────────────────────────┐
// // │ ลบคำศัพท์ 1 รายการจาก collection words                                       |
// // └────────────────────────────────────────────────────────────────────────────┘

// const remove = async (data) => {
//   let { by, target } = data
//   by = remove_spacails(decodeURIComponent(by))
//   target = remove_spacails(decodeURIComponent(target))
//   fillter = (by == 'id' ? isId(target) : { name: target })
//   if ('statusCode' in fillter) {
//     return E304('word-remove-error', `Remove word by ${by} ${target} status code ${fillter.statusCode}`)
//   }
//   const doc = await words.findOne(fillter).catch((err) => err)
//   if (doc && 'message' in doc) return E500('word-remove-error', doc)
//   if (!doc) return E304('word-remove-error', `Can't remove word ${target} because ${target} don't exist`)
//   const raw = {
//     create  : doc.create,
//     modified: Math.floor(new Date().getTime()),
//     counter : doc.counter,
//     name    : doc.name,
//     previous: Object.keys(doc.tree),
//     next    : Object.keys(doc.tree[' '])
//   }
//   const del = await words.deleteOne(fillter).catch((err) => err)
//   if (del && 'message' in del) return E500('word-remove-error', del)
//   if ('deletedCount' in del) {
//     if (del.deletedCount > 0) {
//       const stat = await statistics.findOne().catch((err) => err)
//       if (stat && 'message' in stat) return E500('word-remove-error', stat)
//       if (stat.first.name == raw.name) {
//         stat.first = {}
//         const first = await words.findOne().sort({ create: 'asc' }).catch((err) => err)
//         if (first && 'message' in first) console.error(first)
//         if (!first) {
//           console.log('Dictionary is empty')
//         } else {
//           stat.first = field_extract(first)
//         }
//       }
//       if (stat.lastDel.length > 99) await stat.lastDel.pull(stat.lastDel[99])
//       await stat.lastDel.push(raw)
//       await stat.lastDel.sort((a, b) => b.modified - a.modified)
//       await stat.save()
//     }
//   }
//   return R200('word-remove-success', `Remove word ${target} from dictionary`, raw)
// }


module.exports = {
  wordsIO,
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
