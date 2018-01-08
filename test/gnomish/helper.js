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
  }
}

function assertSexp (text, expected, shouldParse = true) {
  const actual = tracedParse(text, shouldParse)
  const normalize = str => str.trim().replace(/\s+/g, ' ')
  assert.equal(normalize(actual), normalize(expected))
}

module.exports = {parse: tracedParse, assertSexp}
