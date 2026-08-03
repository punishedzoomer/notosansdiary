---
title: How I Built & Customized My Quartz Digital Garden
tags:
  - quartz
  - webdev
  - obsidian
  - guide
---

Building a digital garden should feel personal—a living space rather than a rigid static blog. For this site, I chose [Quartz 4](https://github.com/jackyzha0/quartz) and tailored it to match my exact workflow and visual preferences. 

Here is a breakdown of all the modifications, design decisions, troubleshooting fixes, and Obsidian workflow tweaks I made to build this site.

---

## 🎨 1. Typography & Aesthetic Customization

Standard tech blogs often look identical out of the box. I wanted a soft, readable, and warm aesthetic with hand-crafted elements.

### Font Pairings
In `quartz.config.yaml` and `quartz/styles/custom.scss`, I customized the font system:
- **Title Font (`Handlee`)**: Gives the homepage title and branding a handwritten, informal digital garden feel (`𓆉𓆉︎𓆉`).
- **Header & Body Font (`Lora`)**: An elegant serif font for long-form reading comfort across all pages.
- **Code Blocks (`Ubuntu`)**: Clean monospace font for code snippets and technical blocks.

### Strict Font Specificity Fix
To fix font inconsistencies where browser defaults leaked into headers and sidebar items, I enforced `Lora` site-wide in `custom.scss`:

```scss
// Enforce Lora across ALL pages, titles, headings, and sidebars site-wide
body,
article,
p,
h1, h2, h3, h4, h5, h6,
a, li, span, button,
.page-title,
.article-title {
  font-family: var(--bodyFont) !important;
}

// EXCEPT ONLY the index page main title, which uses Handlee
body[data-slug="index"] {
  .article-title {
    font-family: 'Handlee', cursive !important;
    text-align: center;
    font-size: 2.8rem;
    letter-spacing: 0.5px;
  }
}
```

### Custom Color Palette
Configured custom light/dark HSL background and accent tokens in `quartz.config.yaml`:
- **Light Mode Background**: Warm off-white (`#faf8f8`) to reduce glare compared to pure white.
- **Dark Mode Background**: Deep charcoal (`#161618`) paired with softer off-white body text (`#ebebec`).
- **Accents**: Deep steel blue (`#284b63`) and muted sage green (`#84a59d`) for links and highlight elements.

---

## 📑 2. Table of Contents (TOC) Component & Styling

To make navigating long articles seamless, I refactored the Table of Contents component.

### Custom TSX Implementation (`quartz/components/toc.tsx`)
Configured a modern, collapsible TOC component with smooth scroll overflow support:
- Added collapsible toggle state with SVG fold indicators.
- Integrated `OverflowListFactory` for handling long document headings cleanly without breaking sidebar height.
- Styled using both `modernStyle` (`quartz/components/styles/toc.scss`) and `_toc.scss`.

```tsx
<button
  type="button"
  class={fileData.collapseToc ? "collapsed toc-header" : "toc-header"}
  aria-controls="toc-content"
  aria-expanded={!fileData.collapseToc}
>
  <h3>{i18n(cfg.locale).components.tableOfContents.title}</h3>
  <svg class="fold" viewBox="0 0 24 24">...</svg>
</button>
```

### Config in `quartz.config.yaml`
```yaml
  - source: github:quartz-community/table-of-contents
    enabled: true
    options:
      maxDepth: 3
      minEntries: 1
      showByDefault: true
      collapseByDefault: false
      layout: modern
    layout:
      position: right
      priority: 10
```

---

## 🏡 3. Homepage Layout & Type Mismatch Fixes

During initial setup, the homepage (`index.md`) experienced rendering and layout issues due to strict component conditions and sidebar alignment.

### Resolving Component Condition Mismatches
- **Backlinks Positioning**: Fixed layout conflicts where backlinks failed to render on index pages by moving Backlinks to `afterBody`:
  ```yaml
  - source: "@quartz-community/backlinks"
    enabled: true
    layout:
      position: afterBody
      priority: 50
  ```
- **Borderless & Gap-Tuned Sidebar**: Cleaned up vertical divider lines and tuned column padding in `quartz/styles/custom.scss`:
  ```scss
  .page > #quartz-body {
    column-gap: 0.5rem !important;

    & div.sidebar,
    & div.sidebar.left,
    & div.sidebar.right,
    & div.center {
      border-left: none !important;
      border-right: none !important;
      box-shadow: none !important;
    }
  }
  ```

---

## 📂 4. Folder Navigation & Folder Notes

In standard Quartz setups, folders are just directory paths. I wanted every section (`Guides`, `Hobbies`, `Notes`) to act as a proper landing page.

### Folder Notes Pattern
Using the **Folder Notes** paradigm:
- Each folder has an index note matching its folder name (e.g., `content/Guides/Guides.md`).
- Linking to `[[Guides]]` or `[[Hobbies]]` opens the hub page for that section rather than an empty directory view.

---

## ⚙️ 5. Obsidian Templater & Active-Folder Workflow

To make writing effortless inside Obsidian without constantly dragging files around:

### Default Location for New Notes
In Obsidian Settings, I set **Default location for new notes** to **"Same folder as current file"**.

### Custom Templater Creation Script
Created a master template at `content/_templates/_maintemplate.md`:

```markdown
<%*
// 1. Detect the current active file's folder path
let targetFolder = tp.file.folder(true);

// 2. Prompt for the new note title
let noteTitle = await tp.system.prompt("Enter new note title:");

if (noteTitle) {
    // 3. Create and open the new note inside the active folder
    await tp.file.create_new("", noteTitle, true, targetFolder);
}
*%>
```

When writing inside `content/Guides/`, triggering this Templater script automatically creates the new note inside `content/Guides/` instead of cluttering the root vault.

---

## 🔒 6. Hiding System & Template Files in Quartz

Since templates live inside `content/_templates/`, they would normally get parsed by Quartz and published to the web.

To hide them from the public site, search, and navigation, I added `_templates` to `ignorePatterns` in `quartz.config.yaml`:

```yaml
configuration:
  ignorePatterns:
    - private
    - templates
    - _templates
    - .obsidian
```

This keeps the Obsidian workspace fully functional while ensuring template files remain hidden on the live website.

---

## 🚀 Summary

With this setup:
1. Writing a new note in Obsidian is seamless (`Cmd + N` or Templater creates it directly in the active folder).
2. The Table of Contents operates smoothly with collapsible sections and overflow scrolling.
3. The homepage renders with custom Handlee typography and borderless sidebars.
4. Quartz builds a clean, custom-styled website while keeping templates completely hidden.
