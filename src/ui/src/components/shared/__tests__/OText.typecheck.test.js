const path = require('node:path')
const ts = require('typescript')

// Compile real JSX rather than mocking OText's public props.
it('accepts native testID strings without accepting numeric identifiers', () => {
  const root = path.resolve(__dirname, '../../../../../..')
  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
  const fixture = path.join(__dirname, 'fixtures/OText-props.tsx')
  const program = ts.createProgram([...config.fileNames, fixture], config.options)
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.file?.fileName === fixture || diagnostic.file?.fileName === path.join(root, 'src/ui/src/components/shared/OText.tsx'))
  expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
})
