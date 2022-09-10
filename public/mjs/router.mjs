'use strict'

import dashboard from './dashboard/dashboard.mjs'
import page404 from './404.mjs'


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ Load script /socket.io/socket.io.js from index.html                        |
// └────────────────────────────────────────────────────────────────────────────┘

const socket = io()


// ┌────────────────────────────────────────────────────────────────────────────┐
// │ SPA location                                                               |
// └────────────────────────────────────────────────────────────────────────────┘

const getRoute = (path) => new RegExp(`^${path.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&').replace(/:(\w+)/g, '(?<$1>[^/]+)')}\/?$`)

const getParams = (match) => {
  const v = match.result.slice(1)
  if (v.length < 1) return []
  const keys = Array.from(match.route.path.matchAll(/:(\w+)/g)).map((r) => r[1])
  return Object.fromEntries(keys.map((k, i) => [k, v[i]]))
}

const getUrlquery = () => {
  const urlquery = {}
  window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, (m, k, v) => urlquery[k] = v)
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
  const matches = routes.map((route) => ({ route: route, result: path.match(getRoute(route.path)) }))
  const match = matches.find((m) => m.result !== null) || { route: routes[0], result: [path] }
  const view = new match.route.view(getParams(match), query || getUrlquery())
  return await view.render(socket)
}

export default router