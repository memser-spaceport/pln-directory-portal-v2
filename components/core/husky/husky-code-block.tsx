import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { a11yDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyText from '../copy-text';

function HuskyCodeBlock(props: any) {
  const languages = new Set([
    'abap',
    'abnf',
    'actionscript',
    'ada',
    'agda',
    'al',
    'antlr4',
    'apacheconf',
    'apex',
    'apl',
    'applescript',
    'aql',
    'arduino',
    'arff',
    'asciidoc',
    'asm6502',
    'asmatmel',
    'aspnet',
    'autohotkey',
    'autoit',
    'avisynth',
    'avroIdl',
    'bash',
    'basic',
    'batch',
    'bbcode',
    'bicep',
    'birb',
    'bison',
    'bnf',
    'brainfuck',
    'brightscript',
    'bro',
    'bsl',
    'c',
    'cfscript',
    'chaiscript',
    'cil',
    'clike',
    'clojure',
    'cmake',
    'cobol',
    'coffeescript',
    'concurnas',
    'coq',
    'cpp',
    'crystal',
    'csharp',
    'cshtml',
    'csp',
    'cssExtras',
    'css',
    'csv',
    'cypher',
    'd',
    'dart',
    'dataweave',
    'dax',
    'dhall',
    'diff',
    'django',
    'dnsZoneFile',
    'docker',
    'dot',
    'ebnf',
    'editorconfig',
    'eiffel',
    'ejs',
    'elixir',
    'elm',
    'erb',
    'erlang',
    'etlua',
    'excelFormula',
    'factor',
    'falselang',
    'firestoreSecurityRules',
    'flow',
    'fortran',
    'fsharp',
    'ftl',
    'gap',
    'gcode',
    'gdscript',
    'gedcom',
    'gherkin',
    'git',
    'glsl',
    'gml',
    'gn',
    'goModule',
    'go',
    'graphql',
    'groovy',
    'haml',
    'handlebars',
    'haskell',
    'haxe',
    'hcl',
    'hlsl',
    'hoon',
    'hpkp',
    'hsts',
    'http',
    'ichigojam',
    'icon',
    'icuMessageFormat',
    'idris',
    'iecst',
    'ignore',
    'inform7',
    'ini',
    'io',
    'j',
    'java',
    'javadoc',
    'javadoclike',
    'javascript',
    'javastacktrace',
    'jexl',
    'jolie',
    'jq',
    'jsExtras',
    'jsTemplates',
    'jsdoc',
    'json',
    'json5',
    'jsonp',
    'jsstacktrace',
    'jsx',
    'julia',
    'keepalived',
    'keyman',
    'kotlin',
    'kumir',
    'kusto',
    'latex',
    'latte',
    'less',
    'lilypond',
    'liquid',
    'lisp',
    'livescript',
    'llvm',
    'log',
    'lolcode',
    'lua',
    'magma',
    'makefile',
    'markdown',
    'markupTemplating',
    'markup',
    'matlab',
    'maxscript',
    'mel',
    'mermaid',
    'mizar',
    'mongodb',
    'monkey',
    'moonscript',
    'n1ql',
    'n4js',
    'nand2tetrisHdl',
    'naniscript',
    'nasm',
    'neon',
    'nevod',
    'nginx',
    'nim',
    'nix',
    'nsis',
    'objectivec',
    'ocaml',
    'opencl',
    'openqasm',
    'oz',
    'parigp',
    'parser',
    'pascal',
    'pascaligo',
    'pcaxis',
    'peoplecode',
    'perl',
    'phpExtras',
    'php',
    'phpdoc',
    'plsql',
    'powerquery',
    'powershell',
    'processing',
    'prolog',
    'promql',
    'properties',
    'protobuf',
    'psl',
    'pug',
    'puppet',
    'pure',
    'purebasic',
    'purescript',
    'python',
    'q',
    'qml',
    'qore',
    'qsharp',
    'r',
    'racket',
    'reason',
    'regex',
    'rego',
    'renpy',
    'rest',
    'rip',
    'roboconf',
    'robotframework',
    'ruby',
    'rust',
    'sas',
    'sass',
    'scala',
    'scheme',
    'scss',
    'shellSession',
    'smali',
    'smalltalk',
    'smarty',
    'sml',
    'solidity',
    'solutionFile',
    'soy',
    'sparql',
    'splunkSpl',
    'sqf',
    'sql',
    'squirrel',
    'stan',
    'stylus',
    'swift',
    'systemd',
    't4Cs',
    't4Templating',
    't4Vb',
    'tap',
    'tcl',
    'textile',
    'toml',
    'tremor',
    'tsx',
    'tt2',
    'turtle',
    'twig',
    'typescript',
    'typoscript',
    'unrealscript',
    'uorazor',
    'uri',
    'v',
    'vala',
    'vbnet',
    'velocity',
    'verilog',
    'vhdl',
    'vim',
    'visualBasic',
    'warpscript',
    'wasm',
    'webIdl',
    'wiki',
    'wolfram',
    'wren',
    'xeora',
    'xmlDoc',
    'xojo',
    'xquery',
    'yaml',
    'yang',
    'zig',
  ]);

  let codeText = props.children.trim();
  let language = 'bash';

  const firstLineEndIndex = codeText.indexOf('\n');
  if (firstLineEndIndex !== -1) {
    const firstWord = codeText.substring(0, firstLineEndIndex).trim();
    if (languages.has(firstWord)) {
      language = firstWord;
      codeText = codeText.substring(firstLineEndIndex + 1).trim();
    }
  }

  return (
    <>
      <div className="codeBlock">
        <div className="codeBlock__header">
          <p>{language}</p>
          <CopyText textToCopy={codeText}>
            <span className="codeBlock__header__copy">
              <img alt="Copy Code" className="codeBlock__header__copy__icon" src="/icons/copy-grey.svg" /> Copy Code
            </span>
          </CopyText>
        </div>
        <SyntaxHighlighter customStyle={{borderTopLeftRadius: 0, borderTopRightRadius: 0}} lineProps={{style: {wordBreak: 'break-all', whiteSpace: 'pre-wrap'}}}
wrapLines={true}  language={language} style={a11yDark}>
              {codeText}
          </SyntaxHighlighter>
      </div>
      <style jsx>
        {`
          .codeBlock {
            max-width: 100%;
            margin: 8px 0;
          }
          .codeBlock__header {
            display: flex;
            justify-content: space-between;
            background: #444444;
            color: grey;
            border-top-left-radius: 8px;
            border-top-right-radius: 8px;
            margin-bottom: -8px;
            font-size: 12px;
            padding: 6px 16px;
          }
          .codeBlock__header__copy {
            display: flex;
            align-items: center;
            gap: 6px;
            cursor: pointer;
            max-width: 100%;
            font-size: 10px;
            font-weight: 400;
            color: #B4B4B4;
           
          }
            .codeBlock__header__copy__icon {
             width: 13px;
             height: 13px;
            }
          .codeBlock__content {
          }
        `}
      </style>
    </>
  );
}

export default HuskyCodeBlock