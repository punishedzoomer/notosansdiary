---
title: Building an Aidoku source
---

[Aidoku](https://aidoku.app) is an open-source manga and comic reader for iOS. Unlike traditional reader apps where sources are written in JavaScript or Kotlin, Aidoku sources are compiled directly to **WebAssembly (Wasm)** using **Rust** with `aidoku-rs`.

This guide walks through how Aidoku sources work under the hood and breaks down a real-world working source: `en.ocecomic`.

---

## 1. The Architecture: Why `no_std` & WebAssembly?

Aidoku sources execute inside a sandboxed Wasm runtime on iOS. To keep the binary size minimal and execution blazing fast, Aidoku sources are compiled with `#![no_std]`.

Instead of the standard library, `aidoku-rs` provides memory-efficient wrappers for:
- Allocations (`String`, `Vec`, `format!`) via `aidoku::alloc`
- HTTP networking (`Request`) via `aidoku::imports::net`
- HTML DOM parsing (`Document`, `Node`) via `aidoku::imports::html`

---

## 2. Project Setup

### `Cargo.toml`
The crate is configured as a `cdylib` with size optimizations:

```toml title="Cargo.toml"
[package]
name = "ocecomic"
version = "0.1.0"
edition = "2024"

[dependencies]
aidoku = { git = "https://github.com/Aidoku/aidoku-rs.git", version = "0.3.0" }

[lib]
crate-type = ["cdylib"]

[profile.release]
panic = "abort"
opt-level = "s"
strip = true
lto = true
```

### `res/source.json`
Every source defines its metadata and language:

```json title="res/source.json"
{
  "info": {
    "id": "en.ocecomic",
    "name": "ocecomic",
    "version": 1,
    "url": "https://ocecomic.com/",
    "contentRating": 0,
    "languages": ["en"]
  }
}
```

---

## 3. Implementing the Source (`src/lib.rs`)

### Base Imports & Constants

```rust title="src/lib.rs"
#![no_std]
use aidoku::{
    AidokuError, Chapter, DeepLinkHandler, DeepLinkResult, FilterValue, Home, HomeComponent,
    HomeComponentValue, HomeLayout, Listing, ListingProvider, Manga, MangaPageResult, Page, Result,
    Source, Viewer, PageContent,
    alloc::{String, Vec, vec},
    imports::{
        html::Document,
        net::Request,
        std::send_partial_result,
    },
    prelude::*,
};

const BASE_URL: &str = "https://ocecomic.com";
const USER_AGENT: &str = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36";

struct OceComic;
```

---

### Core `Source` Trait

The `Source` trait is the core requirement for every Aidoku extension. It handles search, metadata, chapter lists, and image pages.

#### 1. Search Manga List
```rust title="src/lib.rs"
impl Source for OceComic {
    fn new() -> Self {
        Self
    }

    fn get_search_manga_list(
        &self,
        query: Option<String>,
        page: i32,
        _filters: Vec<FilterValue>,
    ) -> Result<MangaPageResult> {
        let term = match query {
            Some(q) => q,
            None => return Ok(MangaPageResult { entries: Vec::new(), has_next_page: false }),
        };
        let url = format!("{BASE_URL}/search/{term}/popular/page/{page}");
        let html = Request::get(&url)?
            .header("User-Agent", USER_AGENT)
            .html()?;
        Ok(parse_comic_list(html))
    }
```

#### 2. Manga Details & Chapters
Aidoku passes flags (`needs_details`, `needs_chapters`) so you can fetch only what's necessary. Using `send_partial_result(&manga)` renders metadata instantly while chapters are parsed:

```rust title="src/lib.rs"
    fn get_manga_update(
        &self,
        mut manga: Manga,
        needs_details: bool,
        needs_chapters: bool,
    ) -> Result<Manga> {
        let url = format!("{BASE_URL}{}", manga.key);
        let html = Request::get(&url)?
            .header("Referer", &format!("{BASE_URL}/"))
            .header("User-Agent", USER_AGENT)
            .html()?;

        if needs_details {
            manga.title = html
                .select_first("h1")
                .and_then(|el| el.text())
                .unwrap_or(manga.title);

            manga.cover = html
                .select_first(".page.home img")
                .and_then(|el| el.attr("abs:src"));

            manga.description = html
                .select_first(".detail .about")
                .and_then(|el| el.text());

            // Advanced selector: using :has and :contains for structured data
            manga.authors = html
                .select_first(".info ul li:has(span:contains(Writer)) + li")
                .and_then(|el| el.text())
                .map(|s| vec![s]);

            manga.tags = html
                .select(".info ul li:has(span:contains(Genre)) + li a")
                .map(|els| els.filter_map(|a| a.text()).collect::<Vec<_>>());

            manga.viewer = Viewer::LeftToRight;

            if needs_chapters {
                send_partial_result(&manga);
            }
        }

        if needs_chapters {
            manga.chapters = html
                .select(".issue-link")
                .map(|els| {
                    els.filter_map(|el| {
                        let url = el.attr("abs:href")?;
                        let title = el.text();
                        let key = url.strip_prefix(BASE_URL)?;
                        Some(Chapter {
                            key: key.into(),
                            title,
                            url: Some(url),
                            ..Default::default()
                        })
                    })
                    .collect()
                });
        }

        Ok(manga)
    }
```

#### 3. Chapter Page Images
```rust title="src/lib.rs"
    fn get_page_list(&self, _manga: Manga, chapter: Chapter) -> Result<Vec<Page>> {
        let url = format!("{BASE_URL}{}", chapter.key);
        let html = Request::get(url)?
            .header("Referer", &format!("{BASE_URL}/"))
            .header("User-Agent", USER_AGENT)
            .html()?;
        let images = html
            .select(".page.issue figure img")
            .map(|elements| {
                elements
                    .filter_map(|img| {
                        let src = img.attr("abs:src")?;
                        Some(Page {
                            content: PageContent::url(src),
                            ..Default::default()
                        })
                    })
                    .collect::<Vec<Page>>()
            })
            .unwrap_or_default();

        Ok(images)
    }
}
```

---

## 4. Browse Listings (`ListingProvider`)

Allows users to browse standard catalog sections:

```rust title="src/lib.rs"
impl ListingProvider for OceComic {
    fn get_manga_list(&self, listing: Listing, page: i32) -> Result<MangaPageResult> {
        let url = format!("{BASE_URL}/{}/page/{page}", listing.id);
        let html = Request::get(&url)?
            .header("Referer", &format!("{BASE_URL}/"))
            .header("User-Agent", USER_AGENT)
            .html()?;
        Ok(parse_comic_list(html))
    }
}
```

---

## 5. Rich Home Screen Layout (`Home`)

The `Home` trait builds a native home page with horizontal carousels (`Scroller` components):

```rust title="src/lib.rs"
impl Home for OceComic {
    fn get_home(&self) -> Result<HomeLayout> {
        let html = Request::get(BASE_URL)?
            .header("User-Agent", USER_AGENT)
            .html()?;

        let mut components = Vec::new();

        // 1. Popular Comics Scroller
        let popular = html
            .select(".popular .items .item")
            .map(|els| {
                els.filter_map(|el| {
                    let url = el.select_first("h2 a")?.attr("abs:href")?;
                    let title = el.select_first("h2 a")?.text()?;
                    let cover = el.select_first("figure img")?.attr("abs:src");
                    let key = url.strip_prefix(BASE_URL)?;
                    Some(Manga {
                        key: key.into(),
                        title,
                        cover,
                        url: Some(url),
                        ..Default::default()
                    }.into())
                })
                .collect::<Vec<_>>()
            })
            .unwrap_or_default();

        if !popular.is_empty() {
            components.push(HomeComponent {
                title: Some("Popular Comics".into()),
                value: HomeComponentValue::Scroller { entries: popular, listing: None },
                ..Default::default()
            });
        }

        // 2. New Comics & Featured Scrollers
        // (Parsed similarly from .latest and .featured sections)

        Ok(HomeLayout { components })
    }
}
```

---

## 6. Deep Linking & Registration

### Deep Link Handler
When a user opens an `ocecomic.com` link, Aidoku routes it directly into the app:

```rust title="src/lib.rs"
impl DeepLinkHandler for OceComic {
    fn handle_deep_link(&self, url: String) -> Result<Option<DeepLinkResult>> {
        let path = url.strip_prefix(BASE_URL).ok_or(AidokuError::Unimplemented)?;
        let path = path.trim_end_matches(|c: char| c.is_ascii_digit())
            .trim_end_matches("/page/")
            .trim_end_matches("/");
        Ok(Some(DeepLinkResult::Listing(
            Listing { id: path.into(), ..Default::default() }
        )))
    }
}
```

### Registering All Capabilities
At the bottom of `src/lib.rs`, register the struct with all implemented traits:

```rust title="src/lib.rs"
register_source!(OceComic, ListingProvider, Home, DeepLinkHandler);
```

---

## Key Takeaways for Aidoku Development

1. **`abs:href` and `abs:src`**: Automatically resolves relative URLs to full absolute URLs without manual string concatenation.
2. **`send_partial_result`**: Immediately updates the reader UI with manga details while the chapter list is still parsing.
3. **Advanced CSS Selectors**: `aidoku-rs` supports powerful pseudo-classes like `:has(...)` and `:contains(...)`, making parsing adjacent sibling metadata clean and resilient.
