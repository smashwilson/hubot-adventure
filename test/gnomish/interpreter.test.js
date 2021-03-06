/* eslint-env mocha */

const { assert } = require('chai')
const { parse } = require('./helper')
const { makeType } = require('../../src/gnomish/type')
const { SymbolTable } = require('../../src/gnomish/symboltable')
const { MethodRegistry } = require('../../src/gnomish/methodregistry')

describe('Interpreter', function () {
  let st, mr
  let tInt, tReal, tString, tBool, tBlock, tOption, tList, tType

  const GLOBAL = Symbol('global')

  beforeEach(function () {
    tInt = makeType('Int')
    tReal = makeType('Real')
    tString = makeType('String')
    tBool = makeType('Bool')
    tBlock = makeType('Block')
    tOption = makeType('Option')
    tList = makeType('List')
    tType = makeType('Type')

    st = new SymbolTable(GLOBAL)
    st.setStatic('Type', tType, tType)
    st.setStatic('Int', tType, tInt)
    st.setStatic('Real', tType, tReal)
    st.setStatic('String', tType, tString)
    st.setStatic('Bool', tType, tBool)
    st.setStatic('Block', tType, tBlock)
    st.setStatic('Option', tType, tOption)
    st.setStatic('List', tType, tList)

    st.setStatic('true', tBool, true)
    st.setStatic('false', tBool, false)

    mr = new MethodRegistry()
    mr.register(tInt, '+', [tInt], tInt, ({ receiver }, operand) => {
      return receiver + operand
    })
  })

  it('optionally has a provided external context', function () {
    const context = Symbol('context')

    const program = parse('3')
    program.analyze(st, mr)
    program.setContext(context)
    const { interpreter } = program.interpret()
    assert.strictEqual(interpreter.getContext(), context)
  })

  it('interprets Ints as numbers', function () {
    const program = parse('3')
    program.analyze(st, mr)
    const { result } = program.interpret()

    assert.strictEqual(result, 3)
  })

  it('interprets Reals as numbers', function () {
    const program = parse('-4.2')
    program.analyze(st, mr)
    const { result } = program.interpret()

    assert.strictEqual(result, -4.2)
  })

  it('interprets Strings as strings', function () {
    const program = parse('"wat"')
    program.analyze(st, mr)
    const { result } = program.interpret()

    assert.strictEqual(result, 'wat')
  })

  it('interprets let expressions and var accesses', function () {
    const program = parse(`
      let x = 42
      x
    `).analyze(st, mr)
    const { result } = program.interpret()

    assert.strictEqual(result, 42)
  })

  it('interprets assignments', function () {
    const program = parse(`
      let x = 1
      x = 2
      x
    `).analyze(st, mr)
    const { result } = program.interpret()

    assert.strictEqual(result, 2)
  })

  describe('method calls', function () {
    it('executes a bound callback', function () {
      mr.register(tInt, '*', [tInt], tInt, ({ receiver }, operand) => {
        return receiver * operand
      })

      const program = parse('10 * 4').analyze(st, mr)
      const { result } = program.interpret()

      assert.strictEqual(result, 40)
    })

    it('prunes calls that have been completed statically', function () {
      let staticCall = false
      let runtimeCall = false

      mr.register(
        tInt, 'selector', [tInt], tInt,
        ({ receiver }, operand) => {
          runtimeCall = true
          return receiver + operand
        }
      ).setStaticCallback(
        ({ astNode }) => {
          staticCall = true
          astNode.setStaticValue(10)
        }
      )

      const program = parse('1.selector(2)').analyze(st, mr)
      const { result } = program.interpret()

      assert.strictEqual(result, 10)
      assert.isTrue(staticCall)
      assert.isFalse(runtimeCall)
    })
  })

  describe('if statements', function () {
    it('executes the then branch on true', function () {
      const program = parse(`
        if {true} then {1} else {2}
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.strictEqual(result, 1)
    })

    it('executes the else branch on false', function () {
      const program = parse(`
        if {false} then {1} else {2}
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.strictEqual(result, 2)
    })

    it('returns an option holding the expression value when an else-less if expression has a true condition', function () {
      const program = parse(`
        if {true} then {7}
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.isTrue(result.hasValue())
      assert.strictEqual(result.getValue(), 7)
    })

    it('returns none when an else-less if expression has a false condition', function () {
      const program = parse(`
        if {false} then {"nope"}
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.isFalse(result.hasValue())
    })
  })

  describe('while loops', function () {
    beforeEach(function () {
      mr.register(tInt, '<', [tInt], tBool, ({ receiver }, operand) => {
        return receiver < operand
      })
    })

    it('executes the body while its condition is true', function () {
      const program = parse(`
        let x = 0
        let y = 1
        while {x < 10} do {
          x = x + 1
          y = y + 2
        }
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.isTrue(result.hasValue())
      assert.strictEqual(result.getValue(), 21)
    })

    it('returns none if its condition is never true', function () {
      const program = parse(`
        let x = 100
        while {x < 10} do {
          x = x + 1
        }
      `).analyze(st, mr)
      const { result } = program.interpret()

      assert.isFalse(result.hasValue())
    })
  })

  describe('blocks', function () {
    it('creates a new Block with the appropriate AST nodes', function () {
      const program = parse('{x: Int, y: Int | x + y + 1}').analyze(st, mr)
      const { result } = program.interpret()

      const blockNode = program.node.getExprs()[0]

      assert.lengthOf(result.argNodes, 2)
      assert.strictEqual(result.argNodes[0], blockNode.getArgs()[0])
      assert.strictEqual(result.argNodes[1], blockNode.getArgs()[1])

      assert.strictEqual(result.bodyNode, blockNode.getBody())
    })

    it('captures referenced external scopes', function () {
      const program = parse(`
        let outer = 7
        { outer + 1 }
      `).analyze(st, mr)
      const { result } = program.interpret()

      const rootFrame = program.node
      assert.strictEqual(result.getSlot(rootFrame, 0), 7)
    })
  })
})
