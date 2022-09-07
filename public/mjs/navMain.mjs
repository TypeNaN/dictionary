'use strict'

import router from './router.mjs'

export default class {
  constructor(container) {
    this.root = document.createElement('div')
    this.root.id = 'nav-main'
    this.root.setAttribute('toggle-sidebar-expanded', false)
    
    this.ul = document.createElement('ul')

    this.toggle('toggle-sidebar')
    this.add({ title: 'Home', class: 'menu-home', href: '/' })
    this.add({ title: 'Dashboard', class: 'menu-dashboard', href: '/dashboard' })
    
    this.root.onclick = this.toggleState

    if (container) {
      container.appendChild(this.root)
      container.appendChild(this.ul)
    }
  }
  
  toggleState = (e) => {
    this.root.setAttribute(
      'toggle-sidebar-expanded',
      this.root.getAttribute('toggle-sidebar-expanded') === 'true' ? false : true
    )
  }

  toggle = (className) => {
    const menu = document.createElement('li')
    menu.className = className || undefined
    menu.onclick = this.toggleState
    this.ul.appendChild(menu)
  }

  add = (params) => {
    const menu = document.createElement('li')
    menu.className = params['class'] || undefined
    menu.textContent = params['title'] || undefined
    if (params['href']) {
      menu.onclick = (e) => {
        console.log(e)
        router(params.href)
      }
    }
    this.ul.appendChild(menu)
  }
}
