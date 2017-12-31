class SymbolTable {
  constructor (parent = null) {
    this.symbols = new Map()
    this.parent = parent
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
}

module.exports = {SymbolTable, Entry}
