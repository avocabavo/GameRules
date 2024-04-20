import {h} from 'https://unpkg.com/vue@3/dist/vue.esm-browser.js'

function vDiv(...args) {
  args.unshift('div')
  return h(...args)
}

function vP(...args) {
  args.unshift('p')
  return h(...args)
}

function vImg(...args) {
  args.unshift('img')
  return h(...args)
}

function vSpan(...args) {
  args.unshift('span')
  return h(...args)
}

export {
  vDiv,
  vP,
  vImg,
  vSpan
}