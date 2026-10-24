/** Exercise the actual plugin iframe: DSH owns its supported locale parameter. */
import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'

const source = fs.readFileSync(new URL('../client.js', import.meta.url), 'utf8')
  .replace('exports.__test = {', 'exports.__test = { ModelWorkspace,')
let registration, cursor = 0
const document = { documentElement: { lang: 'zh-CN' } }
const window = { __ModuleLoader__: { load(value) { registration = value } } }
const react = {
  createElement: (type, props, ...children) => ({ type, props, children }), Fragment: 'fragment',
  useState(initial) { return [cursor++ === 0 ? 'ready' : typeof initial === 'function' ? initial() : initial, () => {}] },
  useEffect() {}, useRef: () => ({ current: null }), useMemo: fn => fn(), useCallback: fn => fn,
}
vm.runInNewContext(source, { window, document, URL })
const { ModelWorkspace } = registration.factory(name => name === 'react' ? react : {}).__test
function findFrame(node) {
  if (node?.type === 'iframe') return node
  for (const child of node?.children?.flat(Infinity) ?? []) {
    const frame = findFrame(child)
    if (frame) return frame
  }
}
function frameFor(locale) {
  cursor = 0
  const t = Object.assign(key => key, { locale })
  return findFrame(ModelWorkspace({ t, summary: {} }))
}

for (const [tag, expected] of [
  ['zh', 'zh'], ['zh-CN', 'zh'], ['zh-Hans-CN', 'zh'], ['zh_TW', 'zh-TW'],
  ['zh-Hant-HK', 'zh-TW'], ['zh-HK', 'zh-TW'], ['zh-MO', 'zh-TW'],
  ['en-US', 'en'], ['en-GB', 'en'], ['ja-JP', 'ja'], ['de-DE', 'de'],
  ['fr-FR', 'en'], ['zh<script>', 'en'], ['en&view=settings', 'en'],
]) {
  const frame = frameFor(tag)
  const url = new URL(frame.props.src, 'http://localhost')
  assert.equal(url.pathname, '/api/our-free-model/engine/ui/')
  assert.equal(url.searchParams.get('mode'), 'window')
  assert.equal(url.searchParams.get('view'), 'providers')
  assert.equal(url.searchParams.get('locale'), expected, tag)
  assert.equal([...url.searchParams].length, 3)
}
assert.equal(new URL(frameFor('en').props.src, 'http://localhost').searchParams.get('locale'), 'en',
  'DSH locale overrides a Chinese document/system language')
assert.equal(new URL(frameFor(undefined).props.src, 'http://localhost').searchParams.get('locale'), 'zh',
  'missing service locale falls back to the DSH document language')
document.documentElement.lang = ''
assert.equal(new URL(frameFor(undefined).props.src, 'http://localhost').searchParams.get('locale'), 'en')
const chinese = frameFor('zh-CN'), english = frameFor('en-US')
assert.equal(chinese.type, english.type)
assert.notEqual(chinese.props.src, english.props.src, 'a DSH language switch navigates the existing iframe')
assert.equal(frameFor('zh-CN').props.src, chinese.props.src, 'remounts retain the host language')
console.log('workspace-language: supported tags, host priority, fallback, language switching and remount passed')
