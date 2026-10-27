const path = require('node:path')
const ts = require('typescript')

it('keeps the swiper list ref compatible with React nullable ref objects', () => {
  const root = path.resolve(__dirname, '../../..')
  const configFile = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile)
  const config = ts.parseJsonConfigFileContent(configFile.config, ts.sys, root)
  const program = ts.createProgram([path.join(root, 'jest/fixtures/swiper-flatlist-types.tsx')], config.options)
  const diagnostics = ts.getPreEmitDiagnostics(program).filter(diagnostic => diagnostic.file?.fileName.includes('/react-native-swiper-flatlist/src/'))
  expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
})
