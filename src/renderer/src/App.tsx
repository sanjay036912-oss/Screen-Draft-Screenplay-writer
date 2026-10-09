import { useEffect, useRef, useState, CSSProperties } from 'react';
import { Doc, Beat, Character, ElType, ScriptElement } from './types';
import { LONG, fromFountain, DEFAULTS, FONTS, Settings, COLORS, LABEL, ORDER, charNames, cleanName, emptyDoc, newChar, newEl, nextType, normalize, pageCount, toFountain, toWord } from './lib';

type Tab = 'write' | 'timeline' | 'characters';
const file = (d: Doc, ext: string) => `${d.title.replace(/[^\w ]+/g, '').trim() || 'screenplay'}.${ext}`;

export default function App() {
  const [doc, setDoc] = useState<Doc>(emptyDoc);
  const [tab, setTab] = useState<Tab>('write');
  const [msg, setMsg] = useState('');
  const [show, setShow] = useState(false);
  const [s, setS] = useState<Settings>(() => { try { return { ...DEFAULTS, ...JSON.parse(localStorage.getItem('sd-settings') || '{}') }; } catch { return DEFAULTS; } });
  useEffect(() => { try { localStorage.setItem('sd-settings', JSON.stringify(s)); } catch {} }, [s]);
  useEffect(() => {
    if (!show) return;
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') setShow(false); };
    const click = (e: MouseEvent) => { const t = e.target as HTMLElement; if (!t.closest('.panel') && !t.closest('.style-btn')) setShow(false); };
    document.addEventListener('keydown', key); document.addEventListener('mousedown', click);
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', click); };
  }, [show]);
  const vref = useRef<HTMLVideoElement>(null);
  const live = s.wall.startsWith('video:') ? s.wall.slice(6) : '';
  const liveUrl = live ? `sd-media://video/${encodeURIComponent(live)}` : '';
  useEffect(() => { const v = vref.current; if (v) { if (s.paused) v.pause(); else v.play().catch(() => {}); } }, [s.paused, liveUrl]);
  const wall = live || s.wall === 'none' ? 'none' : s.wall === 'default' ? 'url("./wallpaper.jpg")' : `url("${s.wall}")`;
  const toast = (m: string) => { setMsg(m); setTimeout(() => setMsg(''), 2500); };
  const upd = (p: Partial<Doc>) => setDoc(d => ({ ...d, ...p }));

  const save = async () => { const p = await window.api.save({ name: file(doc, 'screendraft'), ext: 'screendraft', label: 'ScreenDraft', data: JSON.stringify(doc), isText: true }); if (p) toast('Saved ✓'); };
  const open = async () => { const t = await window.api.open(); if (t) { setDoc({ ...emptyDoc(), ...JSON.parse(t) }); toast('Opened ✓'); } };
  const importF = async () => {
    const t = await window.api.open({ name: 'Fountain / Text', exts: ['fountain', 'txt', 'spmd'] });
    if (!t) return;
    const p = fromFountain(t);
    if (!p.elements.length) return toast('Nothing found in that file');
    const add = doc.elements.some(e => e.text.trim()) && confirm('Add the imported script to the END of your current one?\n\nOK = add to end\nCancel = replace current script');
    setDoc(add ? { ...doc, elements: [...doc.elements, ...p.elements] } : { ...doc, title: p.title || doc.title, author: p.author || doc.author, elements: p.elements, beats: {} });
    toast(`Imported ${p.elements.length} elements ✓`);
  };
  const print = () => window.api.print();
  const pdf = async () => { const p = await window.api.pdf(file(doc, 'pdf')); if (p) toast('PDF saved ✓'); };
  const word = async () => { const p = await window.api.save({ name: file(doc, 'docx'), ext: 'docx', label: 'Word Document', data: await toWord(doc, s) }); if (p) toast('Word file exported ✓'); };
  const fountain = async () => { const p = await window.api.save({ name: file(doc, 'fountain'), ext: 'fountain', label: 'Fountain', data: toFountain(doc), isText: true }); if (p) toast('Fountain exported ✓'); };

  return (
    <>
    <div className="app" style={{ '--font': s.font, '--size': s.size + 'pt', '--paper': s.paper, '--ink': s.ink, '--pw': s.width + 'in', '--dim': s.dim, '--wall': wall } as CSSProperties}>
      {liveUrl && (/\.gif$/i.test(live)
        ? <img className="bgvid" src={liveUrl} alt="" onError={() => setS(x => ({ ...x, wall: 'default' }))} />
        : <video ref={vref} className="bgvid" src={liveUrl} autoPlay loop muted playsInline onError={() => setS(x => ({ ...x, wall: 'default' }))} />)}
      {liveUrl && <div className="dimmer" />}
      <header>
        <div className="logo"><img src="./logo.png" alt="" /><span>Screen<b>draft</b></span></div>
        <input className="title" value={doc.title} onChange={e => upd({ title: e.target.value })} />
        <input className="author" placeholder="Author" value={doc.author} onChange={e => upd({ author: e.target.value })} />
        <nav>
          {(['write', 'timeline', 'characters'] as Tab[]).map(t => (
            <button key={t} className={(tab === t ? 'on ' : '') + 't-' + t} onClick={() => setTab(t)}>{{ write: '✍️ Write', timeline: '🧭 Timeline', characters: '🎭 Characters' }[t]}</button>
          ))}
        </nav>
        <div className="actions">
          <button className="style-btn" onClick={() => setShow(v => !v)}>⚙️ Style</button><button onClick={open}>Open</button><button onClick={importF}>📥 Import</button><button onClick={save}>Save</button>
          <button onClick={print}>🖨️ Print</button><button className="hot" onClick={pdf}>⬇️ PDF</button><button className="hot" onClick={word}>📄 Word</button><button onClick={fountain}>Fountain</button>
        </div>
      </header>
      {show && <Panel s={s} set={setS} onClose={() => setShow(false)} />}
      <main className={'sec-' + tab}>
        {tab === 'write' && <Editor doc={doc} upd={upd} numbers={s.numbers} />}
        {tab === 'timeline' && <Timeline doc={doc} upd={upd} />}
        {tab === 'characters' && <Characters doc={doc} upd={upd} />}
      </main>
      <footer>{doc.elements.length} elements · ~{pageCount(doc.elements)} pages · {charNames(doc).length} characters</footer>
      {msg && <div className="toast">{msg}</div>}
    </div>
    <PrintView doc={doc} s={s} />
    </>
  );
}

const TIMES = ['DAY', 'NIGHT', 'MORNING', 'AFTERNOON', 'EVENING', 'DAWN', 'DUSK', 'CONTINUOUS', 'LATER', 'MOMENTS LATER'];
const PREFIX = ['INT.', 'EXT.', 'INT./EXT.', 'I/E.'];
const sugFor = (e: ScriptElement, names: string[]): string[] => {
  const t = e.text.toUpperCase();
  if (e.type === 'character') return t ? names.filter(n => n.startsWith(t) && n !== t) : [];
  if (e.type === 'scene_heading') {
    if (t.includes(' - ')) { const q = t.split(' - ').pop()!.trim(); return TIMES.filter(x => x.startsWith(q) && x !== q); }
    if (!/\s/.test(t)) return PREFIX.filter(x => x.startsWith(t) && x !== t);
  }
  return [];
};

function Editor({ doc, upd, numbers }: { doc: Doc; upd: (p: Partial<Doc>) => void; numbers: boolean }) {
  const refs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const focus = useRef<string | null>(null);
  const [cur, setCur] = useState(0);
  useEffect(() => { if (focus.current) { refs.current[focus.current]?.focus(); focus.current = null; } });
  useEffect(() => { Object.values(refs.current).forEach(t => { if (t) { t.style.height = '0'; t.style.height = t.scrollHeight + 'px'; } }); });
  const els = doc.elements, names = charNames(doc), ci = Math.min(cur, els.length - 1);
  const setEls = (e: typeof els) => upd({ elements: e });
  const patch = (i: number, p: object) => setEls(els.map((e, k) => (k === i ? { ...e, ...p } : e)));
  const setType = (i: number, t: ElType) => patch(i, { type: t, text: normalize(t, els[i].text) });
  const accept = (i: number, sg: string) => {
    const e = els[i], t = e.text.toUpperCase();
    patch(i, { text: e.type === 'character' ? sg : t.includes(' - ') ? t.replace(/ - [^-]*$/, ' - ' + sg) : sg + ' ' });
  };
  const onKey = (ev: React.KeyboardEvent<HTMLTextAreaElement>, i: number) => {
    const e = els[i], sg = sugFor(e, names);
    if ((ev.ctrlKey || ev.metaKey) && /^[1-7]$/.test(ev.key)) { ev.preventDefault(); setType(i, ORDER[+ev.key - 1]); }
    else if (sg.length && !ev.shiftKey && (ev.key === 'Enter' || (ev.key === 'Tab' && e.type === 'character'))) { ev.preventDefault(); accept(i, sg[0]); }
    else if (ev.key === 'Tab') { ev.preventDefault(); setType(i, ORDER[(ORDER.indexOf(e.type) + (ev.shiftKey ? -1 : 1) + ORDER.length) % ORDER.length]); }
    else if (ev.key === 'Enter' && !ev.shiftKey) {
      ev.preventDefault(); const n = newEl(nextType(e.type));
      setEls([...els.slice(0, i + 1), n, ...els.slice(i + 1)]); focus.current = n.id;
    } else if (ev.key === 'Backspace' && e.text === '' && els.length > 1) {
      ev.preventDefault(); setEls(els.filter((_, k) => k !== i)); focus.current = els[Math.max(0, i - 1)].id;
    } else if (ev.key === 'ArrowUp' && ev.currentTarget.selectionStart === 0 && i > 0) { focus.current = els[i - 1].id; upd({}); }
    else if (ev.key === 'ArrowDown' && ev.currentTarget.selectionStart === e.text.length && i < els.length - 1) { focus.current = els[i + 1].id; upd({}); }
  };
  let sn = 0;
  return (
    <div className="stage"><div className="col">
      <div className="tb">
        <span>Element</span>
        <select value={els[ci].type} onChange={e => { setType(ci, e.target.value as ElType); focus.current = els[ci].id; }}>
          {ORDER.map((t, k) => <option key={t} value={t}>{LONG[t]}  (Ctrl+{k + 1})</option>)}
        </select>
        <small>Tab / Shift+Tab = change type · Enter = next line · Tab or Enter accepts a suggestion</small>
      </div>
      <div className="page">
        {els.map((e, i) => { const num = e.type === 'scene_heading' ? ++sn : 0; const sg = ci === i ? sugFor(e, names) : []; return (
          <div key={e.id} className={`row ${e.type}`}>
            <span className="tag">{LABEL[e.type]}</span>
            {numbers && num > 0 && <><span className="sn l">{num}.</span><span className="sn r">{num}.</span></>}
            <textarea ref={r => { refs.current[e.id] = r; }} rows={1} value={e.text} spellCheck
              onFocus={() => setCur(i)} onChange={ev => patch(i, { text: normalize(e.type, ev.target.value) })} onKeyDown={ev => onKey(ev, i)} />
            {sg.length > 0 && <div className="sug">{sg.slice(0, 8).map((x, k) => <span key={x} className={k === 0 ? 'f' : ''} onMouseDown={ev => { ev.preventDefault(); accept(i, x); }}>{x}</span>)}</div>}
          </div>); })}
      </div>
    </div></div>
  );
}

function PrintView({ doc, s }: { doc: Doc; s: Settings }) {
  let n = 0;
  return (
    <div className="print-root" style={{ fontFamily: s.font, fontSize: s.size + 'pt' }}>
      {s.titlePage && <div className="p-title"><h1>{doc.title}</h1><p>written by</p><p>{doc.author}</p></div>}
      {doc.elements.map(e => { const num = e.type === 'scene_heading' ? ++n : 0; return (
        <div key={e.id} className={`p ${e.type}`}>
          {s.numbers && num > 0 && <><span className="sn l">{num}.</span><span className="sn r">{num}.</span></>}
          {e.type === 'parenthetical' && !e.text.startsWith('(') ? `(${e.text})` : e.text}
        </div>); })}
    </div>
  );
}

function Timeline({ doc, upd }: { doc: Doc; upd: (p: Partial<Doc>) => void }) {
  const scenes = doc.elements.filter(e => e.type === 'scene_heading');
  const setBeat = (id: string, p: object) => upd({ beats: { ...doc.beats, [id]: { ...{ note: '', color: COLORS[4] }, ...doc.beats[id], ...p } as Beat } });
  const sceneChars = (id: string) => {
    const i = doc.elements.findIndex(e => e.id === id); const out = new Set<string>();
    for (let k = i + 1; k < doc.elements.length && doc.elements[k].type !== 'scene_heading'; k++) if (doc.elements[k].type === 'character') out.add(cleanName(doc.elements[k].text));
    return [...out];
  };
  if (!scenes.length) return <p className="empty">Add scene headings in the Write tab and they appear here.</p>;
  return (
    <div className="timeline">
      {scenes.map((s, n) => { const b = doc.beats[s.id]; const color = b?.color || COLORS[4]; return (
        <div className="scene-card" key={s.id} style={{ borderColor: color }}>
          <div className="num" style={{ background: color }}>{n + 1}</div>
          <div className="body">
            <h3>{s.text || '(untitled scene)'}</h3>
            <div className="chips">{sceneChars(s.id).map(c => <span key={c}>{c}</span>)}</div>
            <textarea placeholder="What happens? Story beat, mood, twist…" value={b?.note || ''} onChange={e => setBeat(s.id, { note: e.target.value })} />
            <div className="swatches">{COLORS.map(c => <i key={c} style={{ background: c, outline: c === color ? '2px solid #fff' : 'none' }} onClick={() => setBeat(s.id, { color: c })} />)}</div>
          </div>
        </div>); })}
    </div>
  );
}

function Characters({ doc, upd }: { doc: Doc; upd: (p: Partial<Doc>) => void }) {
  const missing = charNames(doc).filter(n => !doc.characters.some(c => c.name.toUpperCase() === n));
  const set = (id: string, p: Partial<Character>) => upd({ characters: doc.characters.map(c => (c.id === id ? { ...c, ...p } : c)) });
  const lines = (name: string) => doc.elements.filter((e, i) => e.type === 'dialogue' && cleanName(doc.elements[i - 1]?.type === 'parenthetical' ? doc.elements[i - 2]?.text || '' : doc.elements[i - 1]?.text || '') === name.toUpperCase()).length;
  const fields: [keyof Character, string][] = [['role', 'Role (hero, mentor…)'], ['age', 'Age'], ['look', 'Appearance'], ['goal', 'Wants / goal'], ['flaw', 'Flaw / fear'], ['arc', 'Character arc']];
  return (
    <div className="chars">
      <div className="bar">
        <button className="hot" onClick={() => upd({ characters: [...doc.characters, newChar()] })}>＋ New character</button>
        {missing.map(n => <button key={n} onClick={() => upd({ characters: [...doc.characters, newChar(n)] })}>＋ {n}</button>)}
      </div>
      <div className="grid">
        {doc.characters.map(c => (
          <div className="sheet" key={c.id} style={{ borderTopColor: c.color }}>
            <div className="avatar" style={{ background: c.color }}>{(c.name[0] || '?').toUpperCase()}</div>
            <input className="name" placeholder="NAME" value={c.name} onChange={e => set(c.id, { name: e.target.value.toUpperCase() })} />
            <small>{lines(c.name)} dialogue lines</small>
            {fields.map(([k, ph]) => <textarea key={k} rows={k === 'age' || k === 'role' ? 1 : 2} placeholder={ph} value={c[k]} onChange={e => set(c.id, { [k]: e.target.value })} />)}
            <div className="swatches">{COLORS.map(x => <i key={x} style={{ background: x }} onClick={() => set(c.id, { color: x })} />)}</div>
            <button className="del" onClick={() => upd({ characters: doc.characters.filter(z => z.id !== c.id) })}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const sceneNo = (els: { type: string }[], i: number) => els.slice(0, i + 1).filter(e => e.type === 'scene_heading').length;
const PAPERS: [string, string, string][] = [['White', '#fffdf7', '#111111'], ['Cream', '#f4e8c8', '#2b2112'], ['Mint', '#e6fff7', '#0b2a22'], ['Dark', '#1f1b2e', '#f2ecff']];

function Panel({ s, set, onClose }: { s: Settings; set: (x: Settings) => void; onClose: () => void }) {
  const u = (p: Partial<Settings>) => set({ ...s, ...p });
  const pick = (f?: File) => {
    if (!f) return; const r = new FileReader();
    r.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, 1920 / im.width); const c = document.createElement('canvas'); c.width = im.width * k; c.height = im.height * k; c.getContext('2d')!.drawImage(im, 0, 0, c.width, c.height); u({ wall: c.toDataURL('image/jpeg', 0.82) }); }; im.src = r.result as string; };
    r.readAsDataURL(f);
  };
  return (
    <div className="panel">
      <div className="ph"><h4>Style</h4><button className="x" onClick={onClose}>✕ Close</button></div>
      <h4>Sheet</h4>
      <label>Font<select value={s.font} onChange={e => u({ font: e.target.value })}>{FONTS.map(([n, v]) => <option key={n} value={v}>{n}</option>)}</select></label>
      <label>Size {s.size}pt<input type="range" min={9} max={18} step={0.5} value={s.size} onChange={e => u({ size: +e.target.value })} /></label>
      <label>Width {s.width}in<input type="range" min={6} max={11} step={0.25} value={s.width} onChange={e => u({ width: +e.target.value })} /></label>
      <div className="presets">{PAPERS.map(([n, p, i]) => <button key={n} style={{ background: p, color: i }} onClick={() => u({ paper: p, ink: i })}>{n}</button>)}</div>
      <label>Sheet colour<input type="color" value={s.paper} onChange={e => u({ paper: e.target.value })} /></label>
      <label>Text colour<input type="color" value={s.ink} onChange={e => u({ ink: e.target.value })} /></label>
      <label className="chk"><input type="checkbox" checked={s.numbers} onChange={e => u({ numbers: e.target.checked })} />Scene numbers</label>
      <label className="chk"><input type="checkbox" checked={s.titlePage} onChange={e => u({ titlePage: e.target.checked })} />Title page (print / PDF / Word)</label>
      <h4>Background</h4>
      <label className="file">Choose wallpaper…<input type="file" accept="image/*" hidden onChange={e => pick(e.target.files?.[0])} /></label>
      <button className="file" style={{ width: '100%' }} onClick={async () => { const p = await window.api.pickVideo(); if (p) u({ wall: 'video:' + p }); }}>🎞️ Choose live wallpaper…</button>
      <label className="chk"><input type="checkbox" checked={s.paused} onChange={e => u({ paused: e.target.checked })} />Pause live wallpaper</label>
      <div className="presets"><button onClick={() => u({ wall: 'default' })}>Default</button><button onClick={() => u({ wall: 'none' })}>None</button><button onClick={() => set(DEFAULTS)}>Reset all</button></div>
      <label>Darken {Math.round(s.dim * 100)}%<input type="range" min={0} max={0.85} step={0.05} value={s.dim} onChange={e => u({ dim: +e.target.value })} /></label>
    </div>
  );
}
