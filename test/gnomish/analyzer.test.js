/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('./helper')
const {makeType} = require('../../src/gnomish/type')
const {SymbolTable} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

describe('Analyzer', function () {
  let st, mr
  let tInt, tReal, tString, tBool, tBlock, tOption, tType

  const GLOBAL = Symbol('global')

  beforeEach(function () {
    tInt = makeType('Int')
    tReal = makeType('Real')
    tString = makeType('String')
    tBool = makeType('Bool')
    tBlock = makeType('Block')
    tOption = makeType('Option')
    tType = makeType('Type')

    st = new SymbolTable(GLOBAL)
    st.setStatic('Type', tType, tType)
    st.setStatic('Int', tType, tInt)
    st.setStatic('Real', tType, tReal)
    st.setStatic('String', tType, tString)
    st.setStatic('Bool', tType, tBool)
    st.setStatic('Block', tType, tBlock)
    st.setStatic('Option', tType, tOption)

    st.setStatic('true', tBool, true)
    st.setStatic('false', tBool, false)

    mr = new MethodRegistry()
  })

  describe('typechecking', function () {
    it('assigns Int to IntNodes', function () {
      const root = parse('3').analyze(st, mr)
      assert.strictEqual(root.node.getType(), tInt)
    })

    it('assigns Real to RealNodes', function () {
      const root = parse('12.34').analyze(st, mr)
      assert.strictEqual(root.node.getType(), tReal)
    })

    it('assigns String to StringNodes', function () {
      const root = parse('"wat"').analyze(st, mr)
      assert.strictEqual(root.node.getType(), tString)
    })

    it('assigns a type from the symbol table to a VarNode', function () {
      st.allocateSlot('variable', tString)

      const root = parse('variable').analyze(st, mr)
      assert.strictEqual(root.node.getType(), tString)
    })

    describe('ArgNode', function () {
      it('assigns a type from a type annotation', function () {
        const root = parse('{ x: Int | x }').analyze(st, mr)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]
        assert.strictEqual(argNode.getType(), tInt)
      })

      it('infers a type based on a default value', function () {
        const root = parse('{ x = "yes" | x }').analyze(st, mr)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]
        assert.strictEqual(argNode.getType(), tString)
      })

      it('fails when a type annotation and default value are inconsistent', function () {
        const root = parse('{ x : Bool = "yes" | 7 }')
        assert.throws(() => root.analyze(st, mr), /Types "Bool" and "String" do not match/)
      })

      it('may be an unbound type parameter', function () {
        const root = parse("{ x : 'A | x }").analyze(st, mr)

        const blockNode = root.node.getLastExpr()
        const argNode = blockNode.getArgs()[0]
        const argType = argNode.getType()

        assert.isTrue(argType.isParameter())
        assert.equal(argType.getName(), "'A")
      })
    })

    describe('BlockNode', function () {
      it('infers the return type from the final expression', function () {
        const root = parse(`
          {
            3
            "sup"
          }
        `).analyze(st, mr)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 1)
        assert.strictEqual(blockType.getParams()[0], tString)
      })

      it('parameterizes its type with its return value, then argument types', function () {
        const root = parse(`
          { x : Int, y = "foo" | "yep" ; true }
        `).analyze(st, mr)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 3)
        assert.strictEqual(blockType.getParams()[0], tBool)
        assert.strictEqual(blockType.getParams()[1], tInt)
        assert.strictEqual(blockType.getParams()[2], tString)
      })

      it('may have an unbound argument parameter', function () {
        const root = parse("{ x : 'A | 3 }").analyze(st, mr)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 2)
        assert.strictEqual(blockType.getParams()[0], tInt)
        assert.isTrue(blockType.getParams()[1].isParameter())
        assert.equal(blockType.getParams()[1].getName(), "'A")
      })

      it('may have a return type expressed in type parameters', function () {
        const root = parse("{ x : 'A | x }").analyze(st, mr)

        const blockType = root.node.getLastExpr().getType()
        assert.isTrue(blockType.isCompound())
        assert.strictEqual(blockType.getBase(), tBlock)
        assert.lengthOf(blockType.getParams(), 2)
        assert.isTrue(blockType.getParams()[0].isParameter())
        assert.equal(blockType.getParams()[0].getName(), "'A")
        assert.strictEqual(blockType.getParams()[1], blockType.getParams()[0])
      })
    })

    describe('IfNode', function () {
      it('ensures that the condition clause of an IfNode evaluates to a Bool', function () {
        parse('if {true} then {"no"} else {"uh"}').analyze(st, mr)

        const failure = parse('if {6} then {3} else {"no"}')
        assert.throws(() => failure.analyze(st, mr), /Types "Block\(Bool\)" and "Block\(Int\)" do not match/)
      })

      it('ensures that the "then" and "else" branches of an IfNode are consistent', function () {
        const success = parse('if {true} then {3} else {4}').analyze(st, mr)
        assert.strictEqual(success.node.getType(), tInt)

        const failure = parse('if {true} then {3} else {"no"}')
        assert.throws(() => failure.analyze(st, mr), /Types "Block\(Int\)" and "Block\(String\)" do not match/)
      })

      it('derives an Option type if there is no "else" clause', function () {
        const root = parse('if {true} then {1.2}').analyze(st, mr)

        const ifType = root.node.getType()
        assert.isTrue(ifType.isCompound())
        assert.strictEqual(ifType.getBase(), tOption)
        assert.lengthOf(ifType.getParams(), 1)
        assert.strictEqual(ifType.getParams()[0], tReal)
      })
    })

    describe('WhileNode', function () {
      it('ensures that the condition clause evaluates to a Bool', function () {
        parse('while {true} do {3}').analyze(st, mr)

        const failure = parse('while {"no"} do {"boom"}')
        assert.throws(() => failure.analyze(st, mr), /Types "Block\(Bool\)" and "Block\(String\)" do not match/)
      })

      it('derives a type as an option matching the return type of the action clause', function () {
        const root = parse('while {true} do {4.0}').analyze(st, mr)

        const whileType = root.node.getType()
        assert.isTrue(whileType.isCompound())
        assert.strictEqual(whileType.getBase(), tOption)
        assert.lengthOf(whileType.getParams(), 1)
        assert.strictEqual(whileType.getParams()[0], tReal)
      })
    })

    describe('AssignNode', function () {
      it('ensures that the binding is already present', function () {
        st.allocateSlot('x', tInt)

        parse('x = 4').analyze(st, mr)

        const failure = parse('y = 7')
        assert.throws(() => failure.analyze(st, mr), /Identifier "y" not found/)
      })

      it("ensures that the binding's type is consistent with the assigned expression", function () {
        const blockType = makeType(tBlock, [tInt, makeType(tOption, [tString])])
        st.allocateSlot('x', blockType)

        parse("x = { y : Option('A) | 7 }").analyze(st, mr)
        parse("x = { q : 'Z | 12 }").analyze(st, mr)

        const failure0 = parse('x = { n : Int | 12 }')
        assert.throws(() => failure0.analyze(st, mr),
          /Types "Block\(Int, Option\(String\)\)" and "Block\(Int, Int\)" do not match/)

        const failure1 = parse('x = { n : Option(Real) | 12 }')
        assert.throws(() => failure1.analyze(st, mr),
          /Types "Block\(Int, Option\(String\)\)" and "Block\(Int, Option\(Real\)\)" do not match/)
      })

      it('derives a type matching the assigned value', function () {
        st.allocateSlot('result', tString)

        const root = parse('result = "boo"').analyze(st, mr)
        assert.strictEqual(root.node.getType(), tString)
      })
    })

    describe('LetNode', function () {
      it('introduces a new binding with an explicit type', function () {
        const root = parse('let b : Int = 0')

        const st0 = st.push(root.node)
        assert.isFalse(st0.has('b'))
        root.analyze(st0, mr)

        assert.strictEqual(root.node.getType(), tInt)
        assert.strictEqual(st0.at('b').getType(), tInt)
      })

      it('introduces a new binding with an inferred type', function () {
        const root = parse('let num = 4.7')

        const st0 = st.push(root.node)
        assert.isFalse(st0.has('num'))
        root.analyze(st0, mr)

        assert.strictEqual(root.node.getType(), tReal)
        assert.strictEqual(st0.at('num').getType(), tReal)
      })

      it('replaces an existing binding', function () {
        const root = parse('let r = 3 ; let r = true')

        const st0 = st.push(root.node)
        root.analyze(st0, mr)
        assert.strictEqual(st0.at('r').getType(), tBool)
      })

      it('ensures that an explict type matches an inferred type', function () {
        const failure = parse('let wat : Int = "no"')
        assert.throws(() => failure.analyze(st, mr), /Types "Int" and "String" do not match/)
      })
    })

    describe('CallNode', function () {
      it('assigns the return type of the discovered method', function () {
        mr.register(tInt, '+', [tInt], tInt, () => {})
        mr.register(tString, 'replace', [tInt, tString, tString], tInt, () => {})

        const root = parse('"boo".replace(3 + 4, "from", "to")').analyze(st, mr)
        assert.strictEqual(root.node.getType(), tInt)
      })
    })
  })

  describe('slot allocation', function () {
    describe('LetNode', function () {
      it('assigns each a unique slot number', function () {
        const root = parse(`
          let x = 1
          let y = "yes"
          let z = true
        `).analyze(st, mr)

        const frame = root.node
        const xNode = frame.getExprs()[0]
        const yNode = frame.getExprs()[1]
        const zNode = frame.getExprs()[2]

        assert.strictEqual(xNode.getFrame(), frame)
        assert.strictEqual(xNode.getSlot(), 0)

        assert.strictEqual(yNode.getFrame(), frame)
        assert.strictEqual(yNode.getSlot(), 1)

        assert.strictEqual(zNode.getFrame(), frame)
        assert.strictEqual(zNode.getSlot(), 2)
      })

      it('assigns distinct slot numbers in different scopes', function () {
        const root = parse(`
          let aa = 12
          {
            let bb = 34
          }
          let cc = 14
        `).analyze(st, mr)

        const rootFrame = root.node
        const aaNode = rootFrame.getExprs()[0]
        const ccNode = rootFrame.getExprs()[2]

        const childFrame = rootFrame.getExprs()[1].getBody()
        const bbNode = childFrame.getExprs()[0]

        assert.strictEqual(aaNode.getFrame(), rootFrame)
        assert.strictEqual(aaNode.getSlot(), 0)

        assert.strictEqual(bbNode.getFrame(), childFrame)
        assert.strictEqual(bbNode.getSlot(), 0)

        assert.strictEqual(ccNode.getFrame(), rootFrame)
        assert.strictEqual(ccNode.getSlot(), 1)
      })
    })

    describe('VarNode', function () {
      it("discovers the identifier's allocated slot and frame", function () {
        const root = parse(`
          {
            let first = 1
            {
              { first }
            }
          }
        `).analyze(st, mr)

        const frame0 = root.node
        const frame1 = frame0.getExprs()[0].getBody()
        const declaration = frame1.getExprs()[0]
        const frame2 = frame1.getExprs()[1].getBody()
        const frame3 = frame2.getExprs()[0].getBody()
        const access = frame3.getExprs()[0]

        assert.strictEqual(declaration.getFrame(), frame1)
        assert.strictEqual(access.getFrame(), frame1)
        assert.strictEqual(declaration.getSlot(), access.getSlot())
      })

      it('adds a capture to containing BlockNodes', function () {
        const root = parse(`
          {
            let first = 1
            {
              { first }
            }
          }
        `).analyze(st, mr)

        const frame0 = root.node
        const block1 = frame0.getExprs()[0]
        const frame1 = block1.getBody()
        const block2 = frame1.getExprs()[1]
        const frame2 = block2.getBody()
        const block3 = frame2.getExprs()[0]

        assert.strictEqual(block1.getCaptures().size, 1)
        assert.isTrue(block1.getCaptures().has(GLOBAL))

        assert.strictEqual(block2.getCaptures().size, 2)
        assert.isFalse(block2.getCaptures().has(frame0))
        assert.isTrue(block2.getCaptures().has(frame1))
        assert.isTrue(block2.getCaptures().has(GLOBAL))

        assert.strictEqual(block3.getCaptures().size, 2)
        assert.isFalse(block3.getCaptures().has(frame0))
        assert.isTrue(block3.getCaptures().has(frame1))
        assert.isTrue(block3.getCaptures().has(GLOBAL))
      })
    })

    describe('AssignNode', function () {
      it("discovers the identifier's allocated slot and frame", function () {
        const root = parse(`
          {
            let first = "yes"
            {
              { first = "no" }
            }
          }
        `).analyze(st, mr)

        const frame1 = root.node.getExprs()[0].getBody()
        const assignNode = frame1.getExprs()[1].getBody().getExprs()[0].getBody().getExprs()[0]

        assert.strictEqual(assignNode.getFrame(), frame1)
        assert.strictEqual(assignNode.getSlot(), 0)
      })

      it('adds a capture to containing BlockNodes', function () {
        const root = parse(`
          {
            let first = "yes"
            {
              { first = "no" }
            }
          }
        `).analyze(st, mr)

        const frame0 = root.node
        const block1 = frame0.getExprs()[0]
        const frame1 = block1.getBody()
        const block2 = frame1.getExprs()[1]
        const frame2 = block2.getBody()
        const block3 = frame2.getExprs()[0]

        assert.strictEqual(block1.getCaptures().size, 1)
        assert.isTrue(block1.getCaptures().has(GLOBAL))

        assert.strictEqual(block2.getCaptures().size, 2)
        assert.isFalse(block2.getCaptures().has(frame0))
        assert.isTrue(block2.getCaptures().has(frame1))
        assert.isTrue(block2.getCaptures().has(GLOBAL))

        assert.strictEqual(block3.getCaptures().size, 2)
        assert.isFalse(block3.getCaptures().has(frame0))
        assert.isTrue(block3.getCaptures().has(frame1))
        assert.isTrue(block3.getCaptures().has(GLOBAL))
      })
    })

    describe('ArgNode', function () {
      it('assigns each a unique slot number', function () {
        const root = parse(`
          { x : Int, y : String |
            let z = 12
            x
          }
        `).analyze(st, mr)

        const blockNode = root.node.getExprs()[0]
        const frame = blockNode.getBody()
        const xArg = blockNode.getArgs()[0]
        const yArg = blockNode.getArgs()[1]
        const zAssign = frame.getExprs()[0]

        assert.strictEqual(xArg.getFrame(), frame)
        assert.strictEqual(xArg.getSlot(), 0)

        assert.strictEqual(yArg.getFrame(), frame)
        assert.strictEqual(yArg.getSlot(), 1)

        assert.strictEqual(zAssign.getFrame(), frame)
        assert.strictEqual(zAssign.getSlot(), 2)
      })
    })
  })

  describe('method lookup', function () {
    const right = () => {}
    const wrong = () => {}

    it('recalls the callback assocated with the discovered method', function () {
      mr.register(tInt, '+', [tInt], tInt, right)
      mr.register(tReal, '+', [tReal], tReal, wrong)

      const root = parse('3 + 4').analyze(st, mr)
      const callNode = root.node.getExprs()[0]

      assert.strictEqual(callNode.getCallback(), right)
    })
  })
})
