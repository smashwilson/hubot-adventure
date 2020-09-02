/* eslint-env mocha */

const { assert } = require('chai')
const { parse, deserialize } = require('../../src/gnomish')

describe('serialize and deserialize', function () {
  it('serializes an AST as JSON', function () {
    const program0 = parse(`
      {
        10
        "block"
      }

      if {true} then {3} else {4}
      if {false} then {1.2}

      while {true} do {"nothing"}

      let x = 1
      let n: Option(String) = some("x")

      letgame y = 2
      letgame m: List(Bool) = list(false, true)

      x = 3

      3 + 4

      list(1, 2, 3).map({ each: Int | each + 1 })
    `)

    const sexpBefore = program0.sexp()

    const payload = program0.serialize()

    const program1 = deserialize(payload)
    const sexpAfter = program1.sexp()

    assert.strictEqual(sexpBefore, sexpAfter)
    assert.deepEqual(program0, program1)
  })
})
