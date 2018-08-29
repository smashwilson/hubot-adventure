const { unify } = require('./type')

class Signature {
  constructor (receiverType, argTypes, callback, retType) {
    this.receiverType = receiverType
    this.argTypes = argTypes
    this.callback = callback
    this.retType = retType

    this.staticCallback = () => {}
  }

  match (symbolTable, receiverType, callArgTypes) {
    const st = symbolTable.push(Symbol('MethodRegistry match'))
    const u = unify(st, [this.receiverType, ...this.argTypes], [receiverType, ...callArgTypes])
    if (!u.wasSuccessful()) return null

    u.applyLeft(st)

    const boundRetType = this.retType.resolveRecursively(st)[0]
    return new Match(this, u, boundRetType)
  }

  getCallback () {
    return this.callback
  }

  getStaticCallback () {
    return this.staticCallback
  }

  getReturnType () {
    return this.retType
  }

  setStaticCallback (cb) {
    this.staticCallback = cb
  }

  markPure () {
    this.setStaticCallback(({ astNode }) => {
      if (!astNode.getReceiver().hasStaticValue()) return
      if (!astNode.getArgs().every(argNode => argNode.hasStaticValue())) return

      const args = astNode.getArgs().map(argNode => argNode.getStaticValue())
      const value = this.getCallback()({
        receiver: astNode.getReceiver().getStaticValue(),
        selector: astNode.getName(),
        interpreter: Symbol('static'),
        astNode
      }, ...args)
      astNode.setStaticValue(value)
    })
    return this
  }

  toString () {
    let r = this.receiverType.toString()
    r += '#('
    r += this.argTypes.map(t => t.toString()).join(', ')
    r += ') -> '
    r += this.retType.toString()
    return r
  }
}

class Match {
  constructor (signature, unification, retType) {
    this.signature = signature
    this.unification = unification
    this.retType = retType
  }

  getCallback () {
    return this.signature.getCallback()
  }

  getStaticCallback () {
    return this.signature.getStaticCallback()
  }

  getReturnType () {
    return this.retType
  }

  getUnification () {
    return this.unification
  }

  toString () {
    return `${this.signature} @ ${this.unification}`
  }
}

function comparePriority (a, b) {
  const ua = a.getUnification()
  const ub = b.getUnification()

  // Unifications with multi matches are always lower priority than those without them.
  // If both have multi matches, prefer the unification that has fewer.
  if (ua.countMultiMatches() === 0 && ub.countMultiMatches() > 0) return 1
  if (ua.countMultiMatches() > 0 && ub.countMultiMatches() === 0) return -1
  if (ua.countMultiMatches() !== ub.countMultiMatches()) {
    return ua.countMultiMatches() > ub.countMultiMatches() ? 1 : -1
  }

  // Unifications with more exact matches are higher priority.
  if (ua.countExactMatches() !== ub.countExactMatches()) {
    return ua.countExactMatches() < ub.countExactMatches() ? -1 : 1
  }

  // Unifications that bind fewer parameters are higher priority.
  if (ua.countBindings() !== ub.countBindings()) {
    return ua.countBindings() > ub.countBindings() ? -1 : 1
  }

  return 0
}

class MethodRegistry {
  constructor (parent = null) {
    this.parent = parent
    this.bySelector = new Map()
  }

  register (receiverType, selector, argTypes, retType, callback) {
    let signatures = this.bySelector.get(selector)
    if (!signatures) {
      signatures = []
      this.bySelector.set(selector, signatures)
    }

    if (receiverType === undefined || !argTypes.every(Boolean) || retType === undefined) {
      console.error({
        receiverType, argTypes, retType
      })
      throw new Error('boom')
    }

    const addedSignature = new Signature(receiverType, argTypes, callback, retType)
    signatures.push(addedSignature)
    return addedSignature
  }

  localSignatures (selector) {
    return this.bySelector.get(selector) || []
  }

  allSignatures (selector) {
    const signatures = this.localSignatures(selector)
    if (this.parent) {
      signatures.push(...this.parent.allSignatures(selector))
    }
    return signatures
  }

  lookup (symbolTable, receiverType, selector, argTypes) {
    const signatures = this.allSignatures(selector)
    if (signatures.length === 0) {
      throw new Error(`Type ${receiverType.toString()} has no method "${selector}"`)
    }

    const matches = signatures
      .map(signature => signature.match(symbolTable, receiverType, argTypes))
      .filter(Boolean)

    if (matches.length === 0) {
      const argMessage = argTypes.length === 0
        ? 'without arguments'
        : `with argument types ${argTypes.map(t => t.toString()).join(', ')}`

      throw new Error(`Type ${receiverType.toString()} has no method "${selector}" ${argMessage}`)
    }

    let priority = [matches[0]]
    for (let i = 1; i < matches.length; i++) {
      const m = matches[i]
      const p = priority[0]

      const cmp = comparePriority(p, m)
      if (cmp === 0) {
        priority.push(m)
      } else if (cmp < 0) {
        priority = [m]
      }
    }

    if (priority.length > 1) {
      const argMessage = argTypes.length === 0
        ? 'without arguments'
        : `with argument types ${argTypes.map(t => t.toString()).join(', ')}`

      const e = new Error(
        `Type ${receiverType.toString()} has ${priority.length} methods called "${selector}" ${argMessage}`
      )
      e.candidates = priority
      throw e
    }

    return priority[0]
  }

  push () {
    return new MethodRegistry(this)
  }

  inspect () {
    const ks = [...this.bySelector.keys()]
    ks.sort()

    return ks.map(k => {
      const signatures = this.bySelector.get(k)
      return signatures.map(s => `${k}: ${s}`).join('\n')
    }).join('\n')
  }
}

module.exports = { MethodRegistry }
