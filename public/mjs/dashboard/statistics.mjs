'use strict'

import {thdate, thnum} from '../thdate.mjs'

export default class {
  constructor(container) {
    this.container = container
  }

  render = async () => {
    const res = await fetch('/statistics', { method: 'GET' }).catch((e) => console.error(e))
    if (res.status > 200) {
      data = await res.text()
      console.error(data)
      return
    }
    const data = await res.json()
    const statistics = document.createElement('div')
    statistics.className = 'statistics'

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
      [data.lastHigh, 'modified', 'คำศัพท์ที่พบบ่อย'],
      [data.lastLow, 'modified', 'คำศัพท์ที่อาจถูกลืม'],
      [data.lastAdd, 'create', 'คำศัพท์ที่ถูกเพิ่มล่าสุด'],
      [data.lastMod, 'modified', 'คำศัพท์ที่ถูกแก้ไขล่าสุด'],
      [data.lastDel, 'modified', 'คำศัพท์ที่ถูกลบล่าสุด']
    ).forEach((x) => {
      const section = document.createElement('section')
      const label   = document.createElement('div')
      const box     = document.createElement('div')
      const value   = document.createElement('div')
      section.className = 'statistics-section'
      label.className   = 'statistics-label'
      box.className     = 'statistics-box'
      value.className   = 'statistics-value'
      label.innerHTML   = x[2]
      value.appendChild(this.extract(x[0], x[1]))
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
      tooltip += `เพิ่มเมื่อ ${thdate(new Date(x['create']), { time: true, full: true, thainum: true})}\n`
      tooltip += `แก้ไขเมื่อ ${thdate(new Date(x['modified']), { time: true, full: true, thainum: true })}\n`
      tooltip += `เชื่อมโยงมา ${thnum(x.previous.length)} คำศัพท์\n`
      tooltip += `เชื่อมโยงไป ${thnum(x.next.length)} คำศัพท์`
      li.setAttribute('title', tooltip)
      li.innerHTML = `${thdate(new Date(x[time]))} : (${x.previous.length})> ${x.name} >(${x.next.length})`
      ul.appendChild(li)
    })
    return ul
  }
}