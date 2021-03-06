const UPPERCASE = 'toUpperCase'

const LOWERCASE = 'toLowerCase'

class NormalizingMap {
  constructor (targetCase = LOWERCASE) {
    this.inner = new Map()
    this.targetCase = targetCase
  }

  set (key, value) {
    return this.inner.set(normalize(key, this.targetCase), value)
  }

  get (key) {
    return this.inner.get(normalize(key, this.targetCase))
  }

  has (key) {
    return this.inner.has(normalize(key, this.targetCase))
  }

  delete (key) {
    return this.inner.delete(normalize(key, this.targetCase))
  }

  keys () {
    return this.inner.keys()
  }

  values () {
    return this.inner.values()
  }

  clear () {
    return this.inner.clear()
  }

  firstValue () {
    if (this.inner.size > 0) {
      const [[, value]] = this.inner
      return value
    } else {
      return undefined
    }
  }
}

function normalize (input, targetCase) {
  return input.trim().replace(/\s+/g, ' ')[targetCase]()
}

module.exports = { NormalizingMap, LOWERCASE, UPPERCASE }
