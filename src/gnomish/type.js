class Type {
  constructor (name, args = []) {
    this.name = name
    this.args = args
  }

  getName () { return this.name }

  getArgs () { return this.args }

  isParameter () { return this.name[0] === "'" }

  toString () {
    let s = this.name
    if (this.args.length > 0) {
      s += ('(' + this.args.map(a => a.toString()).join(', ') + ')')
    }
    return s
  }
}

module.exports = {Type}
