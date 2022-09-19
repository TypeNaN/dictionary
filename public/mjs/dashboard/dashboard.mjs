'use strict'

import abstractPage from '../abstractPage.mjs'
import navMain from '../navMain.mjs'
import statistics from './statistics.mjs'


export default class extends abstractPage {
  constructor(params, query) {
    super(params, query)
    this.setTitle('Dictionary')
  }
  
  render = async (socket) => {
    const container = document.getElementById('main-container')
    container.innerHTML = '' // Clear the last content before creating new page content.
    
    const { header, body, content, left, right, footer } = this.createPage(container)
    header.innerHTML = 'Dictionary'

    new navMain(left).render()
    new statistics(content, socket).render(socket).then((me) => {
      /* Test only */
      // socket.emit('word-stat')
      // socket.emit('word-add', { name: 'ลอง' })
      // socket.emit('word-remove', { by:'name', target: 'ลอง' })
      // socket.emit('word-view', { by: 'name', target: 'ลอง' })
      // socket.emit('word-views', { skip: 0, end: 100, sort: true })
      // socket.emit('word-views', { skip: 0, end: 100, sort: { key: 'name', by: 'desc' } })
      // socket.emit('word-search', { name: 'ก' })
      // socket.emit('word-patch', {params: { by: 'name', target: 'หนัง' }, data: { lang: "th" }})
      // socket.emit('word-patch-key', { params: { by: 'name', target: 'ก้าง', key: 'ลอง' }, data: { age: "โบราณ" }})
      // socket.emit('word-add-prev', { by: 'name', target: 'แสดง', previous: 'การ' })
      // socket.emit('word-mod-prev', { by: 'name', target: 'ก้าง', previous: 'มี', edit: 'โดน', merge: 'merge' })
      // socket.emit('word-patch-prev', {
      //   params: { by: 'name', target: 'ก้าง', previous: 'มี' },
      //   data: {ทิ่ม: {freq: 3,feel: -1,type: "นาม",mean: "ก้างติดอยู่กับอะไรบางอย่าง",example: ["มีก้างติดคอฉันอยู่"]}}
      // })
      // socket.emit('word-remove-prev', { by:'name', target: 'ก้าง',previous:'มี' })
      // socket.emit('word-add-next', { by: 'name', target: 'ก้าง', previous: 'มี',next:'ตัว' })
      // socket.emit('word-mod-next', { by: 'name', target: 'ก้าง', previous: 'มี', next: 'ติด', edit: 'หัก' })
    })
    
    socket.on('hello', (data) => console.log(data))
  }
}