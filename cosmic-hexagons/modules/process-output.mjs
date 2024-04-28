//@ts-check

import {Position} from './position.mjs'

/**
 * Boxes use a 0-1 by 0-1 coordinate system,
 * with the top-left corner of the image being 0, 0
 *
 * @property {number} left x-coordinate of the left edge of the box
 * @property {number} right x-coordinate of the right edge of the box
 * @property {number} top y-coordinate of the top edge of the box
 * @property {number} bottom y-coordinate of the bottom edge of the box
 */
class Box {
  /**
   * @param {number} x horizontal coordiante; left edge 0; right edge 1
   * @param {number} y vertical coordinate; top edge 0; bottom edge 1
   * @param {number} w width of the box as a portion of the image width
   * @param {number} h height of the box as a portion of the image height
   * @param {string} label class detected in this box
   * @param {number} prob confidence in that detection; best 1; worst 0
   */
  constructor(x, y, w, h, label, prob) {
    this.x = x
    this.y = y
    this.w = w
    this.h = h
    this.label = label
    this.prob = prob
  }

  /** @property {number} area */
  get area() {
    return this.w * this.h
  }

  get left() { return this.x - (this.w / 2) }
  get right() { return this.x + (this.w / 2) }
  get top() { return this.y - (this.h / 2) }
  get bottom() { return this.y + (this.h / 2) }
}

/**
 * @param {number[]} output massive array coming out of onnx
 * @param {number} imageWidth image width in pixels
 * @param {number} imageHeight image height in pixels
 * @param {string[]} yolo_classes labels that are being detected
 * @returns {Box[]}
 */
function processOutput(output, imageWidth, imageHeight, yolo_classes) {
  /** @type {Box[]} */
  let boxes = []
  for (let index = 0; index < 8400; index++) {
    const [class_id,prob] = [...Array(80).keys()]
      .map(col => [col, output[8400 * (col + 4) + index]])
      .reduce((accum, item) => item[1] > accum[1] ? item : accum, [0, 0])
    if (prob < 0.5) {
      continue
    }
    const label = yolo_classes[class_id]
    const xc = output[index] / imageWidth
    const yc = output[8400 + index] / imageHeight
    const w = output[2 * 8400 + index] / imageWidth
    const h = output[3 * 8400 + index] / imageHeight
    boxes.push(new Box(xc, yc, w, h, label, prob))
  }

  boxes = boxes.sort((box1, box2) => box2.prob - box1.prob)
  /** @type {Box[]} */
  const result = []
  while (boxes.length > 0) {
    result.push(boxes[0])
    boxes = boxes.filter(box => iou(boxes[0], box) < 0.7)
  }
  return result
}

/**
 * @param {Box} box1
 * @param {Box} box2
 * @returns {number} the proportion of the union area that is intersection
 */
function iou(box1, box2) {
  return intersection(box1, box2) / union(box1, box2)
}

/**
 * @param {Box} box1
 * @param {Box} box2
 * @returns {number} unitized area
 */
function union(box1, box2) {
  return box1.area + box2.area - intersection(box1, box2)
}

/**
 * @param {Box} box1
 * @param {Box} box2
 * @returns {number} unitized area
 */
function intersection(box1, box2) {
  const left = Math.max(box1.left, box2.left)
  const top = Math.max(box1.top, box2.top)
  const right = Math.min(box1.right, box2.right)
  const bottom = Math.min(box1.bottom, box2.bottom)
  if (left >= right) return 0
  if (top >= bottom) return 0
  return (right - left) * (bottom - top)
}

/**
 * @typedef {Object} v2
 * @property {number} x
 * @property {number} y
 */

/**
 * @typedef {Object} Axes
 * @property {v2} origin
 * @property {v2} xAxis
 * @property {v2} yAxis
 * @property {v2} zAxis
 */

/**
 * @param {Box} box1 from this box
 * @param {Box} box2 to this box
 * @returns {v2}
 */
function displacement(box1, box2) {
  return {
    x: box2.x - box1.x,
    y: box2.y - box1.y,
  }
}

/**
 * @param {v2} a first vector
 * @param {v2} b second vector
 * @returns {number} if the rotation from a to b clockwise is < 180, then this is positive
 */
function cross(a, b) {
  return a.x * b.y - a.y * b.x
}

/**
 * @param {v2} a vector to be scaled
 * @param {number} s the scale factor
 * @returns {v2}
 */
function scale(a, s) {
  return {
    x: a.x * s,
    y: a.y * s
  }
}

/**
 * @param {v2} a
 * @param {v2} b
 * @returns {v2}
 */
function add(a, b) {
  return {
    x: a.x + b.x,
    y: a.y + b.y
  }
}

/**
 * @param {v2} a
 * @param {v2} b
 * @returns {number} positive if the angle twixt a and b is < 90 degrees
 */
function dot(a, b) {
  return (a.x * b.x) + (a.y * b.y)
}

/**
 * @param {v2} a
 * @returns {number} the squared magnitude of that vector
 */
function normSquare(a) {
  return (a.x * a.x) + (a.y * a.y)
}

/** @type v2 */
const unitX = {x: 1, y: 0}
/** @type v2 */
const unitY = {x: 0, y: 1}


/**
 * @param {Box[]} splashes
 * @param {Box[]} scampers
 * @param {Box[]} soars
 * @returns {Axes}
 */
function findAxes(splashes, scampers, soars) {
  if (splashes.length != 2 || scampers.length != 2 || soars.length != 2) {
    throw (
      `Found the wrong number of axial critters. ` +
      `splashes: ${splashes.length}, scampers: ${scampers.length}, soars: ${soars.length}. ` +
      `Expected to find exactly 2 of each.`
    )
  }
  let splashV = displacement(splashes[0], splashes[1])
  let scamperV = displacement(scampers[0], scampers[1])
  let soarV = displacement(soars[0], soars[1])

  let zAxis = (cross(soarV, splashV) < 0)
    ? scale(add(soarV, splashV), 0.25)
    : scale(add(soarV, scale(splashV, -1)), 0.25)
  if (dot(zAxis, unitY) > 0) {
    zAxis = scale(zAxis, -1)
  }

  let yAxis = (cross(splashV, scamperV) < 0)
    ? scale(add(splashV, scamperV), 0.25)
    : scale(add(splashV, scale(scamperV, -1)), 0.25)
  if (dot(yAxis, zAxis) > 0) {
    yAxis = scale(yAxis, -1)
  }

  let xAxis = (cross(scamperV, soarV) < 0)
    ? scale(add(scamperV, soarV), 0.25)
    : scale(add(scamperV, scale(soarV, -1)), 0.25)
  if (dot(xAxis, yAxis) > 0) {
    xAxis = scale(xAxis, -1)
  }

  if (dot(zAxis, xAxis) > 0) {
    throw 'Unable to set up axes because 2 of them are acute'
  }

  // assume we're on the big board
  xAxis = scale(xAxis, 1 / 3.75)
  yAxis = scale(yAxis, 1 / 3.75)
  zAxis = scale(zAxis, 1 / 3.75)

  let centroid = {
    x: (
      splashes[0].x + splashes[1].x +
      scampers[0].x + scampers[1].x +
      soars[0].x + soars[1].x
    ) / 6,
    y: (
      splashes[0].y + splashes[1].y +
      scampers[0].y + scampers[1].y +
      soars[0].y + soars[1].y
    ) / 6,
  }

  return {
    origin: centroid,
    xAxis,
    yAxis,
    zAxis
  }
}

/**
 * @typedef {Object} confidentPosition
 * @property {Position} position
 * @property {number} distance positive number indicating how
 * far it had to be fudged to get to this position
 */

/**
 * @param {Box} box box to be positioned
 * @param {Axes} axes axes defining the wasteful coordinate system
 * @returns {confidentPosition}
 */
function boxToPosition(box, axes) {
  /** @type v2 */
  let fromOrigin = {
    x: box.x - axes.origin.x,
    y: box.y - axes.origin.y
  }
  let xComponent = dot(fromOrigin, axes.xAxis) / normSquare(axes.xAxis)
  let yComponent = dot(fromOrigin, axes.yAxis) / normSquare(axes.yAxis)
  let zComponent = dot(fromOrigin, axes.zAxis) / normSquare(axes.zAxis)
  console.log('raw components')
  console.debug('xComponent', xComponent)
  console.debug('yComponent', yComponent)
  console.debug('zComponent', zComponent)
  let average = (xComponent + yComponent + zComponent) / 3
  xComponent -= average
  zComponent -= average
  yComponent -= average
  let position = new Position(
    Math.round(xComponent),
    Math.round(yComponent),
    Math.round(zComponent)
  )
  let sum = position.x + position.y + position.z
  if (sum != 0) {
    console.warn(`Correcting z position by ${sum} in order to make the sum 0`)
    // This is a problem because the board plane is x + y + z = 0
    position.z -= sum
  }
  let xCorrection = position.x - xComponent
  let yCorrection = position.y - yComponent
  let zCorrection = position.z - zComponent
  let normSquareCorrection = (
    xCorrection * xCorrection +
    yCorrection * yCorrection +
    zCorrection * zCorrection
  )
  return {
    position,
    distance: Math.sqrt(normSquareCorrection)
  }
}

export {
  processOutput,
  findAxes,
  boxToPosition,
}
