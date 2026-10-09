# 🎬 ScreenDraft

A creative desktop screenwriting app for Windows, macOS and Linux. Write in industry-standard format, plan your story on a timeline, build character sheets, and export to Word, PDF or Fountain.

Built with Electron, React and TypeScript.

> **Write · Plan · Bring to life**

## Features

- **Screenplay editor** with standard formatting for Scene Heading, Action, Character, Dialogue, Parenthetical, Transition and Shot (Celtx-style elements)
- **Smart suggestions**: character names you've already used, `INT.` / `EXT.` prefixes, and times of day (`DAY`, `NIGHT`, `CONTINUOUS`…)
- **Scene numbers** shown on both sides of the page and included in exports
- **Timeline**: every scene becomes a colour-coded card with the characters in it and a notes box for story beats
- **Character sheets**: role, age, appearance, goal, flaw, arc, colour, and a dialogue-line count
- **Export**: Word (`.docx`), PDF, Fountain (`.fountain`), plus Print
- **Import** Fountain (`.fountain`, `.txt`) scripts, either replacing your script or adding to the end
- **Customisable sheet**: font, size, width, paper and text colour, optional title page
- **Wallpapers**: still image or **live wallpaper** (MP4, WebM, MOV or GIF), with a Darken slider and Pause option
- Saves to its own `.screendraft` file; your style choices are remembered

## Getting started

Requires [Node.js](https://nodejs.org) 18 or newer.

```bash
git clone https://github.com/sanjay036912-oss/Screen-Draft-Screenplay-writer.git
cd Screen-Draft-Screenplay-writer
npm install
npm run dev
```

## Build an installer

```bash
npm run build
```

The installer is created in the `release/` folder. On Windows it adds a **Desktop and Start Menu shortcut** automatically.

> **Windows tip:** if the build fails with a "Cannot create symbolic link" error, run the terminal as Administrator or turn on **Developer Mode** (Settings, then For developers), delete `%LOCALAPPDATA%\electron-builder\Cache\winCodeSign`, and build again.

Build on the system you want to target: Windows for an `.exe`, macOS for a `.dmg`, Linux for an AppImage.

## Keyboard shortcuts

| Keys | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Change the line to the next / previous element type |
| `Enter` | New line with the next logical element (or accept a suggestion) |
| `Ctrl+1` to `Ctrl+7` | Scene Heading, Action, Character, Dialogue, Parenthetical, Transition, Shot |
| `Backspace` on an empty line | Delete the line |
| `Esc` | Close the Style panel |

## Project structure

```
electron/          Main process: windows, file dialogs, print, PDF, wallpaper protocol
src/renderer/      React app (editor, timeline, characters, style panel)
  src/lib.ts       Document model, Fountain import/export, Word export
  public/          Logo and default wallpaper
build/             App icon
```

## Known limitations

- Word (`.docx`) import isn't supported yet; use Fountain to bring scripts in
- Dual dialogue and revision tracking aren't included
- Live wallpapers use more CPU and battery, so keep loops short or pause them while writing
- The editor hasn't been stress-tested with very large pastes or IME input

## Roadmap ideas

- Scene navigator side panel
- Word import
- Revision colours and page locking
- Storyboard and scheduling views

## Screenshots

<img width="1889" height="995" alt="Screenshot 2026-10-09 203028" src="https://github.com/user-attachments/assets/fa90339d-fe1c-4ff0-9716-28cb1a9b4c41" />
<img width="1873" height="1029" alt="Screenshot 2026-10-09 203046" src="https://github.com/user-attachments/assets/f6428972-f30e-41c4-a656-9757c91b68f1" />
<img width="1879" height="1016" alt="Screenshot 2026-10-09 203017" src="https://github.com/user-attachments/assets/fa997240-50b3-44c7-9706-f93d769e0ce8" />



## License

Add a license of your choice (for example MIT) in a `LICENSE` file.
