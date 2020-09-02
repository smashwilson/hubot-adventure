/* eslint-env mocha */

const { assert } = require('chai')

const { error, formatError } = require('../src/errors')

describe('errors', function () {
  describe('error construction', function () {
    it('constructs and raises a Error', function () {
      assert.throws(() => error('message').raise(), 'message')
    })

    it('may provide a separate user-visible message', function () {
      let caught = false

      try {
        error('developer message').withUserMessage('user message').raise()
      } catch (e) {
        assert.strictEqual(e.message, 'developer message')
        assert.strictEqual(e.userMessage, 'user message')
        caught = true
      }

      assert.isTrue(caught)
    })

    it('appends helpful user data', function () {
      let caught = false

      try {
        error('message').withData('k0', 'v0').withData('k1', 'v1').raise()
      } catch (e) {
        assert.strictEqual(e.message, 'message')
        assert.strictEqual(e.data.get('k0'), 'v0')
        assert.strictEqual(e.data.get('k1'), 'v1')
        caught = true
      }

      assert.isTrue(caught)
    })
  })

  describe('error report formatting', function () {
    it('also formats ordinary errors', function () {
      let formatted = ''
      try {
        throw new Error('message')
      } catch (e) {
        formatted = formatError(e)
      }

      assert.include(formatted, 'Error: message')
      assert.include(formatted, 'errors.test.js')
    })

    it('uses the user-visible messaging', function () {
      let formatted = ''
      try {
        error('dev message').withUserMessage('user message').raise()
      } catch (e) {
        formatted = formatError(e)
      }

      assert.include(formatted, 'user message')
      assert.notInclude(formatted, 'dev message')
      assert.notInclude(formatted, 'errors.test.js')
    })

    it('includes any provided user data', function () {
      let formatted = ''
      try {
        error('dev message')
          .withData('k0', 'v0')
          .withData('k1', 'v1')
          .raise()
      } catch (e) {
        formatted = formatError(e)
      }

      assert.include(formatted, 'k0: v0')
      assert.include(formatted, 'k1: v1')
    })
  })
})
