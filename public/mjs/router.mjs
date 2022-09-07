'use strict'

import dashboard from './dashboard.mjs'
import page404 from './404.mjs'

// ┌────────────────────────────────────────────────────────────────────────────┐
// │ Load script /socket.io/socket.io.js from index.html                        |
// └────────────────────────────────────────────────────────────────────────────┘

const socket = io()

// ┌────────────────────────────────────────────────────────────────────────────┐
// │ SPA location                                                               |
// └────────────────────────────────────────────────────────────────────────────┘

const pathToRegex = (path) => new RegExp(`^${path.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/:(\w+)/g, '(?<$1>[^/]+)')}\/?$`)

const getParams = (match) => {
  const values = match.result.slice(1)
  if (values.length > 0) {
    const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map((result) => result[1])
    return Object.fromEntries(keys.map((key, i) => [key, values[i]]))
  }
  return []
}

const getUrlquery = () => {
  const urlquery = {}
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, key, value) => urlquery[key] = value)
  return urlquery
}


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ Full SPA on client                                                         |
// └────────────────────────────────────────────────────────────────────────────┘

const router = async (path = '/', query) => {
  const routes = [
    { path: '/', view: dashboard },
    { path: '/dashboard', view: dashboard },
    { path: '/:another', view: page404 }
  ]
  const potentialMatches = routes.map((route) => ({ route: route, result: path.match(pathToRegex(route.path)) }))
  const match = potentialMatches.find((potentialMatch) => potentialMatch.result !== null) || { route: routes[0], result: [path] }
  const view = new match.route.view(getParams(match), query || getUrlquery())
  return await view.render(socket)
}

export default router