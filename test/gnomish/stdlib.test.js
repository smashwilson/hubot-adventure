/* eslint-env mocha */

const fs = require('fs-extra')
const path = require('path')
const assert = require('./lib/assertion')
const {parse} = require('./helper')
const stdlib = require('../../src/gnomish/stdlib')
const {SymbolTable} = require('../../src/gnomish/symboltable')
const {MethodRegistry} = require('../../src/gnomish/methodregistry')

const symbolTable = new SymbolTable(Symbol('global'))
const methodRegistry = new MethodRegistry()
stdlib.register(symbolTable, methodRegistry)
assert.register(symbolTable, methodRegistry)

describe('Gnomish standard library', function () {
  async function executeTestFile (testPath) {
    const testSource = await fs.readFile(testPath, {encoding: 'utf8'})
    const normalized = testSource.replace(/\r\n/g, '\n')
    parse(normalized).analyze(symbolTable, methodRegistry).interpret()
  }

  const testDir = path.join(__dirname, 'stdlib')
  const testFiles = fs.readdirSync(testDir).filter(each => each.endsWith('.gn'))

  for (const testFile of testFiles) {
    it(`${testFile} passes`, async function () {
      await executeTestFile(path.join(testDir, testFile))
    })
  }
})
