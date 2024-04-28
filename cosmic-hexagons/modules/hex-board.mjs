//@ts-check

import {Cosmoid} from './cosmoid.mjs'
import {Position, distance, squaredTrueDistance} from './position.mjs'
import {Tile} from './tile.mjs'
import {findDiads, findTriads} from './utils.mjs'


/**
 * @property {number} radius
 * @property {Array<Tile>} tiles
 */
class HexBoard {
  /**
   * @param {string} name
   * @param {number} radius
   */
  constructor(name, radius) {
    this.name = name
    this.radius = radius
    this.tiles = []
    for (let z = -radius; z <= radius; z++) {
      let minY = Math.max(-radius, -radius - z)
      let maxY = Math.min(radius, radius - z)
      for (let y = minY; y <= maxY; y++) {
        let x = -z - y
        this.tiles.push(new Tile(
          new Position(x, y, z),
          Cosmoid.empty
        ))
      }
    }
  }

  /**
   * @param {Position} position
   * @param {Cosmoid} cosmoid
   */
  paint(position, cosmoid) {
    this.tiles.forEach(tile=> {
      if (distance(tile.position, position) == 0) {
        let originalCosmoid = tile.cosmoid
        if (tile.cosmoid == cosmoid) {
          tile.cosmoid = Cosmoid.empty
        } else {
          tile.cosmoid = cosmoid
        }
        return tile.cosmoid != originalCosmoid
      }
    })
  }

  /**
   * @returns {number}
   */
  beePoints() {
    let score = 0
    let beeTiles = this.tiles.filter(tile=> tile.cosmoid == Cosmoid.bee)
    findDiads(beeTiles).forEach(diad=> {
      let d = distance(diad[0].position, diad[1].position)
      if (d == 1) score += 3
    })
    findTriads(beeTiles).forEach(triad=> {
      let d1 = distance(triad[0].position, triad[1].position)
      let d2 = distance(triad[1].position, triad[2].position)
      let d3 = distance(triad[0].position, triad[2].position)
      if (d1 != 1) return
      if (d2 != 1) return
      if (d3 != 1) return
      score += 4
    })
    return score
  }

  /**
   * @returns {number}
   */
  cometPoints() {
    let score = 0
    let cometTiles = this.tiles.filter(tile=> tile.cosmoid == Cosmoid.comet)
    let rows = []
    for (let zLevel = -this.radius; zLevel <= this.radius; zLevel++) {
      let row = cometTiles.filter(tile=> tile.position.z == zLevel)
      row.sort((tile1, tile2)=> tile1.position.x - tile2.position.x)
      rows.push(row)
    }
    for (let yLevel = -this.radius; yLevel <= this.radius; yLevel++) {
      let row = cometTiles.filter(tile=> tile.position.y == yLevel)
      row.sort((tile1, tile2)=> tile1.position.x - tile2.position.x)
      rows.push(row)
    }
    for (let xLevel = -this.radius; xLevel <= this.radius; xLevel++) {
      let row = cometTiles.filter(tile=> tile.position.x == xLevel)
      row.sort((tile1, tile2)=> tile1.position.y - tile2.position.y)
      rows.push(row)
    }
    rows.forEach(row=> {
      /** @type {Tile | null} */
      let chainStart = null
      /** @type {Tile | null} */
      let chainEnd = null
      // row.forEach(comet=> {
      for (let i = 0; i < row.length; i++) {
        let comet = row[i]

        // handle the start of a row
        if (chainStart == null || chainEnd == null) {
          chainStart = comet
          chainEnd = comet
          continue
        }

        // handle finding a comet that continues the current chain
        let d = distance(comet.position, chainEnd.position)
        if (d == 1) {
          chainEnd = comet
          continue
        }

        // handle ending a chain and starting a new one
        let l = distance(chainStart.position, chainEnd.position)
        score += l * l * 2
        chainStart = comet
        chainEnd = comet
      }

      // handle the last chain of comets in its row
      if (chainStart != null && chainEnd != null) {
        let l = distance(chainStart.position, chainEnd.position)
        score += l * l * 2
      }
    })
    return score
  }

  /**
   * @returns {number}
   */
  pyramidPoints() {
    let pyramidTiles = this.tiles.filter(tile=> tile.cosmoid == Cosmoid.pyramid)
    let sizes = new Set()
    findTriads(pyramidTiles).forEach(triad=> {
      let sd1 = squaredTrueDistance(triad[0].position, triad[1].position)
      let sd2 = squaredTrueDistance(triad[1].position, triad[2].position)
      let sd3 = squaredTrueDistance(triad[0].position, triad[2].position)
      if (sd1 == sd2 && sd2 == sd3) {
        sizes.add(sd1)
      }
    })
    return sizes.size * 12
  }

  /**
   * @returns {number}
   */
  islandPoints() {
    let score = 0
    let islandTiles = this.tiles.filter(tile=> tile.cosmoid == Cosmoid.island)
    if (islandTiles.length == 0) return 0
    let otherTiles = this.tiles.filter(tile=>
      tile.cosmoid != Cosmoid.island &&
      tile.cosmoid != Cosmoid.empty
    )
    if (islandTiles.length == 1) return otherTiles.length
    islandTiles.forEach(island=> {
      let d = null
      islandTiles.forEach(otherIsland=> {
        let tempD = distance(island.position, otherIsland.position)
        if (tempD == 0) return
        if (d == null) {
          d = tempD
          return
        }
        d = Math.min(d, tempD)
      })
      score += otherTiles.filter(tile=> distance(tile.position, island.position) < d).length
    })
    return score
  }

  /**
   * @returns {number}
   */
  holeCount() {
    return this.tiles.filter(tile=> tile.cosmoid == Cosmoid.hole).length
  }
}

export {
  HexBoard
}