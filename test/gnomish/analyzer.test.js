/* eslint-env mocha */

const {assert} = require('chai')
const {parse} = require('./helper')
const {makeType} = require('../../src/gnomish/type')
const {SymbolTable, SlotEntry, StaticEntry} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

describe('Analyzer', function () {
  let st, mr
  let tInt, tReal, tString, tBool, tBlock, tOption, tType

  beforeEach(function () {
    tInt = makeType('Int')
    tReal = makeType('Real')
    tString = makeType('String')
    tBool = makeType('Bool')
    tBlock = makeType('Block')
    tOption = makeType('Option')
    tType = makeType('Type')

    st = new SymbolTable()
    st.put('Int', new StaticEntry(tType, tInt))
    st.put('Real', new StaticEntry(tType, tReal))
    st.put('String', new StaticEntry(tType, tString))
    st.put('Bool', new StaticEntry(tType, tBool))
    st.put('Block', new StaticEntry(tType, tBlock))
    st.put('Option', new StaticEntry(tType, tOption))
    st.put('Type', new StaticEntry(tType, tType))

    st.put('true', new StaticEntry(tBool, true))
    st.put('false', new StaticEntry(tBool, false))

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
      st.put('variable', new SlotEntry(tString, 0))

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

      it('derives a type matching the return type of the action clause', function () {
        const root = parse('while {true} do {4.0}').analyze(st, mr)

        assert.strictEqual(root.node.getType(), tReal)
      })
    })

    describe('AssignNode', function () {
      it('ensures that the binding is already present', function () {
        st.put('x', new SlotEntry(tInt, 0))

        parse('x = 4').analyze(st, mr)

        const failure = parse('y = 7')
        assert.throws(() => failure.analyze(st, mr), /Identifier "y" not found/)
      })

      it("ensures that the binding's type is consistent with the assigned expression", function () {
        const blockType = makeType(tBlock, [tInt, makeType(tOption, [tString])])
        st.put('x', new SlotEntry(blockType, 0))

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
        st.put('result', new SlotEntry(tString, 0))

        const root = parse('result = "boo"').analyze(st, mr)
        assert.strictEqual(root.node.getType(), tString)
      })
    })

    describe('LetNode', function () {
      it('introduces a new binding with an explicit type', function () {
        assert.isFalse(st.has('b'))
        const root = parse('let b : Int = 0').analyze(st, mr)
        assert.strictEqual(root.node.getType(), tInt)
        assert.strictEqual(st.at('b').getType(), tInt)
      })

      it('introduces a new binding with an inferred type', function () {
        assert.isFalse(st.has('num'))
        const root = parse('let num = 4.7').analyze(st, mr)
        assert.strictEqual(root.node.getType(), tReal)
        assert.strictEqual(st.at('num').getType(), tReal)
      })

      it('replaces an existing binding', function () {
        st.put('r', new SlotEntry(tInt, 0))
        parse('let r = true').analyze(st, mr)
        assert.strictEqual(st.at('r').getType(), tBool)
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
})
