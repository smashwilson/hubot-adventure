class Signature {
  constructor (argTypes, callback, retType) {
    this.argTypes = argTypes
    this.callback = callback
    this.retType = retType
  }

  matches (callArgTypes) {
    return this.argTypes.length === callArgTypes.length &&
      this.argTypes.every((argType, index) => argType === callArgTypes[index])
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
    this.byReceiverType = new Map()
  }

  register (receiverType, selector, argTypes, retType, callback) {
    let bySelector = this.byReceiverType.get(receiverType)
    if (!bySelector) {
      bySelector = new Map()
      this.byReceiverType.set(receiverType, bySelector)
    }
    let signatures = bySelector.get(selector)
    if (!signatures) {
      signatures = []
      bySelector.set(selector, signatures)
    }

    const addedSignature = new Signature(argTypes, callback, retType)
    signatures.push(addedSignature)
  }

  lookup (receiverType, selector, argTypes) {
    const bySelector = this.byReceiverType.get(receiverType)
    if (!bySelector) {
      throw new Error(`Type ${receiverType.toString()} has no method "${selector}"`)
    }
    const signatures = bySelector.get(selector)
    if (!signatures) {
      throw new Error(`Type ${receiverType.toString()} has no method "${selector}"`)
    }

    const matches = signatures.filter(signature => signature.matches(argTypes))
    if (matches.length === 0) {
      const argMessage = argTypes.length === 0
        ? 'without arguments'
        : `with argument types ${argTypes.map(t => to.toString()).join(', ')}`

      throw new Error(`Type ${receiverType.toString()} has no method "${selector}" ${argMessage}`)
    }

    if (matches.length > 1) {
      const argMessage = argTypes.length === 0
        ? 'without arguments'
        : `with argument types ${argTypes.map(t => to.toString()).join(', ')}`

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
