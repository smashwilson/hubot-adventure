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
    this.nextSlot = 0
  }

  getNextSlot () {
    const s = this.nextSlot
    this.nextSlot++
    return s
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
        return this.parent.binding(name)
      } else {
        throw new Error(`Identifier "${name}" not found`)
      }
    }
    return {entry: v, frame: this.frame}
  }

  at (name) {
    return this.binding(name).entry
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
}

module.exports = {SymbolTable}
