# MPlace Hub — instrukcje dla Claude Code

## Stack
- Vanilla JS, jeden plik index.html (~450KB, ~6800 linii)
- Chart.js 4.4.1 + datalabels plugin
- Firebase Firestore + Google OAuth
- GitHub Pages: mplace-bz.github.io/Mplace-Hub/
- Agent proxy: Cloudflare Worker red-haze-5f37mplace-agent.contactmplace.workers.dev

## Model AI
- claude-sonnet-4-6, max_tokens: 4096
- Klucz API: mplace-agent (console.anthropic.com)

## Design System
- DM Mono dla liczb, DM Sans dla tekstu UI
- Tło: #0f1117, Akcent: #ff6b35
- MEBLE=orange, LUXSEN=teal, ONE=purple
- Bez emoji, tylko strzałki i figury geometryczne

## Zasady krytyczne
- Save = saveAllWithSync() NIE saveAll()
- PLAYBOOK_SECTIONS przed openPlaybook()
- Dual-write: localStorage primary, Firebase sync

## Konta
- MEBLE (65%): MobelKap, PerfektCięcie, MeblenaCzasie
- LUXSEN (60%): Luxsen, Semmi, BOTAVIT
- ONE (55%): Materazzi, MtzzEU, Ankado24

## Fee agencji
- MEBLE: 7500 zł netto
- LUXSEN: 20% od marży grupy
- Materazzi+MtzzEU: 3500 zł
- Ankado24: 2900 zł

## Playbook
- 10 sekcji (PD,RM,RA,KP,DT,SE,IA,RC,MC,BA), 100 promptów
- Każdy prompt: id, name, cel, needsKonto, tags, prompt

## Wiedza — kategorie
- slownik (#a78bfa fioletowy), benchmark (żółty), artykul (niebieski), zasady (pomarańczowy/accent)
- klient (#2dd4a0 teal), rynek (#4d9fff niebieski), sezonowosc (#b47fff fioletowy)
- produkt (#f5a623 żółty), casestudy (#e879f9 różowy), rozne (#8b91a8 szary)
- Stara kategoria `inne` zachowana w CAT_LABELS dla wstecznej kompatybilności; nowe wpisy używają `rozne`
