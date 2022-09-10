'use strict'

export default class {
  constructor(params, query) {
    this.params = params
    this.query = query
  }

  setTitle = (title) => document.title = title

  createPage = (parent) => {
    const tag     = 'section'
    const header  = document.createElement(tag)
    const body    = document.createElement(tag)
    const content = document.createElement(tag)
    const left    = document.createElement(tag)
    const right   = document.createElement(tag)
    const footer  = document.createElement(tag)

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