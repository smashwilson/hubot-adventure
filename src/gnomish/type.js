const {StaticEntry} = require('./symboltable')

class Unification {
  static successful (type, bindings) {
    return new Unification(type, bindings)
  }

  static unsuccessful () {
    return new Unification(null, [])
  }

  constructor (type, bindings) {
    this.type = type
    this.bindings = bindings
  }

  wasSuccessful () { return this.type !== null }

  getType () { return this.type }

  apply (symbolTable) {
    const tType = symbolTable.at('Type').getValue()
    for (const [name, type] of this.bindings) {
      symbolTable.put(name, new StaticEntry(tType, type))
    }
    return this
  }
}

class Type {
  constructor (name) {
    this.name = name
  }

  getName () { return this.name }

  resolve (symbolTable) {
    return this
  }

  isSimple () { return true }

  isParameter () { return false }

  isCompound () { return false }

  toString () {
    return this.name
  }
}

class TypeParameter {
  constructor (name) {
    this.name = name
  }

  getName () { return this.name }

  resolve (symbolTable) {
    if (symbolTable.has(this.name)) {
      const entry = symbolTable.at(this.name)
      if (!entry.isStatic()) {
        throw new Error(
          `Identifier ${this.name} is not known at compile time, so it can't be in a type expression`)
      }
      if (entry.getType() !== symbolTable.at('Type').getValue()) {
        throw new Error(
          `Identifier ${this.name} is not a Type, so it can't be in a type expression`)
      }
      return entry.getValue()
    } else {
      return this
    }
  }

  unifyWithRaw (symtable, other) {
    if (symtable.has(this.name)) {
      const entry = symtable.at(this.name)
      if (!entry.isStatic()) {
        throw new Error(
          `Identifier ${this.name} is not known at compile time, so it can't be in a type expression`)
      }
      console.log(entry.getType())
      if (entry.getType() !== symtable.at('Type').getValue()) {
        throw new Error(
          `Identifier ${this.name} is not a Type, so it can't be in a type expression`)
      }
      return entry.getValue().unifyWithRaw(symtable, other)
    } else {
      return Unification.successful(other, [[this.name, other]])
    }
  }

  isSimple () { return false }

  isParameter () { return true }

  isCompound () { return false }

  toString () {
    return this.name
  }
}

class CompoundType {
  constructor (base, params) {
    this.base = base
    this.params = params
  }

  getBase () { return this.base }

  getParams () { return this.params }

  isSimple () { return false }

  isParameter () { return false }

  isCompound () { return true }

  toString () {
    return `${this.base.toString()}(${this.params.map(p => p.toString()).join(', ')})`
  }
}

function makeType (name, params = []) {
  const base = name.startsWith("'") ? new TypeParameter(name) : new Type(name)
  if (params.length > 0) {
    return new CompoundType(base, params)
  } else {
    return base
  }
}

function unify (lType, rType) {
  function exact (a, b) {
    if (a === b) return Unification.successful(a, [])
    return Unification.unsuccessful()
  }

  function assignParameter (param, value) {
    return Unification.successful(value, [[param.getName(), value]])
  }

  if (lType.isSimple() && rType.isSimple()) return exact(lType, rType)

  if (lType.isParameter() && !rType.isParameter()) return assignParameter(lType, rType)
  if (!lType.isParameter() && rType.isParameter()) return assignParameter(rType, lType)

  return Unification.unsuccessful()
}

module.exports = {makeType, unify}
