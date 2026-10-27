const path = require('node:path')
const ts = require('typescript')

it('types picker icons as rendered components instead of React elements', () => {
  const root = path.resolve(__dirname, '../../..')
  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
  const fixture = path.join(root, 'jest/fixtures/picker-select-types.tsx')
  const program = ts.createProgram([fixture], config.options)
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.file?.fileName === fixture)
  expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
})
