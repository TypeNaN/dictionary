'use strict'

import router from './router.mjs'

document.addEventListener('DOMContentLoaded', async () => await router(window.location.pathname))