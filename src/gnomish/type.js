class Unification {
  static successful (types, leftBindings, counts) {
    return new Unification(types, leftBindings, counts)
  }

  static unsuccessful () {
    return new Unification(null, [])
  }

  static base () {
    return Unification.successful([], [], {})
  }

  constructor (types, leftBindings, counts) {
    this.types = types
    this.leftBindings = leftBindings
    this.counts = Object.assign({exact: 0, multis: 0}, counts)
  }

  wasSuccessful () { return this.types !== null }

  getTypes () { return this.types }

  getType () {
    if (this.types.length !== 1) {
      throw new Error(`Expected a single Type, but got ${this.types.length}`)
    }
    return this.types[0]
  }

  countExactMatches () { return this.counts.exact }

  countMultiMatches () { return this.counts.multis }

  countBindings () { return this.leftBindings.length }

  applyLeft (symbolTable) {
    for (const [name, t, type] of this.leftBindings) {
      symbolTable.setStatic(name, t, type)
    }
    return this
  }

  assimilate (other) {
    this.types.push(...other.getTypes())
    this.leftBindings.push(...other.leftBindings)
    this.counts.exact += other.counts.exact
    this.counts.multis += other.counts.multis
    return this
  }

  toString () {
    if (this.wasSuccessful()) {
      let r = 'Unification : '
      r += this.types.map(t => t.toString()).join(', ')
      r += ' ['
      r += this.leftBindings.map(b => `${b[0]} => ${b[2].toString()}`).join(' ')
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

  isWrapped () { return false }

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

  isWrapped () { return true }
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
  const lSt = symbolTable.push('lhs')
  const rSt = symbolTable.push('rhs')
  const tType = symbolTable.at('Type').getValue()
  const tList = symbolTable.at('List').getValue()
  const tTypeList = makeType(tList, [tType])

  function exact (a, b, replaced, multi) {
    const counts = {}
    if (multi) {
      counts.multis = 1
    } else if (!replaced) {
      counts.exact = 1
    }

    if (a === b) return Unification.successful([a], [], counts)
    return Unification.unsuccessful()
  }

  function assignLeftParameter (param, value) {
    lSt.setStatic(param.getName(), tType, value)
    return Unification.successful([value], [[param.getName(), tType, value]], {})
  }

  function assignRightParameter (param, value) {
    rSt.setStatic(param.getName(), tType, value)
    return Unification.successful([value], [], {})
  }

  function assignLeftParameterList (param, values) {
    lSt.setStatic(param.getName(), tTypeList, values)
    return Unification.successful(values, [[param.getName(), tTypeList, values]], {multis: values.length})
  }

  function assignRightParameterList (param, values) {
    rSt.setStatic(param.getName(), tTypeList, values)
    return Unification.successful(values, [], {multis: values.length})
  }

  function resolveInPlace (sideSt, types, i) {
    const results = types[i].resolve(sideSt)
    const replaced = results[0] !== types[i]
    if (results.length !== 1 || replaced) {
      types.splice(i, 1, ...results)
    }
    return {replaced, type: types[i]}
  }

  function unifySingle (lType, rType, replaced, multi) {
    if (lType.isParameter()) return assignLeftParameter(lType, rType)
    if (rType.isParameter()) return assignRightParameter(rType, lType)

    if (lType.isCompound() && rType.isCompound()) {
      const uBase = unifySingle(lType.getBase(), rType.getBase(), replaced, multi)
      if (!uBase.wasSuccessful()) return Unification.unsuccessful()

      const uParams = unifyMulti(lType.getParams(), rType.getParams())
      if (!uParams.wasSuccessful()) return Unification.unsuccessful()

      return Unification.successful(
        [makeType(uBase.getType(), uParams.getTypes())],
        uBase.leftBindings.concat(uParams.leftBindings),
        {
          exact: uBase.countExactMatches() + uParams.countExactMatches(),
          multis: uBase.countMultiMatches() + uParams.countMultiMatches()
        })
    }

    if (lType.isSimple() && rType.isSimple()) return exact(lType, rType, replaced, multi)

    return Unification.unsuccessful()
  }

  function unifyMulti (lTypesOriginal, rTypesOriginal) {
    const lTypes = lTypesOriginal.slice()
    const rTypes = rTypesOriginal.slice()

    let li = 0
    let ri = 0

    let lSplat = null
    const lSplatValues = []

    let rSplat = null
    const rSplatValues = []

    const result = Unification.base()

    while (li < lTypes.length && ri < rTypes.length) {
      const {replaced: lReplaced, type: lType} = resolveInPlace(lSt, lTypes, li)
      const {replaced: rReplaced, type: rType} = resolveInPlace(rSt, rTypes, ri)

      if (lType.isSplat()) {
        lSplat = lType
        lSplatValues.push(rType)
        ri++
        if (ri >= rTypes.length) li++
        continue
      }
      if (rType.isSplat()) {
        rSplat = rType
        rSplatValues.push(lType)
        li++
        if (li >= lTypes.length) ri++
        continue
      }

      const lInner = lType.isWrapped() ? lType.getInner() : lType
      const rInner = rType.isWrapped() ? rType.getInner() : rType

      const replaced = lReplaced || rReplaced
      const multi = lType.isRepeatable() || rType.isRepeatable()
      const u = unifySingle(lInner, rInner, replaced, multi)
      if (!u.wasSuccessful()) {
        if (lType.isRepeatable()) {
          li++
          continue
        }
        if (rType.isRepeatable()) {
          ri++
          continue
        }

        return Unification.unsuccessful()
      }

      result.assimilate(u)

      if (!lType.isRepeatable() || ri + 1 >= rTypes.length) li++
      if (!rType.isRepeatable() || li >= lTypes.length) ri++
    }

    while (li < lTypes.length) {
      if (lTypes[li].isRepeatable()) {
        li++
      } else if (lTypes[li].isSplat()) {
        result.assimilate(assignLeftParameterList(lTypes[li].getInner(), []))
        li++
      }
      break
    }
    while (ri < rTypes.length) {
      if (rTypes[ri].isRepeatable()) {
        ri++
      } else if (rTypes[ri].isSplat()) {
        result.assimilate(assignRightParameterList(rTypes[ri].getInner(), []))
        ri++
      }
      break
    }

    if (li < lTypes.length || ri < rTypes.length) return Unification.unsuccessful()

    if (lSplat) {
      result.assimilate(assignLeftParameterList(lSplat.getInner(), lSplatValues))
    }
    if (rSplat) {
      result.assimilate(assignRightParameterList(rSplat.getInner(), rSplatValues))
    }

    return result
  }

  return unifyMulti(lTypes, rTypes)
}

module.exports = {makeType, unify}
