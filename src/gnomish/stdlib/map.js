const { makeType } = require('../type')
const { Some, none } = require('./option')

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Map')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")
    const tB = makeType("'B")
    const tMapAB = makeType(t.Map, [tA, tB])
    const tPairAB = makeType(t.Pair, [tA, tB])

    // Construction

    methodRegistry.register(
      t.World, 'map', [tPairAB.repeatable()], tMapAB,
      (_, ...pairs) => {
        const m = new Map()
        for (const pair of pairs) {
          m.set(pair.getLeft(), pair.getRight())
        }
        return m
      })

    // Access

    methodRegistry.register(
      tMapAB, 'at', [tA], makeType(t.Option, [tB]),
      ({ receiver }, key) => {
        const v = receiver.get(key)
        return v === undefined ? none : new Some(v)
      })

    methodRegistry.register(
      tMapAB, 'get', [tA], tB,
      ({ receiver }, key) => {
        const v = receiver.get(key)
        if (v === undefined) throw new Error(`Map key ${key} not present`)
        return v
      })

    methodRegistry.register(
      tMapAB, 'put', [tA, tB], tMapAB,
      ({ receiver }, key, value) => {
        receiver.set(key, value)
        return receiver
      })

    // Comparison

    methodRegistry.register(
      tMapAB, '==', [tMapAB], t.Bool,
      ({ receiver, receiverType, argumentTypes, interpreter }, arg) => {
        console.log(`comparing ${Array.from(receiver).join(', ')} to ${Array.from(arg).join(', ')}`)

        if (receiver.size !== arg.size) {
          return false
        }

        if (receiver.size === 0 && arg.size === 0) {
          return true
        }

        const valueType = receiverType.getParams()[1]
        const valueEqual = methodRegistry.lookup(symbolTable, valueType, '==', [valueType])

        for (const [key, value] of receiver) {
          console.log(`key: ${key}`)
          const otherValue = arg.get(key)
          if (otherValue === undefined) {
            return false
          }

          console.log(`${key}: comparing ${value} and ${otherValue}`)
          const comp = valueEqual.invoke({
            receiver: value,
            selector: '==',
            interpreter
          }, otherValue)

          if (!comp) {
            return false
          }
        }

        return true
      })

    // Duplication

    methodRegistry.register(
      tMapAB, 'copy', [], tMapAB,
      ({ receiver, receiverType, interpreter }) => {
        const [keyType, valueType] = receiverType.getParams()
        const keyCopy = methodRegistry.lookup(symbolTable, keyType, 'copy', [])
        const valueCopy = methodRegistry.lookup(symbolTable, valueType, 'copy', [])

        const dup = new Map()
        for (const [key, value] of receiver) {
          const keyDup = keyCopy.invoke({ receiver: key, selector: 'copy', interpreter })
          const valueDup = valueCopy.invoke({ receiver: value, selector: 'copy', interpreter })
          dup.set(keyDup, valueDup)
        }
        return dup
      }
    )
  }
}
