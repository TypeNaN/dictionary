import abstractView from './abstractPage.mjs'

export default class extends abstractView {
  constructor(params, query) {
    super(params, query)
    this.setTitle('404 Page Not Found :(')
  }

  render() {
    console.error('404 Page Not Found :(')
    document.getElementById('main-container').innerHTML = '<H1>404 Page Not Found :(</H1>'
  }
}