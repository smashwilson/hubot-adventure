const {makeType} = require('../type')

class Pair {
  constructor (left, right) {
    this.left = left
    this.right = right
  }

  getLeft () { return this.left }

  getRight () { return this.right }
}

module.exports = {
  registerTypes (t, symbolTable, methodRegistry) {
    t.registerType('Pair')
  },

  registerMethods (t, symbolTable, methodRegistry) {
    const tA = makeType("'A")
    const tB = makeType("'B")
    const tPairAB = makeType(t.Pair, [tA, tB])

    // Construction
    methodRegistry.register(
      t.World, 'pair', [tA, tB], tPairAB,
      (_, l, r) => new Pair(l, r)
    ).markPure()

    methodRegistry.register(
      tA, '=>', [tB], tPairAB,
      ({receiver}, r) => new Pair(receiver, r)
    ).markPure()

    // Accessors

    methodRegistry.register(
      tPairAB, 'left', [], tA,
      ({receiver}) => receiver.getLeft()
    ).markPure()

    methodRegistry.register(
      tPairAB, 'right', [], tB,
      ({receiver}) => receiver.getRight()
    ).markPure()
  }
}
