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
    new statistics(content).render()
    
    socket.on('res-word', (data) => console.log(data))
    socket.emit('req-test', { name: 'ก้าง' })

  }
}