class SymbolTable {
  constructor (parent = null) {
    this.symbols = new Map()
    this.parent = parent
  }

  has (name) {
    if (this.symbols.has(name)) return true
    if (!this.parent) return false

    return this.parent.has(name)
  }

  at (name) {
    let v = this.symbols.get(name)
    if (v === undefined) {
      if (this.parent) {
        return this.parent.at(name)
      } else {
        throw new Error(`Identifier "${name}" not found`)
      }
    }
    return v
  }

  put (name, entry) {
    this.symbols.set(name, entry)
  }

  push () {
    return new SymbolTable(this)
  }

  pop () {
    if (!this.parent) {
      throw new Error('Attempt to pop root symbol table')
    }
    return this.parent
  }
}

class Entry {
  constructor (type) {
    this.type = type
  }

  getType () { return this.type }
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
}

module.exports = {SymbolTable, SlotEntry, StaticEntry}
