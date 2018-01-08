const parser = require('./gnomish')
const {SexpVisitor} = require('./sexpr')
const {Analyzer} = require('./analyzer')

class Root {
  constructor (node) {
    this.node = node
  }

  analyze (symbolTable, methodRegistry) {
    const visitor = new Analyzer(symbolTable, methodRegistry)
    visitor.visit(this.node)
    return this
  }

  sexp () {
    const visitor = new SexpVisitor()
    visitor.visit(this.node)
    return visitor.result
  }
}

module.exports = {
  parse (...args) {
    return new Root(parser.parse(...args))
  }
}
