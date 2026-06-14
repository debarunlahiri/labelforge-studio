import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const mainJs = path.join(__dirname, '..', 'dist-electron', 'main.js')

if (!fs.existsSync(mainJs)) {
  console.error('dist-electron/main.js not found. Run vite build first.')
  process.exit(1)
}

let code = fs.readFileSync(mainJs, 'utf-8')

if (code.includes('__dirname_polyfill__')) {
  console.log('__dirname polyfill already injected, skipping.')
  process.exit(0)
}

const polyfill = `var __dirname_polyfill__ = 1;
var __dirname, __filename;
if (typeof __dirname === 'undefined') {
  try {
    var _url = new URL('.', import.meta.url);
    __dirname = decodeURIComponent(_url.pathname);
    if (__dirname.endsWith('/')) __dirname = __dirname.slice(0, -1);
    __filename = decodeURIComponent(new URL(import.meta.url).pathname);
    globalThis.__dirname = __dirname;
    globalThis.__filename = __filename;
  } catch(e) {
    __dirname = process.cwd();
    __filename = '';
    globalThis.__dirname = __dirname;
    globalThis.__filename = __filename;
  }
}
`

code = polyfill + code
fs.writeFileSync(mainJs, code)
console.log('Injected __dirname polyfill into dist-electron/main.js')