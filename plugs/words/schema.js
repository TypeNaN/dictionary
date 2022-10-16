const mongoose = require('mongoose')

const collection_words    = 'words'
const collection_removed  = 'words_removed'
const collection_unknow   = 'words_unknow'

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
  strict: true,
  collection_words
})

const removedSchema = new mongoose.Schema({
  create  : { type: Number, default: 0 },
  modified: { type: Number, default: 0 },
  counter : { type: Number, default: 0 },
  name    : { type: String, required: true, unique: true},
  previous: { type: [String], default: [] },
  next    : { type: [String], default: [] }
}, {
  versionKey: false,
  strict: true,
  collection_removed
})


const unknowSchema = new mongoose.Schema({
  create  : { type: Number, default: 0 },
  modified: { type: Number, default: 0 },
  name    : { type: String, required: true, unique: true}
}, {
  timestamps: {
    createdAt: 'create',
    updatedAt: 'modified',
    currentTime: () => Math.floor(new Date().getTime())
  },
  versionKey: false,
  strict: true,
  collection_unknow
})


const words     = mongoose.model(collection_words, wordsSchema)
const removeds  = mongoose.model(collection_removed, removedSchema)
const unknows   = mongoose.model(collection_unknow, unknowSchema)


module.exports = {
  words,
  removeds,
  unknows
}