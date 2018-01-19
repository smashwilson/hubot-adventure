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
      symbolTable.setStatic(name, tType, type)
    }
    return this
  }
}

class Type {
  resolve (symbolTable) {
    return [this]
  }

  resolveRecursively (symbolTable) {
    return [this]
  }

  isSimple () { return false }

  isParameter () { return false }

  isCompound () { return false }

  isRepeatable () { return false }

  isSplat () { return false }

  repeatable () { return new RepeatableType(this) }

  splat () { return new SplatType(this) }
}

class SimpleType extends Type {
  constructor (name) {
    super()
    this.name = name
  }

  getName () { return this.name }

  isSimple () { return true }

  splat () {
    throw new Error(`Simple type ${this.toString()} cannot be a splat`)
  }

  toString () { return this.name }
}

class TypeParameter extends Type {
  constructor (name) {
    super()
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
      return [entry.getValue()]
    } else {
      return [this]
    }
  }

  resolveRecursively (symbolTable) {
    return this.resolve(symbolTable)
  }

  isParameter () { return true }

  toString () { return this.name }
}

class CompoundType extends Type {
  constructor (base, params) {
    super()
    this.base = base
    this.params = params
  }

  getBase () { return this.base }

  getParams () { return this.params }

  resolve (symbolTable) {
    const rBase = this.base.resolve(symbolTable)[0]
    if (rBase !== this.base) {
      return [new CompoundType(rBase, this.params.slice())]
    } else {
      return [this]
    }
  }

  resolveRecursively (symbolTable) {
    const t = this.resolve(symbolTable)[0]
    const nParams = this.params.map(p => p.resolveRecursively(symbolTable))
    const changed = nParams.some((np, i) => np !== this.params[i])
    if (!changed && t === this) {
      return [this]
    } else {
      t.params = nParams
      return [t]
    }
  }

  isCompound () { return true }

  splat () {
    throw new Error(`Compound type ${this.toString()} cannot be a splat`)
  }

  toString () {
    return `${this.base.toString()}(${this.params.map(p => p.toString()).join(', ')})`
  }
}

class TypeWrapper extends Type {
  constructor (inner) {
    super()
    this.inner = inner
  }

  getInner () { return this.inner }

  resolve (symbolTable) {
    const i = this.inner.resolve(symbolTable)[0]
    if (i !== this.inner) {
      return [new this.constructor(i)]
    } else {
      return [this]
    }
  }

  resolveRecursively (symbolTable) {
    return this.resolve(symbolTable)
  }

  isSimple () { return this.inner.isSimple() }

  isParameter () { return this.inner.isParameter() }

  isCompound () { return this.inner.isCompound() }
}

class RepeatableType extends TypeWrapper {
  isRepeatable () {
    return true
  }

  repeatable () {
    throw new Error(`Type ${this.toString()} is already repeatable`)
  }

  splat () {
    throw new Error(`Repeatable type ${this.toString()} cannot be a splat`)
  }

  toString () {
    return this.getInner().toString() + '*'
  }
}

class SplatType extends TypeWrapper {
  isSplat () {
    return true
  }

  resolve (symbolTable) {
    const name = this.getInner().getName()
    if (symbolTable.has(name)) {
      const entry = symbolTable.at(name)
      if (!entry.isStatic()) {
        throw new Error(
          `Identifier ${this.name} is not known at compile time, so it can't be in a type expression`)
      }

      const entryType = entry.getType()
      const isTypeList =
        entryType.isCompound() &&
        entryType.getBase() === symbolTable.at('List').getValue() &&
        entryType.getParams().length === 1 &&
        entryType.getParams()[0] === symbolTable.at('Type').getValue()
      if (!isTypeList) {
        throw new Error(
          `Identifier ${this.name} is not a List(Type), so it can't be in a type splat expression`)
      }
      return entry.getValue()
    } else {
      return [this]
    }
  }

  repeatable () {
    throw new Error(`Splat type ${this.toString()} cannot be repeatable`)
  }

  splat () {
    throw new Error(`Type ${this.toString()} is already a splat`)
  }

  toString () {
    return this.getInner().toString() + '...'
  }
}

function makeType (name, params = []) {
  let base
  if (typeof name === 'string') {
    let attr = null

    base = name.startsWith("'") ? new TypeParameter(name, attr) : new SimpleType(name, attr)
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
    st.setStatic(param.getName(), tType, value)
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
