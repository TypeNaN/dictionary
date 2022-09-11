'use strict'

import {thdate, thnum} from '../thdate.mjs'

export default class {
  constructor(container, socket) {
    this.container = container
    socket.on('word-add-error', (data) => console.error(data))
    socket.on('word-remove-error', (data) => console.error(data))
    
    socket.on('word-add-success', (data) => {
      console.log(data);
      this.insertLastStat('lastAdd', data.result, 'create')
      this.insertLastStat('lastMod', data.result, 'modified')
      this.insertLastStat('lastHigh', data.result, 'modified', true)
      this.insertLastStat('lastLow', data.result, 'modified', true)
    })
    socket.on('word-remove-success', (data) => {
      console.log(data)
      this.insertLastStat('lastDel', data.result, 'modified')
    })
  }

  fetch = async () => {
    const res = await fetch('/statistics', { method: 'GET' }).catch((e) => console.error(e))
    if (res.status > 200) {
      const data = await res.text()
      console.error(data)
      if (!document.getElementById('statistics')) this.mockup()
      return
    }
    const data = await res.json()
    this.render(data)
  }

  render = async (data) => {
    const statistics = document.createElement('div')
    statistics.className = 'statistics'
    statistics.id = 'statistics'

    const total = document.createElement('div')
    total.className = 'statistics-total'
    total.innerHTML = `มีทั้งหมด ${data.total} คำศัพท์ในพจนานุกรม`
    this.container.appendChild(total)

    const fsection = document.createElement('section')
    const flabel = document.createElement('div')
    const fbox = document.createElement('div')
    const fvalue = document.createElement('div')
    const first = document.createElement('div')
    fsection.className = 'statistics-section'
    flabel.className = 'statistics-label'
    fbox.className = 'statistics-box'
    fvalue.className = 'statistics-value'
    flabel.innerHTML = 'คำศัพท์แรกของพจนานุกรม'
    let html = `<div><div>คำศัพท์</div> ${data.first.name}</div>`
    html += `<div><div>เพิ่มเมื่อ</div> ${thdate(new Date(data.first.create), { time: true })}</div>`
    html += `<div><div>แก้ไขเมื่อ</div> ${thdate(new Date(data.first.modified), { time: true })}</div>`
    html += `<div><div>เชื่อมโยงมา</div> ${data.first.previous.length} คำศัพท์</div>`
    html += `<div><div>เชื่อมโยงไป</div> ${data.first.next.length} คำศัพท์</div>`
    first.innerHTML = html
    fvalue.appendChild(first)
    fbox.appendChild(fvalue)
    fsection.appendChild(flabel)
    fsection.appendChild(fbox)
    statistics.appendChild(fsection)

    new Array(
      ['lastHigh', data.lastHigh, 'modified', 'คำศัพท์ที่พบบ่อย'],
      ['lastLow', data.lastLow, 'modified', 'คำศัพท์ที่อาจถูกลืม'],
      ['lastAdd', data.lastAdd, 'create', 'คำศัพท์ที่ถูกเพิ่มล่าสุด'],
      ['lastMod', data.lastMod, 'modified', 'คำศัพท์ที่ถูกแก้ไขล่าสุด'],
      ['lastDel', data.lastDel, 'modified', 'คำศัพท์ที่ถูกลบล่าสุด']
    ).forEach((x) => {
      const section = document.createElement('section')
      const label   = document.createElement('div')
      const box     = document.createElement('div')
      const value   = document.createElement('div')
      section.id    = x[0]
      section.className = 'statistics-section'
      label.className   = 'statistics-label'
      box.className     = 'statistics-box'
      value.className   = 'statistics-value'
      label.innerHTML   = x[3]
      value.appendChild(this.extract(x[1], x[2]))
      box.appendChild(value)
      section.appendChild(label)
      section.appendChild(box)
      statistics.appendChild(section)
    })
    this.container.appendChild(statistics)
  }

  extract = (buf, time = 'create') => {
    const ul = document.createElement('ul')
    buf.forEach((x) => {
      const li = document.createElement('li')
      let tooltip = `คำศัพท์ ${x.name}\n`
      tooltip += `เพิ่มเมื่อ ${thdate(new Date(x['create']), { time: true, full: true, thainum: true })}\n`
      tooltip += `แก้ไขเมื่อ ${thdate(new Date(x['modified']), { time: true, full: true, thainum: true })}\n`
      tooltip += `เชื่อมโยงมา ${thnum(x.previous.length)} คำศัพท์\n`
      tooltip += `เชื่อมโยงไป ${thnum(x.next.length)} คำศัพท์`
      li.setAttribute('title', tooltip)
      li.innerHTML = `<div class='date'>${thdate(new Date(x[time]), { time: true })}</div> <div class='previous'>${x.previous.length}</div><div class='word'>${x.name}</div><div class='next'>${x.next.length}</div>`
    ul.appendChild(li)
    })
    return ul
  }

  mockup = () => {
    const statistics = document.createElement('div')
    statistics.className = 'statistics'
    statistics.id = 'statistics'
    const total = document.createElement('div')
    total.className = 'statistics-total'
    total.innerHTML = `มีทั้งหมด 0 คำศัพท์ในพจนานุกรม`
    this.container.appendChild(total)
    const fsection = document.createElement('section')
    const flabel = document.createElement('div')
    const fbox = document.createElement('div')
    const fvalue = document.createElement('div')
    const first = document.createElement('div')
    fsection.className = 'statistics-section'
    flabel.className = 'statistics-label'
    fbox.className = 'statistics-box'
    fvalue.className = 'statistics-value'
    flabel.innerHTML = 'คำศัพท์แรกของพจนานุกรม'
    let html = `<div><div>คำศัพท์</div>&nbsp;</div>`
    html += `<div><div>เพิ่มเมื่อ</div>&nbsp;</div>`
    html += `<div><div>แก้ไขเมื่อ</div>&nbsp;</div>`
    html += `<div><div>เชื่อมโยงมา</div>&nbsp;</div>`
    html += `<div><div>เชื่อมโยงไป</div>&nbsp;</div>`
    first.innerHTML = html
    fvalue.appendChild(first)
    fbox.appendChild(fvalue)
    fsection.appendChild(flabel)
    fsection.appendChild(fbox)
    statistics.appendChild(fsection)
    new Array(
      ['lastHigh', 'คำศัพท์ที่พบบ่อย'],
      ['lastLow', 'คำศัพท์ที่อาจถูกลืม'],
      ['lastAdd', 'คำศัพท์ที่ถูกเพิ่มล่าสุด'],
      ['lastMod', 'คำศัพท์ที่ถูกแก้ไขล่าสุด'],
      ['lastDel', 'คำศัพท์ที่ถูกลบล่าสุด']
    ).forEach((x) => {
      const section = document.createElement('section')
      const label   = document.createElement('div')
      const box     = document.createElement('div')
      const value   = document.createElement('div')
      const ul      = document.createElement('ul')
      section.id    = x[0]
      section.className = 'statistics-section'
      label.className   = 'statistics-label'
      box.className     = 'statistics-box'
      value.className   = 'statistics-value'
      label.innerHTML   = x[1]
      value.appendChild(ul)
      box.appendChild(value)
      section.appendChild(label)
      section.appendChild(box)
      statistics.appendChild(section)
    })
    this.container.appendChild(statistics)
  }

  insertLastStat = async (id, data, time, after = false) => {
    const section = document.getElementById(id)
    const box = section.childNodes[1]
    const value = box.childNodes[0]
    const ul = value.childNodes[0]
    const li = document.createElement('li')
    let tooltip = `คำศัพท์ ${data.name}\n`
    tooltip += `เพิ่มเมื่อ ${thdate(new Date(data['create']), { time: true, full: true, thainum: true })}\n`
    tooltip += `แก้ไขเมื่อ ${thdate(new Date(data['modified']), { time: true, full: true, thainum: true })}\n`
    tooltip += `เชื่อมโยงมา ${thnum(data.previous.length)} คำศัพท์\n`
    tooltip += `เชื่อมโยงไป ${thnum(data.next.length)} คำศัพท์`
    li.setAttribute('title', tooltip)
    li.innerHTML = `<div class='date'>${thdate(new Date(data[time]), { time: true })}</div> <div class='previous'>${data.previous.length}</div><div class='word'>${data.name}</div><div class='next'>${data.next.length}</div>`
    if (after) {
      ul.appendChild(li)
    } else {
      ul.insertBefore(li, ul.childNodes[0])
    }
  }
}