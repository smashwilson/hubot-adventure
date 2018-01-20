class Unification {
  static successful (types, bindings) {
    return new Unification(types, bindings)
  }

  static unsuccessful () {
    return new Unification(null, [])
  }

  static base () {
    return Unification.successful([], [])
  }

  constructor (types, bindings) {
    this.types = types
    this.bindings = bindings
  }

  wasSuccessful () { return this.types !== null }

  getTypes () { return this.types }

  getType () {
    if (this.types.length !== 1) {
      throw new Error(`Expected a single Type, but got ${this.types.length}`)
    }
    return this.types[0]
  }

  apply (symbolTable) {
    for (const [name, t, type] of this.bindings) {
      symbolTable.setStatic(name, t, type)
    }
    return this
  }

  assimilate (other) {
    this.types.push(...other.getTypes())
    this.bindings.push(...other.bindings)
    return this
  }

  toString () {
    if (this.wasSuccessful()) {
      let r = 'Unification : '
      r += this.types.map(t => t.toString()).join(', ')
      r += ' ['
      r += this.bindings.map(b => `${b[0]} => ${b[2].toString()}`).join(' ')
      r += ']'
      return r
    } else {
      return 'Unification [failed]'
    }
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
    const nParams = this.params.reduce((acc, p) => {
      acc.push(...p.resolveRecursively(symbolTable))
      return acc
    }, [])
    const changed = nParams.length !== this.params.length || nParams.some((np, i) => np !== this.params[i])
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

function unify (symbolTable, lTypes, rTypes) {
  console.log('--- beginning unification ---\n', {lTypes: lTypes.map(t => t.toString()), rTypes: rTypes.map(t => t.toString())})
  const st = symbolTable.push()
  const tType = st.at('Type').getValue()
  const tList = st.at('List').getValue()
  const tTypeList = makeType(tList, [tType])

  function exact (a, b) {
    if (a === b) return Unification.successful([a], [])
    return Unification.unsuccessful()
  }

  function assignParameter (param, value) {
    st.setStatic(param.getName(), tType, value)
    return Unification.successful([value], [[param.getName(), tType, value]])
  }

  function assignParameterList (param, values) {
    st.setStatic(param.getName(), tTypeList, values)
    return Unification.successful(values, [[param.getName(), tTypeList, values]])
  }

  function resolveInPlace (types, i) {
    const results = types[i].resolve(st)
    if (results.length !== 1 || results[0] !== types[i]) {
      types.splice(i, 1, ...results)
    }
    return types[i]
  }

  function unifySingle (lType, rType) {
    if (lType.isParameter() && !rType.isParameter()) return assignParameter(lType, rType)
    if (rType.isParameter()) return assignParameter(rType, lType)

    if (lType.isCompound() && rType.isCompound()) {
      const uBase = unifySingle(lType.getBase(), rType.getBase())
      if (!uBase.wasSuccessful()) return Unification.unsuccessful()

      const uParams = unifyMulti(lType.getParams(), rType.getParams())
      if (!uParams.wasSuccessful()) return Unification.unsuccessful()

      return Unification.successful(
        [makeType(uBase.getType(), uParams.getTypes())],
        uBase.bindings.concat(uParams.bindings))
    }

    if (lType.isSimple() && rType.isSimple()) return exact(lType, rType)

    return Unification.unsuccessful()
  }

  function unifyMulti (lTypesOriginal, rTypesOriginal) {
    const lTypes = lTypesOriginal.slice()
    const rTypes = rTypesOriginal.slice()

    let li = 0
    let ri = 0
    const result = Unification.base()

    while (li < lTypes.length && ri < rTypes.length) {
      let lType = resolveInPlace(lTypes, li)
      let rType = resolveInPlace(rTypes, ri)
      console.log('Resolved:\n', {lType: lType.toString(), rType: rType.toString()})

      if (lType.isSplat()) {
        const values = rTypes.slice(ri)
        const u = assignParameterList(lType, values)
        result.assimilate(u)

        li++
        ri = rTypes.length
        continue
      }
      if (rType.isSplat()) {
        const values = lTypes.slice(li)
        const u = assignParameterList(rType, values)
        result.assimilate(u)

        li = lTypes.length
        ri++
        continue
      }

      if (lType.isRepeatable()) {
        while (ri < rTypes.length) {
          rType = rTypes[ri]
          const u = unifySingle(lType.getInner(), rType)
          if (!u.wasSuccessful()) {
            ri--
            break
          } else {
            result.assimilate(u)
            ri++
          }
        }
        li++
        continue
      }
      if (rType.isRepeatable()) {
        while (li < lTypes.length) {
          lType = lTypes[li]
          const u = unifySingle(lType, rType.getInner())
          if (!u.wasSuccessful()) {
            li--
            break
          } else {
            result.assimilate(u)
            li++
          }
        }
        ri++
        continue
      }

      const u = unifySingle(lType, rType)
      if (!u.wasSuccessful()) {
        return Unification.unsuccessful()
      }
      console.log('Unified single types as:\n', {u})
      result.assimilate(u)

      li++
      ri++
    }

    return result
  }

  return unifyMulti(lTypes, rTypes)
}

module.exports = {makeType, unify}
