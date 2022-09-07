'use strict'

export default class {
  constructor(params, query) {
    this.params = params
    this.query = query
  }

  setTitle = (title) => document.title = title

  createPage = (parent) => {
    const eType = 'section'
    const header  = document.createElement(eType)
    const body    = document.createElement(eType)
    const content = document.createElement(eType)
    const left    = document.createElement(eType)
    const right   = document.createElement(eType)
    const footer  = document.createElement(eType)

    header.id     = 'page-header'
    body.id       = 'page-body'
    content.id    = 'page-content'
    left.id       = 'page-left'
    right.id      = 'page-right'
    footer.id     = 'page-footer'

    parent.appendChild(header)
    parent.appendChild(body)
    body.appendChild(content)
    parent.appendChild(left)
    parent.appendChild(right)
    parent.appendChild(footer)
    
    return {
      header: header,
      body: body,
      content: content,
      left: left,
      right: right,
      footer: footer
    }
  }
}