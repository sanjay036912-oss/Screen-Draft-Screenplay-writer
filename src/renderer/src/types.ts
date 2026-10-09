export type ElType = 'scene_heading' | 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot';
export interface ScriptElement { id: string; type: ElType; text: string }
export interface Character { id: string; name: string; role: string; age: string; look: string; goal: string; flaw: string; arc: string; color: string }
export interface Beat { note: string; color: string }
export interface Doc { title: string; author: string; elements: ScriptElement[]; characters: Character[]; beats: Record<string, Beat> }
declare global { interface Window { api: { save(o: any): Promise<string | null>; open(o?: { name: string; exts: string[] }): Promise<string | null>; pickVideo(): Promise<string | null>; print(): Promise<boolean>; pdf(name: string): Promise<string | null> } } }
