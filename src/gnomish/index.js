const parser = require('./gnomish')
const {SexpVisitor} = require('./sexpr')

class Root {
  constructor (node) {
    this.node = node
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
