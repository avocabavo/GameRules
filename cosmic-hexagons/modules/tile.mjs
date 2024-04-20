//@ts-check

import {Cosmoid} from './cosmoid.mjs'
import {Position} from './position.mjs'

/**
 * @property {Position} position
 * @property {Cosmoid} cosmoid
 */
class Tile {
  /**
   * @param {Position} position
   * @param {Cosmoid} cosmoid
   */
  constructor(position, cosmoid) {
    this.position = position
    this.cosmoid = cosmoid
  }
}

let t = new Tile(
  new Position(1, 2, 8),
  Cosmoid.bee
)

export {
  Tile
}