# Brand: Hound Protocol and Joint Operations

Status: v1 · Updated: 2026-10-23 · Owner: Administration

Two marks, one family. **Hound Protocol** is the team. **Joint Operations** is the mod. Every piece is original vector artwork drawn in code (`tools/brand/build_brand.py`). There is no generative AI imagery ([AI Use Policy](guides/HP-POL-002-ai-use-policy.md)).

## The marks
| Mark | Meaning | Files (`site/assets/brand/`) |
|---|---|---|
| **Hound Protocol**: a geometric hound face over a red slash, with HOUND / PROTOCOL beneath (lockup) | The organization: watchful, sharp, organized like a unit | `hound-protocol-mark.svg` (no name), `hound-protocol-lockup.svg` (with name), each with `-mono` and `-light`; `hound-protocol-avatar.png` |
| **Joint Operations badge**: a unit shield with an orange JOINT OPS band and a sixteen-point star around the orange host diamond | Sixteen players around one host | `joint-operations-mark.svg`, `-mono`, `-light`, `-white`; `joint-operations-avatar.png` |
| **Joint Operations wordmark**: J, the star inside the O, speed bars, the full name and "up to 16 operatives" | The project's name in full | `joint-operations-lockup.svg`, `-mono`, `-light` |
| **Background scene**: saluting operatives and their commander | Kept in the brand files; not used on the website now (the main menu shows the faint Joint Operations badge) | `joint-operations-salute.svg` |

All marks are drawn in code (`tools/brand/logos.py`, `salute.py`) in the style of unit insignia, with our own shapes. They are not modeled on any Konami logo.

Also: `site/assets/img/favicon.svg` (simplified mark for small sizes) and `site/assets/img/og.png` (link previews and the README banner).

## Colors
| Name | Hex | Use |
|---|---|---|
| Field white | `#e9edee` | Marks and text on dark, both brands |
| Ops orange | `#f28c28` | **Joint Operations**: the host marker, inner ring and accents. Joint Operations is orange and white |
| Hound red | `#d0303a` | **Hound Protocol**: the inner ring, eye and collar. Hound Protocol is white, black and red |
| Night | `#0b0e10` | Backgrounds, and the Hound Protocol insignia field |
| Paper | `#f3efe6` | Light backgrounds (use the `-light` files) |
| Site gold | `#c9a24a` | The website's interface accent only, not the logos |
| Keycard colours | LV1 `#8b9599` · LV2 `#c9d0d2` · LV3 `#7fbf8a` · LV4 `#5aa7d6` · LV5 `#f28c28` · LV6 `#e0453f` · LV7 `#d4ae52` | Keycards and clearance labels on the website |
| Document classes | Policy `#b02a22` · Procedure `#1d6a8a` · Guide `#a86f00` | Handbook sheets and their type stripes |

Type: **Barlow Semi Condensed** (light, wide letter-spacing, uppercase) for names. **Share Tech Mono** for labels. Both are licensed under the SIL Open Font License.

## Use
- Keep clear space around a mark equal to a quarter of its width.
- On light backgrounds use the `-light` files. On photos use the `-mono` files in one color.
- Keep each brand in its own colors: never put Hound red on the Joint Operations marks or Ops orange on the Hound Protocol mark.
- Never stretch, rotate, recolor beyond the palette, add effects, or redraw the hound.
- Discord server icon and GitHub organization avatar: `hound-protocol-avatar.png`. Mod and release artwork: `joint-operations-avatar.png`.

## Inspired by, never imitating
We take the *feel* of tactical espionage games (insignia, radar, field manuals) and make our own marks. Rules, from the [Clean-Room and IP Policy](guides/HP-POL-003-clean-room-and-ip.md):
- **No** Konami logos, typefaces, characters, emblems or recognizable game UI.
- **No** fox heads, skulls with wings, diamonds containing dogs, or other elements that echo existing in-game unit emblems. The hound and the diamond stay in separate marks.
- **No** game screenshots or game art in our branding.
- "Metal Gear Solid V" is used only in plain text to say what the mod works with, next to the unofficial disclaimer.
- When in doubt, ask Administration before publishing.

## Rebuilding
```
python3 tools/brand/build_brand.py
```
The PNGs (avatars, `og.png`) are rendered from `tools/brand/render.html` in a browser at 1200 × 630 and 512 × 512.
