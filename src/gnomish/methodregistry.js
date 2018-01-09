const {unify} = require('./type')

class Signature {
  constructor (receiverType, argTypes, callback, retType) {
    this.receiverType = receiverType
    this.argTypes = argTypes
    this.callback = callback
    this.retType = retType
  }

  match (symbolTable, receiverType, callArgTypes) {
    const st = symbolTable.push()

    const typePairs = [
      [this.receiverType, receiverType],
      ...this.argTypes.map((t, i) => [t, callArgTypes[i]])
    ]

    for (const [lhs, rhs] of typePairs) {
      const u = unify(st, lhs, rhs)
      if (!u.wasSuccessful()) {
        return null
      }
      u.apply(st)
    }

    const boundRetType = this.retType.resolveRecursively(st)

    return boundRetType === this.retType
      ? this
      : new Signature(this.receiverType, this.argTypes, this.callback, boundRetType)
  }

  getCallback () {
    return this.callback
  }

  getReturnType () {
    return this.retType
  }
}

class MethodRegistry {
  constructor () {
    this.bySelector = new Map()
  }

  register (receiverType, selector, argTypes, retType, callback) {
    let signatures = this.bySelector.get(selector)
    if (!signatures) {
      signatures = []
      this.bySelector.set(selector, signatures)
    }

    const addedSignature = new Signature(receiverType, argTypes, callback, retType)
    signatures.push(addedSignature)
  }

  lookup (symbolTable, receiverType, selector, argTypes) {
    const signatures = this.bySelector.get(selector)
    if (!signatures) {
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

    if (matches.length > 1) {
      const argMessage = argTypes.length === 0
        ? 'without arguments'
        : `with argument types ${argTypes.map(t => t.toString()).join(', ')}`

      const e = new Error(
        `Type ${receiverType.toString()} has ${matches.length} methods called "${selector}" ${argMessage}`
      )
      e.candidates = matches
      throw e
    }

    return matches[0]
  }
}

module.exports = {MethodRegistry}
