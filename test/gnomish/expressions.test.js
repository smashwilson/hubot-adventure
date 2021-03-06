/* eslint-env mocha */

const { assertSexp } = require('./helper')

describe('Gnomish expressions', function () {
  describe('anomalies', function () {
    // This is a place to accumulate any parsing oddities that we notice organically.
    it('parses a quadratic equation', function () {
      assertSexp('let y = 4*x^2 + 2*x - 7', `
        (exprlist
          (let y : <inferred> =
            (call
              (call
                (call (4) * (call (var x) ^ (2)))
                +
                (call (2) * (var x)))
              -
              (7))))
      `)
    })

    it('parses parentheticals', function () {
      assertSexp('x + (10 - 4)', `
        (exprlist
          (call (var x) + (call (10) - (4))))
      `)
    })

    it('parses chained << calls', function () {
      assertSexp('acc << each << each + 10', `
        (exprlist
          (call
            (call
              (var acc) <<
              (var each))
            <<
            (call (var each) + (10))))
      `)
    })
  })

  describe('if', function () {
    it('parses an if expression with only a then clause', function () {
      assertSexp('if {true} then {42}', `
        (exprlist
          (if
            (block (exprlist (var true)))
            (block (exprlist (42)))))
      `)
    })

    it('parses an if expression with an else clause', function () {
      assertSexp('if {false} then {12} else {42}', `
        (exprlist
          (if
            (block (exprlist (var false)))
            (block (exprlist (12)))
            (block (exprlist (42)))))
      `)
    })
  })

  describe('while', function () {
    it('parses a while loop', function () {
      assertSexp('while {true} do {something}', `
        (exprlist
          (while
            (block (exprlist (var true)))
            (block (exprlist (var something)))))
      `)
    })
  })

  describe('let', function () {
    it('parses a let expression', function () {
      assertSexp('let x: Int = 42', `
        (exprlist
          (let x : (type Int) = (42)))
      `)
    })

    it('parses a let expression with an inferred type', function () {
      assertSexp('let x = 37', `
        (exprlist
          (let x : <inferred> = (37)))
      `)
    })
  })

  describe('letgame', function () {
    it('parses a letgame expression', function () {
      assertSexp('letgame x: Int = 42', `
        (exprlist
          (letgame x : (type Int) = (42)))
      `)
    })

    it('parses a letgame expression with an inferred type', function () {
      assertSexp('letgame x = 37', `
        (exprlist
          (letgame x : <inferred> = (37)))
      `)
    })
  })

  describe('assignment', function () {
    it('parses assignments to variables', function () {
      assertSexp('foo = 3', `
        (exprlist
          (assign foo (3)))
      `)
    })

    it('is right-associative', function () {
      assertSexp('foo = bar = 42', `
        (exprlist
          (assign foo (assign bar (42))))
      `)
    })

    it('plays well with if, while, and let expressions', function () {
      assertSexp('x = if {true} then {1} else {2}', `
        (exprlist
          (assign x
            (if
              (block (exprlist (var true)))
              (block (exprlist (1)))
              (block (exprlist (2))))))
      `)
      assertSexp('y = while {q = false} do {3}', `
        (exprlist
          (assign y
            (while
              (block (exprlist (assign q (var false))))
              (block (exprlist (3))))))
      `)
      assertSexp('z = let q = let n = 400', `
        (exprlist
          (assign z
            (let q : <inferred> =
              (let n : <inferred> = (400)))))
      `)
    })
  })

  describe('comparison operators', function () {
    it('parses comparison operator application', function () {
      assertSexp('a == b', `
        (exprlist
          (call (var a) == (var b)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('a != b < c', `
        (exprlist
          (call (call (var a) != (var b)) < (var c)))
      `)
    })
  })

  describe('logical or', function () {
    it('parses logical or application', function () {
      assertSexp('true || false', `
        (exprlist
          (call (var true) || (var false)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('a || b || c', `
        (exprlist
          (call
            (call (var a) || (var b)) ||
            (var c)))
      `)
    })

    it('has higher precedence than comparison operators', function () {
      assertSexp('x || y == true', `
        (exprlist
          (call
            (call (var x) || (var y)) ==
            (var true)))
      `)
    })
  })

  describe('logical and', function () {
    it('parses logical and application', function () {
      assertSexp('a && b', `
        (exprlist
          (call (var a) && (var b)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('a && b && c', `
        (exprlist
          (call
            (call (var a) && (var b)) &&
            (var c)))
      `)
    })

    it('has higher precedence than logical or', function () {
      assertSexp('a && b || c', `
        (exprlist
          (call
            (call (var a) && (var b)) ||
            (var c)))
      `)
    })
  })

  describe('additive operators', function () {
    it('parses additive operators', function () {
      assertSexp('3 + 4', `
        (exprlist
          (call (3) + (4)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('12 + 14 - 2', `
        (exprlist
          (call (call (12) + (14)) - (2)))
      `)
    })

    it('has higher precedence than logical and', function () {
      assertSexp('10 + 20 && 30 ++ 40', `
        (exprlist
          (call
            (call (10) + (20)) &&
            (call (30) ++ (40))))
      `)
    })
  })

  describe('multiplicative operators', function () {
    it('parses multiplicative operator application', function () {
      assertSexp('6 * 4', `
        (exprlist
          (call (6) * (4)))
      `)
    })

    it('is left-associative', function () {
      assertSexp('3 * 4 // 2', `
        (exprlist
          (call
            (call (3) * (4)) //
            (2)))
      `)
    })

    it('has higher precedence than additive operators', function () {
      assertSexp('1 + 2 * 3', `
        (exprlist
          (call
            (1) +
            (call (2) * (3))))
      `)
    })
  })

  describe('exponentiation', function () {
    it('parses exponentiation operators', function () {
      assertSexp('2 ^ 5', `
        (exprlist
          (call (2) ^ (5)))
      `)
    })

    it('is right-associative', function () {
      assertSexp('2 ^ 3 ^ 4', `
        (exprlist
          (call (2) ^ (call (3) ^ (4))))
      `)
    })

    it('has higher precedence than multiplicative operators', function () {
      assertSexp('x ^ 2 * 4', `
        (exprlist
          (call (call (var x) ^ (2)) * (4)))
      `)
    })
  })

  describe('unary not', function () {
    it('parses a unary not operator', function () {
      assertSexp('!true', `
        (exprlist
          (call (var true) !))
      `)
    })

    it('is nestable', function () {
      assertSexp('!!false', `
        (exprlist
          (call (call (var false) !) !))
      `)
    })

    it('has higher precedence than exponentiation', function () {
      assertSexp('! 2 ^ 3', `
        (exprlist
          (call (call (2) !) ^ (3)))
      `)
    })
  })

  describe('method calls', function () {
    it('parses a method call with an explicit receiver', function () {
      assertSexp('receiver.methodname(3, "x", true)', `
        (exprlist
          (call (var receiver) methodname (3) ("x") (var true)))
      `)
    })

    it('parses a method call with no arguments', function () {
      assertSexp('receiver.methodname()', `
        (exprlist
          (call (var receiver) methodname))
      `)
    })

    it('can be chained together', function () {
      assertSexp('r.methodOne(3, 4).methodTwo("yes")', `
        (exprlist
          (call
            (call (var r) methodOne (3) (4))
            methodTwo
            ("yes")))
      `)
    })

    it('parses a method call with an implicit receiver', function () {
      assertSexp('methodname(3, 4)', `
        (exprlist
          (call (var this) methodname (3) (4)))
      `)
    })

    it('chains after implicit calls', function () {
      assertSexp('methodname(3).other(7)', `
        (exprlist
          (call
            (call (var this) methodname (3))
            other (7)))
      `)
    })

    it('binds tighter than unary not', function () {
      assertSexp('!r.somecall()', `
        (exprlist
          (call (call (var r) somecall) !))
      `)
    })
  })

  describe('comments', function () {
    it('parses comments from # to the end of the line', function () {
      assertSexp(`
        # This is a line comment
        3 + 4
      `, `
        (exprlist
          (call (3) + (4)))
      `)
    })

    it('ignores # within string literals', function () {
      assertSexp('"this # is still a string"', `
        (exprlist
          ("this # is still a string"))
      `)
    })

    it('allows comments to occur after an expression', function () {
      assertSexp(`
        3 + 4  # this works too
        7 / 2
      `, `
        (exprlist
          (call (3) + (4))
          (call (7) / (2)))
      `)
    })
  })
})
