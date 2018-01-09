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

  resolveRecursively (symbolTable) {
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

  resolveRecursively (symbolTable) {
    return this.resolve(symbolTable)
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

  resolve (symbolTable) {
    const rBase = this.base.resolve(symbolTable)
    if (rBase !== this.base) {
      return new CompoundType(rBase, this.params.slice())
    } else {
      return this
    }
  }

  resolveRecursively (symbolTable) {
    const t = this.resolve(symbolTable)
    t.params = this.params.map(p => p.resolveRecursively(symbolTable))
    return t
  }

  isSimple () { return false }

  isParameter () { return false }

  isCompound () { return true }

  toString () {
    return `${this.base.toString()}(${this.params.map(p => p.toString()).join(', ')})`
  }
}

function makeType (name, params = []) {
  let base
  if (typeof name === 'string') {
    base = name.startsWith("'") ? new TypeParameter(name) : new Type(name)
  } else {
    base = name
  }
  if (params.length > 0) {
    return new CompoundType(base, params)
  } else {
    return base
  }
}

function unify (symbolTable, lType, rType) {
  const st = symbolTable.push()
  const tType = st.at('Type').getValue()

  function exact (a, b) {
    if (a === b) return Unification.successful(a, [])
    return Unification.unsuccessful()
  }

  function assignParameter (param, value) {
    st.put(param.getName(), new StaticEntry(tType, value))
    return Unification.successful(value, [[param.getName(), value]])
  }

  function pass (lType, rType) {
    const lRes = lType.resolve(st)
    const rRes = rType.resolve(st)

    if (lRes.isParameter() && !rRes.isParameter()) return assignParameter(lRes, rRes)
    if (rRes.isParameter()) return assignParameter(rRes, lRes)

    if (lRes.isCompound() && rRes.isCompound()) {
      const lParams = lRes.getParams()
      const rParams = rRes.getParams()

      if (lParams.length !== rParams.length) return Unification.unsuccessful()

      const uBase = pass(lRes.getBase(), rRes.getBase())
      if (!uBase.wasSuccessful()) return Unification.unsuccessful()

      const uParams = []
      const uBindings = []
      for (let i = 0; i < lParams.length; i++) {
        const uParam = pass(lParams[i], rParams[i])
        if (!uParam.wasSuccessful()) return Unification.unsuccessful()

        uBindings.push(...uParam.bindings)
        uParams.push(uParam)
      }

      const nType = uBindings.length === 0 ? lRes : new CompoundType(uBase.getType(), uParams.map(p => p.getType()))
      return Unification.successful(nType, uBindings)
    }

    if (lRes.isSimple() && rRes.isSimple()) return exact(lRes, rRes)

    return Unification.unsuccessful()
  }

  return pass(lType, rType)
}

module.exports = {makeType, unify}
