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
    new statistics(content, socket).fetch().then(() => {
      /* Test only */
      // socket.emit('word-add', { name: 'ลอง' })
      // socket.emit('word-remove', { by:'name', target: 'ลอง' })
      // socket.emit('word-view', { by: 'name', target: 'ลอง' })
      // socket.emit('word-views', { skip: 0, end: 100, sort: true })
      // socket.emit('word-views', { skip: 0, end: 100, sort: { key: 'name', by: 'desc' } })
    })
    
    socket.on('hello', (data) => console.log(data))
  }
}