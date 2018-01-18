const {makeType} = require('./type')

class TypeRegistry {
  constructor (symbolTable) {
    this.st = symbolTable

    if (!this.st.has('Type')) {
      this.Type = makeType('Type')
      this.st.setStatic('Type', this.Type, this.Type)
    } else {
      this.Type = this.st.at('Type').getValue()
    }

    for (const {entry} of this.st.all()) {
      if (entry.isStatic() && entry.getType() === this.Type) {
        const t = entry.getValue()
        this[t.getName()] = t
      }
    }
  }

  registerType (typeName) {
    if (this[typeName] !== undefined) {
      throw new Error(`Colliding type name ${typeName} in stdlib`)
    }

    const t = makeType(typeName)
    this[typeName] = t
    this.st.setStatic(typeName, this.Type, t)
    return t
  }
}

module.exports = {TypeRegistry}
