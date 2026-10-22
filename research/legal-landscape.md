# Legal landscape

Author: TrueMan, with Claude (AI agent) · Date: 2026-10-21 · Status: desk research. **This is not legal advice.** Get a qualified opinion before accepting money or distributing builds widely.

## 1. Reverse engineering in the EU
The project lead is based in the EU, so EU law is the main reference.

- **Directive 2009/24/EC, Article 6** allows decompiling a program without the rightholder's permission when it is indispensable to obtain the information needed for an **independently created program to interoperate** with it. Conditions: the person has a right to use the copy, the information is not already readily available, and the work is limited to the parts needed. The information may not be used for other purposes, shared beyond what interoperability needs, or used to make a substantially similar program.
- **CJEU, Top System v Belgian State (C-13/20, 2021):** a lawful user may also decompile to **correct errors**, within what the fix requires and subject to the contract.

**Fit for Joint Operations:** a mod that interoperates with the game, written independently, by people who own the game, fits the spirit of Article 6. It does **not** cover redistributing game files, copying the game's code, or bypassing protection. Our rules already forbid those.

## 2. Konami
- In 2014 Konami shut down two fan remakes of the original *Metal Gear*, in one case after informal approval was withdrawn. Konami has acted against fan projects that **recreate** its games. *(news reports, 2014)*
- No action against MGSV **mods** was found in this research. Large MGSV mods have been public for years.
- **Risk reduction:** stay a mod (requires the original game), never distribute game assets, avoid Konami's logos and online services, keep the "unofficial" disclaimer, and avoid commercial framing.

## 3. Licensing conflict: GPL and the Steamworks SDK
- The Steamworks SDK is proprietary. GPL-licensed programs **cannot link directly** against it, which is why tools such as *steamshim* run Steamworks in a separate process and talk over pipes.
- Our native code would call Steam inside the game process. Under a plain GPL-3.0, that is a likely conflict.
- **Options** (decision for the project lead, see ADR 0005):
  1. **GPL-3.0 with an additional permission** (GPL section 7) allowing linking with the Steamworks SDK and the game. Keeps forks open.
  2. **MPL-2.0:** file-level copyleft. Changes to our files stay open, and combining with proprietary components is allowed.
  3. **MIT:** simplest, but forks could be closed.
- All three satisfy "fork it, but credit us". Options 1 and 2 also keep modified versions open.

## 4. Third-party code
| Project | License | Can we reuse code? |
|---|---|---|
| IHHook | MIT | Yes, with attribution |
| GameNetworkingSockets | BSD-3-Clause | Yes, with attribution |
| Infinite Heaven | none stated; restrictive Nexus terms | No |
| Dynamite | GPL-3.0 with Commons Clause | No (clean-room only) |

## Sources
- [Directive 2009/24/EC, Article 6](https://www.legislation.gov.uk/eudr/2009/24/article/6)
- [SCL: CJEU rules software buyers can decompile to correct errors](https://www.scl.org/12394-court-of-justice-rules-that-software-buyers-can-decompile-programs-to-correct-errors/)
- [Techdirt: Konami shuts down Metal Gear fan remake (2014)](https://archive.techdirt.com/articles/20140819/10425628256/konami-flip-flops-fan-remake-metal-gear-decides-to-shut-it-down.shtml)
- [Siliconera: fan remake project lead on cancellation](https://www.siliconera.com/metal-gear-fan-remake-project-lead-talks-cancellation/)
- [steamshim (GPL and Steamworks workaround)](https://github.com/etfdevs/steamshim)
- [IHHook repository (MIT)](https://github.com/kapuragu/IHHook)
- [Dynamite LICENSE](https://github.com/unknown321/dynamite/blob/master/LICENSE)
