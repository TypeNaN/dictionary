'use strict'

const num = new Array('๐', '๑', '๒', '๓', '๔', '๕', '๖', '๗', '๘', '๙')
const day = new Array('อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์')
const month = new Array('มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม')

export const thnum = (d) => {
  let result = ''
  const text = d.toString()
  for (let i = 0; i < text.length; i++) {
    result += text[i].match(/\d/g) ? num[text[i]] : text[i]
  }
  return result
}

export const thdate = (date, options = {}) => {
  if (!options['thainum']) {
    if (!options['full']) {
      if (!options['time']) return `${date.getDate()}/${date.getMonth() + 1}/${(date.getFullYear() + 543)}`
      return `${date.getDate()}/${date.getMonth() + 1}/${(date.getFullYear() + 543)}-${(date.toLocaleTimeString('TH'))}`
    }
    if (!options['time']) return `วัน${day[date.getDay()]} ที่ ${date.getDate()} เดือน${month[date.getMonth()]} ปีพุทธศักราช ${(date.getFullYear() + 543)}`
    return `วัน${day[date.getDay()]} ที่ ${date.getDate()} เดือน${month[date.getMonth()]} ปีพุทธศักราช ${(date.getFullYear() + 543)} เวลา ${date.toLocaleTimeString('TH')} นาฬิกา`
  }
  if (!options['full']) {
    if (!options['time']) return `${thnum(date.getDate())}/${thnum(date.getMonth() + 1)}/${thnum(date.getFullYear() + 543)}`
    return `${thnum(date.getDate())}/${thnum(date.getMonth() + 1)}/${thnum(date.getFullYear() + 543)}-${thnum(date.toLocaleTimeString('TH'))}`
  }
  if (!options['time']) return `วัน${day[date.getDay()]} ที่ ${thnum(date.getDate())} เดือน${month[date.getMonth()]} ปีพุทธศักราช ${thnum(date.getFullYear() + 543)}`
  return `วัน${day[date.getDay()]} ที่ ${thnum(date.getDate())} เดือน${month[date.getMonth()]} ปีพุทธศักราช ${thnum(date.getFullYear() + 543)} เวลา ${thnum(date.toLocaleTimeString('TH'))} นาฬิกา`
}