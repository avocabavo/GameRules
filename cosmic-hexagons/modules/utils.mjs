//@ts-check

import {Tile} from './tile.mjs'

/**
 * @param {Tile[]} a
 * @returns {Tile[][]}
 */
function findDiads(a) {
  const diads = []
  for (let i = 0; i < a.length - 1; i++) {
    for (let j = i + 1; j < a.length; j++) {
      diads.push([a[i], a[j]])
    }
  }
  return diads
}

/**
 * @param {Tile[]} a
 * @returns {Tile[][]}
 */
function findTriads(a) {
  const triads = []
  for (let i = 0; i < a.length - 2; i++) {
    for (let j = i + 1; j < a.length - 1; j++) {
      for (let k = j + 1; k < a.length; k++) {
        triads.push([a[i], a[j], a[k]])
      }
    }
  }
  return triads
}

export {
  findDiads,
  findTriads
}