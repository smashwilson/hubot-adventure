/* eslint-env mocha */

const fs = require('fs')
const path = require('path')
const chai = require('chai')

const { World } = require('../../src/model/world')
const assert = require('../lib/assertion')

const world = new World()
assert.register(world.getSymbolTable(), world.getMethodRegistry())

describe('Gnomish domain model', function () {
  function executeTestFile (testPath) {
    const testSource = fs.readFileSync(testPath, { encoding: 'utf8' })
    const normalized = testSource.replace(/\r\n/g, '\n')
    try {
      world.execute(normalized)
    } catch (e) {
      it(`cannot parse ${testPath}`, function () {
        chai.assert.fail(null, null, e.message)
      })
    }
  }

  const testDir = path.join(__dirname, 'gnomish')
  const testFiles = fs.readdirSync(testDir).filter(each => each.endsWith('.gn'))

  for (const testFile of testFiles) {
    describe(testFile, function () {
      executeTestFile(path.join(testDir, testFile))
    })
  }
})
