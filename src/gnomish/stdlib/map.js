const {makeType} = require('../type')
const {Some, none} = require('./option')

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
      ({receiver}, key) => {
        const v = receiver.get(key)
        return v === undefined ? none : new Some(v)
      })

    methodRegistry.register(
      tMapAB, 'get', [tA], tB,
      ({receiver}, key) => {
        const v = receiver.get(key)
        if (v === undefined) throw new Error(`Map key ${key} not present`)
        return v
      })

    methodRegistry.register(
      tMapAB, 'put', [tA, tB], tMapAB,
      ({receiver}, key, value) => {
        receiver.set(key, value)
        return receiver
      })
  }
}
