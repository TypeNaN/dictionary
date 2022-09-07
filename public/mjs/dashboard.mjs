'use strict'

import abstractPage from './abstractPage.mjs'
import navMain from './navMain.mjs'

export default class extends abstractPage {
  constructor(params, query) {
    super(params, query)
    this.setTitle('Dictionary')
  }
  
  render = async (socket) => {
    const container = document.getElementById('main-container')
    container.innerHTML = '' // Clear the last content before creating new page content.
    
    const { header, body, content, left, right, footer } = this.createPage(container)
    const nav = new navMain(left)
    
    header.innerHTML = 'DICTIONARY'
    
    socket.on('res-word', (data) => console.log(data))
    socket.emit('req-test', { name: 'ก้าง' })
  }
}