// Мини-подсветка синтаксиса в палитре макета (Material Palenight)
export const SYNTAX = {
  kw: '#C792EA',
  fn: '#82AAFF',
  tx: '#E9E6F2',
  nu: '#F78C6C',
  pu: '#89DDFF',
  pr: '#FFCB6B',
  st: '#C3E88D',
  cm: '#6F6A7E',
}

export type Seg = { c: string; t: string }

const KW: Record<string, Set<string>> = {
  js: new Set('function let const var for of in if else return await async new class import from export while true false null undefined this'.split(' ')),
  py: new Set('def return for in if elif else while import from as async await class True False None and or not with lambda pass'.split(' ')),
}

function code(line: string, lang: 'js' | 'py'): Seg[] {
  const out: Seg[] = []
  const re = /(\/\/.*|#.*)|(`[^`]*`|"[^"]*"|'[^']*')|(\d+(?:\.\d+)?)|([A-Za-z_$][\w$]*)|(\s+)|([^\w\s])/g
  let m: RegExpExecArray | null
  let prev = ''
  while ((m = re.exec(line))) {
    const [t, cm, st, nu, id, ws] = m
    let c = SYNTAX.pu
    if (cm && (lang === 'py' ? t.startsWith('#') : t.startsWith('//'))) c = SYNTAX.cm
    else if (st) c = SYNTAX.st
    else if (nu) c = SYNTAX.nu
    else if (id) {
      const after = line.slice(re.lastIndex)
      if (KW[lang].has(id)) c = SYNTAX.kw
      else if (/^\s*\(/.test(after)) c = SYNTAX.fn
      else if (prev === '.') c = SYNTAX.pr
      else c = SYNTAX.tx
    } else if (ws) c = SYNTAX.tx
    out.push({ c, t })
    if (!ws) prev = t
  }
  return out
}

function html(line: string): Seg[] {
  const out: Seg[] = []
  const re = /(<\/?[\w-]+)|(\s[\w-]+)(?==)|("[^"]*")|(\/?>)|([^<>"]+?(?=<|$|\s[\w-]+=|"|\/?>))|(.)/g
  let m: RegExpExecArray | null
  while ((m = re.exec(line))) {
    const [t, tag, attr, str, close] = m
    out.push({ c: tag || close ? SYNTAX.kw : attr ? SYNTAX.pr : str ? SYNTAX.st : SYNTAX.tx, t })
  }
  return out
}

export function highlight(line: string, lang: 'js' | 'py' | 'html' | 'text'): Seg[] {
  if (lang === 'text') return [{ c: SYNTAX.tx, t: line }]
  if (lang === 'html') return html(line)
  return code(line, lang)
}
