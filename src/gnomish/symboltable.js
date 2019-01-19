const ROOT = Symbol('Root')
const GAME = Symbol('Game')

class Entry {
  constructor (type) {
    this.type = type
  }

  getType () { return this.type }

  isStatic () { return false }
}

class SlotEntry extends Entry {
  constructor (type, slot) {
    super(type)
    this.slot = slot
  }

  getSlot () { return this.slot }
}

class StaticEntry extends Entry {
  constructor (type, value) {
    super(type)
    this.value = value
  }

  getValue () { return this.value }

  isStatic () { return true }
}

class SymbolTable {
  constructor (frame, parent = null) {
    this.frame = frame
    this.parent = parent
    this.symbols = new Map()
    this.captures = new Set()
    this.nextSlot = 0
  }

  static root () {
    return new SymbolTable(ROOT)
  }

  static game (parent) {
    return new SymbolTable(GAME, parent)
  }

  getNextSlot () {
    const s = this.nextSlot
    this.nextSlot++
    return s
  }

  getFrame () {
    return this.frame
  }

  getCaptures () {
    return this.captures
  }

  has (name) {
    if (this.symbols.has(name)) return true
    if (!this.parent) return false

    return this.parent.has(name)
  }

  binding (name) {
    let v = this.symbols.get(name)
    if (v === undefined) {
      if (this.parent) {
        const inherited = this.parent.binding(name)
        if (!inherited.entry.isStatic()) {
          this.captures.add(inherited.frame)
        }
        return inherited
      } else {
        throw new Error(`Identifier "${name}" not found`)
      }
    }
    return { entry: v, frame: this.frame }
  }

  at (name) {
    return this.binding(name).entry
  }

  all () {
    const r = this.parent ? this.parent.all() : []
    for (const [name, entry] of this.symbols) {
      r.push({ name, entry })
    }
    return r
  }

  allocateSlot (name, type) {
    const e = new SlotEntry(type, this.getNextSlot())
    this.symbols.set(name, e)
    return e
  }

  setStatic (name, type, value) {
    const e = new StaticEntry(type, value)
    this.symbols.set(name, e)
    return e
  }

  push (newFrame) {
    return new SymbolTable(newFrame, this)
  }

  pop () {
    if (!this.parent) {
      throw new Error('Attempt to pop root symbol table')
    }
    return this.parent
  }

  getGame () {
    if (this.frame === GAME) {
      return this
    } else if (this.parent) {
      return this.parent.getGame()
    } else {
      throw new Error('No Game-level symbol table available')
    }
  }

  getRoot () {
    return this.parent ? this.parent.getRoot() : this
  }
}

module.exports = { SymbolTable }
