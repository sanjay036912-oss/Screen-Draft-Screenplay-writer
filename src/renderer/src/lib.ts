import { Doc, ElType, ScriptElement, Character } from './types';
import { Document, Packer, Paragraph, TextRun, AlignmentType, PageBreak } from 'docx';
export interface Settings { font: string; size: number; paper: string; ink: string; width: number; numbers: boolean; titlePage: boolean; paused: boolean; wall: string; dim: number }
export const FONTS: [string, string][] = [['Courier Prime', "'Courier Prime','Courier New',monospace"], ['Courier New', "'Courier New',monospace"], ['Times New Roman', "'Times New Roman',serif"], ['Georgia', 'Georgia,serif'], ['Arial', 'Arial,sans-serif'], ['Calibri', "Calibri,'Segoe UI',sans-serif"]];
export const DEFAULTS: Settings = { font: FONTS[0][1], size: 12, paper: '#fffdf7', ink: '#111111', width: 8.5, numbers: true, titlePage: true, paused: false, wall: 'default', dim: 0.35 };
export const uid = () => Math.random().toString(36).slice(2, 10);
export const ORDER: ElType[] = ['scene_heading', 'action', 'character', 'dialogue', 'parenthetical', 'transition', 'shot'];
export const LABEL: Record<ElType, string> = { scene_heading: 'Scene', action: 'Action', character: 'Character', dialogue: 'Dialogue', parenthetical: 'Paren', transition: 'Transition', shot: 'Shot' };
export const LONG: Record<ElType, string> = { scene_heading: 'Scene Heading', action: 'Action', character: 'Character', dialogue: 'Dialogue', parenthetical: 'Parenthetical', transition: 'Transition', shot: 'Shot' };
export const COLORS = ['#ff6b6b', '#ffa94d', '#ffd43b', '#69db7c', '#4dabf7', '#9775fa', '#f783ac'];
export const newEl = (type: ElType = 'scene_heading', text = ''): ScriptElement => ({ id: uid(), type, text });
export const nextType = (t: ElType): ElType => ({ scene_heading: 'action', action: 'action', character: 'dialogue', dialogue: 'action', parenthetical: 'dialogue', transition: 'scene_heading', shot: 'action' } as const)[t];
export const normalize = (type: ElType, text: string) => (type === 'scene_heading' || type === 'character' || type === 'transition' || type === 'shot' ? text.toUpperCase() : text);
export const newChar = (name = ''): Character => ({ id: uid(), name, role: '', age: '', look: '', goal: '', flaw: '', arc: '', color: COLORS[Math.floor(Math.random() * COLORS.length)] });
export const emptyDoc = (): Doc => ({ title: 'Untitled Screenplay', author: '', elements: [newEl('scene_heading', 'INT. SOMEWHERE - DAY'), newEl('action')], characters: [], beats: {} });
export const cleanName = (t: string) => t.replace(/\(.*?\)/g, '').trim();
export const charNames = (d: Doc) => Array.from(new Set(d.elements.filter(e => e.type === 'character' && cleanName(e.text)).map(e => cleanName(e.text))));
export const WIDTH: Record<ElType, number> = { scene_heading: 60, action: 60, character: 35, dialogue: 35, parenthetical: 25, transition: 20, shot: 60 };
export function pageCount(els: ScriptElement[]) {
  const lines = els.reduce((n, e) => n + Math.max(1, Math.ceil(e.text.length / WIDTH[e.type])) + (e.type === 'dialogue' || e.type === 'parenthetical' ? 0 : 1), 0);
  return Math.max(1, Math.ceil(lines / 55));
}
export function toFountain(d: Doc) {
  const out = [`Title: ${d.title}`, `Author: ${d.author}`, ''];
  for (const e of d.elements) {
    if (e.type === 'scene_heading') out.push('', e.text.toUpperCase());
    else if (e.type === 'character') out.push('', e.text.toUpperCase());
    else if (e.type === 'transition') out.push('', e.text.toUpperCase().replace(/:?$/, ':'));
    else if (e.type === 'parenthetical') out.push(e.text.startsWith('(') ? e.text : `(${e.text})`);
    else if (e.type === 'shot') out.push('', '!' + e.text.toUpperCase());
    else if (e.type === 'action') out.push('', e.text);
    else out.push(e.text);
  }
  return out.join('\n');
}
// indents in twips (1440 = 1 inch), measured from the 1.5in left page margin
const IND: Record<ElType, { left: number; right: number; align?: any }> = {
  scene_heading: { left: 0, right: 0 }, action: { left: 0, right: 0 },
  character: { left: 2160, right: 0 }, parenthetical: { left: 1620, right: 2160 },
  dialogue: { left: 1440, right: 1440 }, shot: { left: 0, right: 0 }, transition: { left: 0, right: 0, align: AlignmentType.RIGHT }
};
export async function toWord(d: Doc, s: Settings): Promise<Uint8Array> {
  const fn = FONTS.find(x => x[1] === s.font)?.[0] ?? 'Courier New';
  const f = { font: fn === 'Courier Prime' ? 'Courier New' : fn, size: Math.round(s.size * 2) };
  let n = 0;
  const title = [
    new Paragraph({ spacing: { before: 4000 }, alignment: AlignmentType.CENTER, children: [new TextRun({ ...f, text: d.title.toUpperCase(), bold: true })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 400 }, children: [new TextRun({ ...f, text: 'written by' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ ...f, text: d.author })] }),
    new Paragraph({ children: [new PageBreak()] })
  ];
  const body = d.elements.map(e => {
    const i = IND[e.type];
    let text = e.type === 'parenthetical' && !e.text.startsWith('(') ? `(${e.text})` : e.text;
    if (e.type === 'scene_heading') { n++; if (s.numbers) text = `${n}. ${text}`; }
    return new Paragraph({
      alignment: i.align, indent: { left: i.left, right: i.right },
      spacing: { before: e.type === 'dialogue' || e.type === 'parenthetical' ? 0 : 240, after: 0 },
      keepNext: e.type === 'character' || e.type === 'scene_heading',
      children: [new TextRun({ ...f, text: normalize(e.type, text), bold: e.type === 'scene_heading' })]
    });
  });
  const doc = new Document({
    title: d.title,
    sections: [{ properties: { page: { size: { width: 12240, height: 15840 }, margin: { top: 1440, bottom: 1440, left: 2160, right: 1440 } } }, children: [...(s.titlePage ? title : []), ...body] }]
  });
  const blob = await Packer.toBlob(doc);
  return new Uint8Array(await blob.arrayBuffer());
}

export function fromFountain(src: string): { title: string; author: string; elements: ScriptElement[] } {
  let text = src.replace(/\r\n?/g, '\n').replace(/\[\[[\s\S]*?\]\]/g, '').replace(/\/\*[\s\S]*?\*\//g, '');
  let title = '', author = '';
  const head = text.match(/^((?:[A-Za-z ]+:.*\n(?:[ \t]+.*\n)*)+)\n/);
  if (head) {
    for (const m of head[1].matchAll(/^(Title|Authors?|Credit):[ \t]*(.*)$/gim)) { if (/title/i.test(m[1])) title = m[2].trim(); else if (/author/i.test(m[1])) author = m[2].trim(); }
    text = text.slice(head[0].length);
  }
  const els: ScriptElement[] = [];
  const scene = /^(\.(?!\.)|(INT|EXT|EST|INT\.?\/EXT|I\/E)[. ])/i;
  for (const block of text.split(/\n{2,}/)) {
    const lines = block.split('\n').map(l => l.trimEnd()).filter(l => l.trim());
    if (!lines.length) continue;
    const first = lines[0].trim();
    if (/^={3,}$/.test(first) || /^#+ /.test(first) || /^= /.test(first)) continue;
    const clean = (t: string) => t.replace(/#[\w.-]+#\s*$/, '').replace(/[*_]/g, '').trim();
    if (scene.test(first) && lines.length === 1) { els.push(newEl('scene_heading', clean(first.replace(/^\./, '')).toUpperCase())); continue; }
    if (first.startsWith('>') && !first.endsWith('<')) { els.push(newEl('transition', first.replace(/^>\s*/, '').toUpperCase())); continue; }
    if (lines.length === 1 && /^[A-Z0-9 .'-]+TO:$/.test(first)) { els.push(newEl('transition', first)); continue; }
    const name = first.replace(/\^$/, '').replace(/^@/, '');
    const isChar = lines.length > 1 && !first.startsWith('!') && (first.startsWith('@') || (name.replace(/\(.*?\)/g, '').trim() === name.replace(/\(.*?\)/g, '').trim().toUpperCase() && /[A-Z]/.test(name)));
    if (isChar) {
      els.push(newEl('character', clean(name).toUpperCase()));
      const ind = (l: string) => (l.match(/^\s*/) as RegExpMatchArray)[0].length;
      let dlg = true;
      for (const l of lines.slice(1)) {
        if (dlg && ind(lines[0]) > 0 && ind(l) === 0) dlg = false; // indented speech ended; unindented line is action
        els.push(newEl(!dlg ? 'action' : /^\(.*\)$/.test(l.trim()) ? 'parenthetical' : 'dialogue', clean(l.replace(/^!/, ''))));
      }
      continue;
    }
    els.push(newEl('action', clean(lines.map(l => l.trim().replace(/^!/, '')).join(' '))));
  }
  return { title, author, elements: els };
}
