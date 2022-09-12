'use strict'

import abstractPage from '../abstractPage.mjs'
import navMain from '../navMain.mjs'

export default class extends abstractPage {
  constructor(params, query) {
    super(params, query)
    this.setTitle('Add')
  }
  
  render = async (socket) => {
    const container = document.getElementById('main-container')
    container.innerHTML = '' // Clear the last content before creating new page content.
    
    const { header, body, content, left, right, footer } = this.createPage(container)
    header.innerHTML = 'Add'

    new navMain(left).render()
    this.form()
    
    socket.on('hello', (data) => console.log(data))
  }

  form = () => {
    console.log('this is add -> form');
  }
}