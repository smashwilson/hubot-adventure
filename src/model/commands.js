const { makeType } = require('../gnomish/type')

class SayResultBlock {
  constructor (block) {
    this.block = block
  }

  evaluate (interpreter, args) {
    const value = this.block.evaluate(interpreter, args)
    const context = interpreter.getContext()
    if (context && context.say) {
      context.say(value)
    }
  }
}

class SayStringBlock {
  constructor (response) {
    this.response = response
  }

  evaluate (interpreter) {
    const context = interpreter.getContext()
    if (context && context.say) {
      context.say(this.response)
    }
  }
}

module.exports = {
  registerCommandMethods ({ t, methodRegistry, methodName, receiverType, receiverMethod }) {
    const tR = makeType("'R")
    const tAnyBlock = makeType(t.Block, [tR])
    const tStringReturningBlock = makeType(t.Block, [t.String])
    const tStringList = makeType(t.List, [t.String])

    const anyBlockHandler = ({ receiver }, command, block) => receiver[receiverMethod](command, block)

    const stringReturningBlockHandler = ({ receiver }, command, block) => {
      const sayBlock = new SayResultBlock(block)
      receiver[receiverMethod](command, sayBlock)
      return receiver
    }

    const stringHandler = ({ receiver }, command, response) => {
      const sayBlock = new SayStringBlock(response)
      receiver[receiverMethod](command, sayBlock)
      return receiver
    }

    const forStringList = (handler) => {
      return (context, ...args) => {
        const aliases = args[0]
        const rest = args.slice(1)

        for (const alias of aliases) {
          handler(context, alias, ...rest)
        }

        return context.receiver
      }
    }

    // String, Block('R) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [t.String, tAnyBlock], receiverType,
      anyBlockHandler
    )

    // String, Block(String) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [t.String, tStringReturningBlock], receiverType,
      stringReturningBlockHandler
    )

    // String, String -> Receiver
    methodRegistry.register(
      receiverType, methodName, [t.String, t.String], receiverType,
      stringHandler
    )

    // List(String), Block('R) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [tStringList, tAnyBlock], receiverType,
      forStringList(anyBlockHandler)
    )

    // List(String), Block(String) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [tStringList, tStringReturningBlock], receiverType,
      forStringList(stringReturningBlockHandler)
    )

    // List(String), String -> Receiver
    methodRegistry.register(
      receiverType, methodName, [tStringList, t.String], receiverType,
      forStringList(stringHandler)
    )
  },

  registerFallthroughMethods ({ t, methodRegistry, methodName, receiverType, receiverMethod }) {
    const tR = makeType("'R")
    const tAnyBlock = makeType(t.Block, [tR, t.String])
    const tStringReturningBlock = makeType(t.Block, [t.String, t.String])

    const anyBlockHandler = ({ receiver }, block) => receiver[receiverMethod](block)

    const stringReturningBlockHandler = ({ receiver }, block) => {
      const sayBlock = new SayResultBlock(block)
      receiver[receiverMethod](sayBlock)
      return receiver
    }

    const stringHandler = ({ receiver }, response) => {
      const sayBlock = new SayStringBlock(response)
      receiver[receiverMethod](sayBlock)
      return receiver
    }

    // Block('R, String) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [tAnyBlock], receiverType,
      anyBlockHandler
    )

    // Block(String, String) -> Receiver
    methodRegistry.register(
      receiverType, methodName, [tStringReturningBlock], receiverType,
      stringReturningBlockHandler
    )

    // String -> Receiver
    methodRegistry.register(
      receiverType, methodName, [t.String], receiverType,
      stringHandler
    )
  }
}
