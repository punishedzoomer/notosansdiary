interface ImageItem {
  src: string
  rawName: string
  alt: string
  caption: string
  width?: string
  height?: string
}

function slugifyName(name: string): string {
  const parts = name.split("/")
  const lastPart = parts.pop() || ""
  const dotIdx = lastPart.lastIndexOf(".")
  const baseName = dotIdx !== -1 ? lastPart.slice(0, dotIdx) : lastPart
  const ext = dotIdx !== -1 ? lastPart.slice(dotIdx) : ""

  const slugifiedBase = baseName
    .replace(/\s+/g, "-")
    .replace(/&/g, "-and-")
    .replace(/%/g, "-percent-")
    .replace(/[?#<>:"|*]/g, "")
    .toLowerCase()

  const slugifiedLast = slugifiedBase + ext.toLowerCase()
  return [...parts, slugifiedLast].join("/")
}

function getCandidateUrls(rawPath: string): string[] {
  if (
    rawPath.startsWith("http://") ||
    rawPath.startsWith("https://") ||
    rawPath.startsWith("data:") ||
    rawPath.startsWith("blob:")
  ) {
    return [rawPath]
  }

  const cleanRaw = rawPath.replace(/^\/+/, "")
  const slugified = slugifyName(cleanRaw)
  const slugParts = (document.body.dataset.slug ?? "").split("/").filter(Boolean)
  const currentFolder = slugParts.length > 1 ? slugParts.slice(0, -1).join("/") : ""
  const basePath = document.body.dataset.basepath ?? ""

  const candidates: string[] = []

  // Helper to add unique URLs
  function add(url: string) {
    if (url && !candidates.includes(url)) {
      candidates.push(url)
    }
  }

  // If path explicitly points to assets or a folder
  if (cleanRaw.includes("/")) {
    add(cleanRaw)
    add(slugified)
    add(`./${cleanRaw}`)
    add(`./${slugified}`)
    add(`/${cleanRaw}`)
    add(`/${slugified}`)
  }

  // Relative to current page / folder
  add(`assets/${cleanRaw}`)
  add(`assets/${slugified}`)
  add(`./assets/${cleanRaw}`)
  add(`./assets/${slugified}`)
  add(`./${cleanRaw}`)
  add(`./${slugified}`)

  // Folder-prefixed paths (e.g. Guides/assets/garden.png)
  if (currentFolder) {
    add(`${currentFolder}/assets/${slugified}`)
    add(`${currentFolder}/assets/${cleanRaw}`)
    add(`/${currentFolder}/assets/${slugified}`)
    add(`/${currentFolder}/assets/${cleanRaw}`)
    add(`/${basePath ? basePath + "/" : ""}${currentFolder}/assets/${slugified}`)
  }

  // Root assets or static
  add(`/assets/${slugified}`)
  add(`/assets/${cleanRaw}`)
  add(`/static/${slugified}`)
  add(`/static/${cleanRaw}`)
  add(`../assets/${slugified}`)
  add(`../assets/${cleanRaw}`)

  return candidates
}

function parseImageBlock(rawText: string): { items: ImageItem[]; globalCaption?: string } {
  const lines = rawText.split("\n").map((l) => l.trim()).filter(Boolean)
  const items: ImageItem[] = []
  let globalCaption: string | undefined

  for (const line of lines) {
    // 1. Obsidian Wikilink: ![[filename.ext]] or ![[filename.ext|caption]] or ![[filename.ext|300]]
    const wikiMatch = line.match(/^!\[\[([^\]|]+)(?:\|([^\]]+))?\]\]$/)
    if (wikiMatch) {
      const rawName = wikiMatch[1].trim()
      const pipeContent = wikiMatch[2]?.trim() || ""

      let caption = ""
      let width: string | undefined
      let height: string | undefined

      if (pipeContent) {
        if (/^\d+(?:x\d+)?$/.test(pipeContent)) {
          // Dimension syntax: 300 or 300x200
          const [w, h] = pipeContent.split("x")
          width = w
          height = h
        } else {
          caption = pipeContent
        }
      }

      items.push({
        src: rawName,
        rawName,
        alt: caption || rawName,
        caption,
        width,
        height,
      })
      continue
    }

    // 2. Standard Markdown image: ![alt](url "title")
    const mdMatch = line.match(/^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]+)")?\)$/)
    if (mdMatch) {
      const alt = mdMatch[1].trim()
      const src = mdMatch[2].trim()
      const title = mdMatch[3]?.trim() || ""

      items.push({
        src,
        rawName: src,
        alt: alt || title || src,
        caption: title || alt,
      })
      continue
    }

    // 3. HTML <img> tag
    const htmlMatch = line.match(/<img\s+[^>]*src=["']([^"']+)["'][^>]*>/i)
    if (htmlMatch) {
      const src = htmlMatch[1].trim()
      const altMatch = line.match(/alt=["']([^"']+)["']/i)
      const alt = altMatch ? altMatch[1].trim() : ""
      items.push({
        src,
        rawName: src,
        alt: alt || src,
        caption: alt,
      })
      continue
    }

    // 4. Standalone caption line or text
    if (!line.startsWith("!") && !line.startsWith("<") && items.length > 0) {
      globalCaption = line
    }
  }

  return { items, globalCaption }
}

function getLayoutClass(lang: string, itemCount: number): string {
  const normalized = lang.toLowerCase().trim()
  if (normalized.includes("layout-a") || normalized === "image-layout-a") {
    return "layout-a"
  }
  if (normalized.includes("layout-b") || normalized === "image-layout-b") {
    return "layout-b"
  }
  if (normalized.includes("layout-c") || normalized === "image-layout-c") {
    return "layout-c"
  }
  if (normalized.includes("masonry") || normalized === "image-layout-masonry") {
    return "layout-masonry"
  }
  if (normalized.includes("grid") || normalized === "image-layout-grid") {
    return "layout-grid"
  }

  // Default auto selection based on count
  if (itemCount === 2) return "layout-a"
  if (itemCount === 3) return "layout-b"
  if (itemCount === 4) return "layout-4-col"
  return "layout-grid"
}

// Lightbox modal singleton
let lightboxEl: HTMLElement | null = null
let lightboxImg: HTMLImageElement | null = null
let lightboxCaption: HTMLElement | null = null

function ensureLightbox() {
  if (lightboxEl) return

  lightboxEl = document.createElement("div")
  lightboxEl.className = "image-layout-lightbox"
  lightboxEl.innerHTML = `
    <button class="lightbox-close" aria-label="Close image preview">&times;</button>
    <div class="lightbox-content">
      <img class="lightbox-img" src="" alt="" />
      <div class="lightbox-caption"></div>
    </div>
  `

  document.body.appendChild(lightboxEl)

  lightboxImg = lightboxEl.querySelector(".lightbox-img")
  lightboxCaption = lightboxEl.querySelector(".lightbox-caption")
  const closeBtn = lightboxEl.querySelector(".lightbox-close")

  function closeLightbox() {
    lightboxEl?.classList.remove("active")
    document.body.style.overflow = ""
  }

  lightboxEl.addEventListener("click", (e) => {
    if (e.target === lightboxEl || e.target === closeBtn) {
      closeLightbox()
    }
  })

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && lightboxEl?.classList.contains("active")) {
      closeLightbox()
    }
  })
}

function openLightbox(src: string, alt: string, caption?: string) {
  ensureLightbox()
  if (!lightboxEl || !lightboxImg || !lightboxCaption) return

  lightboxImg.src = src
  lightboxImg.alt = alt
  lightboxCaption.textContent = caption || alt || ""
  lightboxCaption.style.display = caption || alt ? "block" : "none"

  lightboxEl.classList.add("active")
  document.body.style.overflow = "hidden"
}

function setupImageErrorFallback(img: HTMLImageElement, candidates: string[]) {
  let attempt = 0

  img.onerror = () => {
    attempt++
    if (attempt < candidates.length) {
      img.src = candidates[attempt]
    }
  }

  if (candidates.length > 0) {
    img.src = candidates[0]
  }
}

export function setupImageLayouts() {
  // Find all codeblocks in the document with image-layout or gallery
  const codeBlocks = Array.from(
    document.querySelectorAll<HTMLElement>(
      'code[data-language*="image-layout"], code[data-language*="gallery"], code[data-language*="image-grid"], pre[data-language*="image-layout"], pre[data-language*="gallery"], pre[data-language*="image-grid"]',
    ),
  )

  const processedParents = new Set<HTMLElement>()

  for (const block of codeBlocks) {
    const rawLang =
      block.getAttribute("data-language") ||
      Array.from(block.classList)
        .find((c) => c.startsWith("language-"))
        ?.replace("language-", "") ||
      ""

    if (
      !rawLang.includes("image-layout") &&
      !rawLang.includes("gallery") &&
      !rawLang.includes("image-grid")
    ) {
      continue
    }

    // Determine the root container to replace (could be pre or figure)
    const targetElement = (block.closest("figure[data-rehype-pretty-code-figure]") ||
      block.closest("pre") ||
      block) as HTMLElement

    if (processedParents.has(targetElement)) continue
    processedParents.add(targetElement)

    const rawText = block.innerText || block.textContent || ""
    const { items, globalCaption } = parseImageBlock(rawText)

    if (items.length === 0) continue

    const layoutClass = getLayoutClass(rawLang, items.length)

    // Build the gallery wrapper
    const wrapper = document.createElement("div")
    wrapper.className = "image-layout-wrapper"

    const container = document.createElement("div")
    container.className = `image-layout-container ${layoutClass}`

    for (const item of items) {
      const card = document.createElement("div")
      card.className = "image-layout-card"

      const imgWrapper = document.createElement("div")
      imgWrapper.className = "image-layout-img-wrapper"

      const img = document.createElement("img")
      img.className = "image-layout-img"
      img.alt = item.alt
      img.loading = "lazy"

      if (item.width) {
        img.style.maxWidth = `${item.width}px`
      }

      const candidateUrls = getCandidateUrls(item.rawName)
      setupImageErrorFallback(img, candidateUrls)

      imgWrapper.appendChild(img)
      card.appendChild(imgWrapper)

      if (item.caption) {
        const captionEl = document.createElement("div")
        captionEl.className = "image-layout-caption"
        captionEl.textContent = item.caption
        card.appendChild(captionEl)
      }

      // Lightbox click handler
      card.addEventListener("click", () => {
        openLightbox(img.currentSrc || img.src, item.alt, item.caption)
      })

      container.appendChild(card)
    }

    wrapper.appendChild(container)

    if (globalCaption) {
      const gCaption = document.createElement("div")
      gCaption.className = "image-layout-global-caption"
      gCaption.textContent = globalCaption
      wrapper.appendChild(gCaption)
    }

    // Replace the codeblock in the DOM
    targetElement.replaceWith(wrapper)
  }
}

// Attach listeners for initial load and SPA navigation
document.addEventListener("nav", setupImageLayouts)
document.addEventListener("render", setupImageLayouts)
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", setupImageLayouts)
} else {
  setupImageLayouts()
}
