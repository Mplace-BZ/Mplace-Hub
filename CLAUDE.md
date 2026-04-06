# MPlace Hub — instrukcje dla Claude Code

## ⚠️ KRYTYCZNE ZASADY — CZEGO NIE RUSZAĆ

### Agent / Cloudflare Worker / SSE
- NIE modyfikuj funkcji fetch wysyłającej zapytania do Cloudflare Worker
- NIE zmieniaj obsługi odpowiedzi SSE (stream reader, chunks, delta.text)
- NIE zastępuj SSE readera zwykłym response.json()
- Worker URL: https://red-haze-5f37mplace-agent.contactmplace.workers.dev
- Worker zawsze zwraca SSE (text/event-stream) — kod MUSI to obsługiwać
- Jeśli Agent działa poprawnie → nie dotykaj kodu fetch/stream/Worker

### Zapis danych
- Save = zawsze saveAllWithSync() — nigdy saveAll()
- Nie modyfikuj logiki zapisu bez wyraźnej instrukcji

### Firebase
- Flaga _fsLoaded — nie usuwaj, chroni przed nadpisaniem świeżych danych
- onAuthStateChanged może strzelać wielokrotnie — to normalne, nie "naprawiaj"

### Print CSS
- Nigdy nie modyfikuj @media print — bez wyjątków

### Playbook
- PLAYBOOK_SECTIONS musi być zdefiniowany PRZED funkcją openPlaybook()
- Nie skracaj promptów — wszystkie 100 musi być zachowane w pełnej treści

## Stack
- Vanilla JS, jeden plik index.html (~637KB, ~9800 linii)
- Chart.js 4.4.1 + datalabels plugin
- Firebase Firestore + Google OAuth
- GitHub Pages: mplace-bz.github.io/Mplace-Hub/
- Agent proxy: Cloudflare Worker red-haze-5f37mplace-agent.contactmplace.workers.dev

## Model AI
- claude-sonnet-4-6
- max_tokens: 4096 (Agent/Raport), 8192 (Prezentacja slajdowa)
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

## Zasada debugowania
- Przed naprawą błędu — znajdź WSZYSTKIE 
  wystąpienia problemu w całym pliku
- Nigdy nie łataj jednego miejsca bez 
  sprawdzenia czy problem nie istnieje gdzie indziej

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

## Prezentacje klienckie (Slide Report)
- Flow: runSlideReport() → Claude API → openSlideWindow() → sharePresentation() → view.html
- SLIDE_REPORT_PROMPT definiuje strukturę 12-16 slajdów (tezy, hero numbers, puenty)
- Dashboard slide (buildDashboardSlide) = czysty HTML/CSS — NIE Canvas/Chart.js
  (Canvas nie serializuje się do outerHTML, więc znika w view.html)
- Tabela m/m (buildMoMTable) = porównanie bieżący vs poprzedni miesiąc
- Oba muszą mieć class="slide-block" — bez tego sharePresentation() je pomija
- Plan działań: kolumny "Działanie | Konto | Oczekiwany efekt" (BEZ "Właściciel", BEZ "Termin")
- Skróty (BE ROAS, ACoS, EOM, MTD) — przy pierwszym użyciu pełna nazwa w nawiasie
- view.html = publiczny viewer, ładuje HTML z Firebase publicPresentations — zero JS renderowania

## Firebase Rules
- Ścieżka danych: /users/{userId}/{document=**} (NIE allegro_users)
- publicPresentations: read publiczny, write wymaga auth

## Generowanie komend
- Jedna komenda CC = jedna logiczna zmiana
- Podawaj zawsze nazwę funkcji lub numer linii — nie każ CC czytać całego pliku
- Po każdej zmianie SSE/stream — sprawdź czy Agent nadal działa przed kolejną zmianą

## Praca z plikiem
- index.html ma ~9800 linii
- Zawsze podawaj numer linii lub nazwę 
  funkcji zamiast czytać cały plik