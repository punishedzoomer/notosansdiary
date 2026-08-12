---
title: Getting Started with Raylib in Rust (raylib-rs)
date: 2026-08-12
tags:
  - rust
  - gamedev
  - raylib
  - graphics
---

## Introduction

[Raylib](https://www.raylib.com/) is a lightweight, easy-to-use C library for game programming and graphical application development. For Rust developers looking for a straightforward alternative to heavier engines like Bevy or low-level APIs like `wgpu`, the [raylib-rs](https://github.com/raylib-rs/raylib-rs) crate provides idiomatic Rust bindings over Raylib 5.5.

Unlike raw C wrappers, `raylib-rs` leverages Rust's type system and lifetime guarantees to make GUI rendering thread-safe and panic-free without sacrificing simplicity.

---

## Key Concepts & Rust Safety Idioms

Raylib in C relies on global state and implicit rendering context. In Rust, `raylib-rs` models these safely through two main handles:

1. **`RaylibHandle` (`rl`)**: Manages general Raylib state, window configuration, input polling, and resource loading.
2. **`RaylibThread` (`thread`)**: A zero-sized token enforcing that main-thread GUI operations remain strictly on the thread where the window was initialized.

### The Drawing Scope Pattern

Drawing in `raylib-rs` uses a scoped draw handle pattern:

```rust
let mut d = rl.begin_drawing(&thread);
// All draw operations occur on `d` while it exists
d.clear_background(Color::WHITE);
d.draw_text("Hello, Raylib in Rust!", 12, 12, 20, Color::BLACK);
// Drawing scope ends when `d` drops at the end of the block
```

By requiring `&thread` when calling `begin_drawing()`, Rust guarantees at compile time that rendering calls cannot be dispatched from secondary background threads.

---

## Installation & Setup

### 1. Cargo Dependency

Add `raylib` to your `Cargo.toml`:

```toml
[dependencies]
raylib = "5.7.0"
```

> **Build Prerequisites:** `raylib-rs` compiles C Raylib under the hood using `cmake`, `glfw`, and `curl`. Ensure these utilities are installed on your host environment.

### Platform Notes (Linux & Wayland)

If you are running Linux under Wayland or NixOS, enable the `wayland` feature flag:

```bash
cargo add raylib -F wayland
```

---

## Minimal Example: Bouncing Ball

Here is a complete, working example of a bouncing ball using `raylib-rs`:

```rust
use raylib::prelude::*;

fn main() {
    let screen_width = 800;
    let screen_height = 450;

    let (mut rl, thread) = raylib::init()
        .size(screen_width, screen_height)
        .title("Raylib Rust - Bouncing Ball")
        .fps(60)
        .build();

    let mut ball_pos = Vector2::new(screen_width as f32 / 2.0, screen_height as f32 / 2.0);
    let mut ball_speed = Vector2::new(5.0, 4.0);
    let ball_radius = 20.0;

    while !rl.window_should_close() {
        // Update physics
        ball_pos += ball_speed;

        if ball_pos.x >= (screen_width as f32 - ball_radius) || ball_pos.x <= ball_radius {
            ball_speed.x *= -1.0;
        }
        if ball_pos.y >= (screen_height as f32 - ball_radius) || ball_pos.y <= ball_radius {
            ball_speed.y *= -1.0;
        }

        // Render frame
        let mut d = rl.begin_drawing(&thread);
        d.clear_background(Color::RAYWHITE);

        d.draw_circle_v(ball_pos, ball_radius, Color::MAROON);
        d.draw_text("Bouncing Ball in Rust + Raylib!", 10, 10, 20, Color::DARKGRAY);
    }
}
```

---

## Core Features Overview

### 1. 2D & Primitive Rendering
`RaylibDrawHandle` (`d`) provides simple functions for drawing basic shapes:
- `d.draw_rectangle(x, y, width, height, color)`
- `d.draw_circle(x, y, radius, color)`
- `d.draw_line(start_x, start_y, end_x, end_y, color)`

### 2. Textures & Sprites
Loading images and textures is bound safely to `RaylibHandle`:

```rust
let texture = rl.load_texture(&thread, "assets/character.png")
    .expect("Failed to load texture");

// Inside drawing loop:
d.draw_texture(&texture, x, y, Color::WHITE);
```

### 3. 3D Mode & Cameras
`raylib-rs` includes built-in support for 3D rendering and camera controllers:

```rust
let camera = Camera3D::perspective(
    Vector3::new(0.0, 10.0, 10.0),
    Vector3::new(0.0, 0.0, 0.0),
    Vector3::new(0.0, 1.0, 0.0),
    45.0,
);

let mut d3d = d.begin_mode_3d(&camera);
d3d.draw_cube(Vector3::new(0.0, 0.0, 0.0), 2.0, 2.0, 2.0, Color::BLUE);
d3d.draw_grid(10, 1.0);
```

---

## Summary & When to Use Raylib in Rust

| Library | Best For | Pros | Cons |
| :--- | :--- | :--- | :--- |
| **`raylib-rs`** | Quick 2D/3D games, tools, learning gamedev | Simple API, fast prototyping, zero boilerplate | C dependency (`cmake`), single-threaded render context |
| **`macroquad`** | Pure Rust 2D games, WASM targets | Zero C dependencies, instant web compilation | Less feature-rich 3D support |
| **`bevy`** | Full-fledged AAA / ECS projects | Modular ECS architecture, high performance | Steeper learning curve, larger binary sizes |

`raylib-rs` is an ideal choice when you want a fast, immediate-mode game loop without wrestling complex engine boilerplate.

---

> [!TIP] Resources
> - **GitHub Repository:** [raylib-rs/raylib-rs](https://github.com/raylib-rs/raylib-rs)
> - **Official Raylib Cheatsheet:** [raylib.com/cheatsheet](https://www.raylib.com/cheatsheet/cheatsheet.html)
