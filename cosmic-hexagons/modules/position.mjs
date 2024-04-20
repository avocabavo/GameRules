//@ts-check

class Position {
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   */
  constructor(x, y, z) {
    this.x = x
    this.y = y
    this.z = z
  }

  /**
   * @returns {number}
   */
  r() {
    return Math.max(
      Math.abs(this.x),
      Math.abs(this.y),
      Math.abs(this.z),
    )
  }

  /**
   * @returns {string}
   */
  toString() {
    return `(${this.x}, ${this.y}, ${this.z})`
  }
}

/**
 * @param {Position} a
 * @param {Position} b
 * @returns {number}
 */
function distance(a, b) {
  let deltaX = Math.abs(b.x - a.x)
  let deltaY = Math.abs(b.y - a.y)
  let deltaZ = Math.abs(b.z - a.z)
  return Math.max(deltaX, deltaY, deltaZ)
}

/**
 * @param {Position} a
 * @param {Position} b
 * @returns {number}
 */
function squaredTrueDistance(a, b) {
  let distances = [
    Math.abs(b.x - a.x),
    Math.abs(b.y - a.y),
    Math.abs(b.z - a.z)
  ]
  distances.sort((x, y)=> x - y)
  return Math.sqrt(
    distances[0] * distances[0] +
    distances[1] * distances[1] +
    distances[0] * distances[1]
  )
}

export {
  Position,
  distance,
  squaredTrueDistance
}