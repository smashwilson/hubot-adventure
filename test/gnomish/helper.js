const {assert} = require('chai')
const Tracer = require('pegjs-backtrace')

const {parse} = require('../../src/gnomish')

function tracedParse (text, shouldParse = true) {
  const tracer = new Tracer(text, {
    showTrace: process.env.GNOMISH_TRACE === 'on'
  })
  try {
    const root = parse(text, {tracer})
    if (!shouldParse) {
      assert.fail(null, null, `Should not parse ${text}`)
    }
    return root
  } catch (e) {
    if (shouldParse) {
      console.error(tracer.getBacktraceString())
      assert.fail(null, null, `Unable to parse expression: ${e.message}`)
    }
    return null
  }
}

function assertSexp (text, expected, shouldParse = true) {
  const root = tracedParse(text, shouldParse)
  if (!root && !shouldParse) return

  const actual = root.sexp()
  const normalize = str => str.trim().replace(/\s+/g, ' ')
  assert.equal(normalize(actual), normalize(expected))
}

module.exports = {parse: tracedParse, assertSexp}
