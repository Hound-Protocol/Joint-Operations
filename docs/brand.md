# Brand: Hound Protocol and Joint Operations

Status: v1 · Updated: 2026-10-22 · Owner: Administration

Two marks, one family. **Hound Protocol** is the team. **Joint Operations** is the mod. Every piece is original vector artwork drawn in code (`tools/brand/build_brand.py`). There is no generative AI imagery ([AI Use Policy](guides/HP-POL-002-ai-use-policy.md)).

## The marks
| Mark | Meaning | Files (`site/assets/brand/`) |
|---|---|---|
| **Hound Protocol**: a black hexagon insignia with a white hound in profile, a red inner ring, red eye and red collar | The team: watchful, loyal, organized like a unit. The collar marks a hound that belongs to a unit | `hound-protocol-mark.svg`, `-mono.svg`, `-light.svg`, `-lockup.svg`, `-avatar.png` |
| **Joint Operations emblem** (official logo): three operatives inside a ring of sixteen marks, an orange host marker over the centre operative, the name on the ring | A joint operation: the host and clients, sixteen players | `joint-operations-emblem.svg`, `-emblem-mono.svg`, `-emblem-white.svg`, `-lockup.svg`, `-avatar.png` |
| **Joint Operations mark** (small sizes, favicon): sixteen marks around an orange diamond, with four routes converging | Sixteen players around one host, coming together | `joint-operations-mark.svg`, `-mono.svg`, `-light.svg` |

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
