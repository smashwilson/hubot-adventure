const {assert} = require('chai')
const Tracer = require('pegjs-backtrace')

const {parse} = require('../../src/gnomish')

function assertSexp (text, expected, shouldParse = true) {
  const tracer = new Tracer(text, {
    showTrace: process.env.GNOMISH_TRACE === 'on'
  })
  let actual = ''
  try {
    actual = parse(text, {tracer}).sexp()
    if (!shouldParse) {
      assert.fail(null, null, `Should not parse ${text}`)
    }
  } catch (e) {
    if (shouldParse) {
      console.error(tracer.getBacktraceString())
      assert.fail(null, null, `Unable to parse expression: ${e.message}`)
    }
  }

  const normalize = str => str.trim().replace(/\s+/g, ' ')
  assert.equal(normalize(actual), normalize(expected))
}

module.exports = {assertSexp}
