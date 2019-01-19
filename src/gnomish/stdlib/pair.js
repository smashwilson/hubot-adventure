const { makeType } = require('../type')

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
      ({ receiver }, r) => new Pair(receiver, r)
    ).markPure()

    // Accessors

    methodRegistry.register(
      tPairAB, 'left', [], tA,
      ({ receiver }) => receiver.getLeft()
    ).markPure()

    methodRegistry.register(
      tPairAB, 'right', [], tB,
      ({ receiver }) => receiver.getRight()
    ).markPure()

    // Comparison

    methodRegistry.register(
      tPairAB, '==', [tPairAB], t.Bool,
      ({receiver, receiverType, interpreter}, operand) => {
        const [a, b] = receiverType.getParams()
        const aEq = methodRegistry.lookup(symbolTable, a, '==', [a])
        const bEq = methodRegistry.lookup(symbolTable, b, '==', [b])

        const left = aEq.invoke({receiver: receiver.getLeft(), interpreter}, operand.getLeft())
        const right = bEq.invoke({receiver: receiver.getRight(), interpreter}, operand.getRight())
        return left && right
      })

    // Duplication

    methodRegistry.register(
      tPairAB, 'copy', [], tPairAB,
      ({receiver, receiverType, interpreter}) => {
        const [a, b] = receiverType.getParams()
        const aCopy = methodRegistry.lookup(symbolTable, a, 'copy', [])
        const bCopy = methodRegistry.lookup(symbolTable, b, 'copy', [])

        return new Pair(
          aCopy.invoke({receiver: receiver.getLeft(), interpreter}),
          bCopy.invoke({receiver: receiver.getRight(), interpreter})
        )
      })
  }
}
