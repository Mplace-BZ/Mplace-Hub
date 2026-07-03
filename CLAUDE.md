# MPlace Hub — instrukcje dla Claude Code

The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that Chris is genuinely impressed - not politely satisfied, actually impressed. Never offer to "table this for later" when the permanent solve is within reach. Never leave a dangling thread when tying it off takes five more minutes. Never present a workaround when the real fix exists. The standard isn't "good enough" - it's "holy shit, that's done." Search before building. Test before shipping. Ship the complete thing. When Chris asks for something, the answer is the finished product, not a plan to build it. Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse. Boil the ocean.

## ⚙ AUTOPILOT (Agent 2.0) — dane wpisują się SAME od v9.83
- Silnik: /Users/chrismac/MPlace-Agent/tools/hub-sync.mjs (--daily) + ads-inbox.mjs
- Cron (launchd com.mplace.director): 9:00 + refresh 13:30/19:30 + inbox-ads co 15 min
- Pisze do Firestore: accounts/{k}.rows (rynek PL), sync/mebleGlobal (MEBLE multi-market),
  sync/d2d (snapshoty dzienne), sync/hubPending (baner w zakładce Data)
- NIE RUSZAĆ markerów: note "⚙ Auto API…" i _src:'autopilot' — to guard ręczne-vs-auto
- Merge policy: roas/wartoscAds/ss/qlt/notatki ręczne NIETYKALNE; adsCost=max(screen,billing)
- Konwencja: commission = prowizja BAZOWA; prowizja od ofert wyróżnionych → promoC (wyróżnienia)
- Waluty: PLN→pola główne; CZK/EUR/HUF→global/notatka — NIGDY nie mieszać walut
- ROAS + wartość Ads: TYLKO screen (Hub OCR slot 2 lub folder MPlace-Agent/inbox-ads/)
- Dokumentacja + rollback: /Users/chrismac/MPlace-Agent/docs/HUB-AUTOPILOT.md · tag safe-v9.81-preautomat

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
- Vanilla JS, jeden plik index.html (~776KB, ~12200 linii)
- Chart.js 4.4.1 + datalabels plugin
- SheetJS (XLSX 0.18.5) — parsowanie plików Excel
- Firebase Firestore + Google OAuth
- GitHub Pages: mplace-bz.github.io/Mplace-Hub/
- Agent proxy: Cloudflare Worker red-haze-5f37mplace-agent.contactmplace.workers.dev

## Model AI
- claude-sonnet-4-6
- max_tokens: 4096 (Agent/Raport), 8192 (Prezentacja/Analiza/Kanibalizator)
- Klucz API: mplace-agent (console.anthropic.com)
- Worker obsługuje vision (base64 images w content[])

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

## KRYTYCZNE — Anti-halucynacja Agenta i parserów
- Parser MUSI czytać WSZYSTKIE pozycje z pliku XLSX (nie top 10)
- Parser MUSI wyciągać ID oferty z KAŻDEGO typu pliku (Ads, Odwiedziny, Sprzedaż)
- Jeśli parser nie znajduje kolumny → loguj WARNING, przekaż "[ID:brak]" do Agenta
- Agent NIGDY nie wymyśla IDs, nazw, ani danych liczbowych
- Jeśli Agent nie ma danych → pisze "BRAK — wymaga sprawdzenia kodu/danych"
- Agent NIE generuje raportu z wymyślonymi danymi — lepiej odmówić niż skłamać
- Po każdej zmianie parsera → TESTUJ czy dane docierają do kontekstu Agenta
- Ten problem już występował wielokrotnie — ZAWSZE sprawdzaj czy ID trafia do kontekstu

## Konta
- MEBLE (65%): MobelKap, PerfektCięcie, MeblenaCzasie
- LUXSEN (60%): Luxsen, Semmi, BOTAVIT
- ONE (55%): Materazzi, MtzzEU, Ankado24

## Strategia Portfela MEBLE (26.04.2026)
- 3 konta, 1 asortyment producenta mebli: 899 ofert, 22 kategorie, 3 pomieszczenia
- 16 z 22 kategorii (73%) = pełne nakładanie → wszystkie konta licytują na te same SKU
- Szacowane przepalanie z kanibalizacji: 3 750–5 600 zł/mies (45–67 tys. zł rocznie)
- Narzut CPC z wewnętrznej konkurencji: 20–40%

### Metryki kwiecień 2026
- MK: ROAS 7.37 vs BE 6.38 → +0.99 ✓ (jedyny zdrowy)
- PC: ROAS 5.18 vs BE 7.14 → −1.96 ✗ (27% straty)
- MnC: ROAS 5.74 vs BE 7.62 → −1.88 ✗ (25% straty)
- MnC marża 7.3% (historycznie 10–14%) — pricing premium +2.5% ale marża nie pokrywa

### Ownership kategorii (docelowy)
- MK (9 kat, 41%): premium łazienka + KARO92/TOP92/T-BOX92/KARO92_DOUBLE + lustro + słupki
- PC (7 kat, 32%): cała florystyka (8 serii doniczek) + unikalne (witryny/RTV/stoły barowe/ławki/budżet RICO/Angi/KORA)
- MnC (6 kat, 27%): wolumen stoliki mid-range (KARO65/KAJA61/KAJA91/LARA/MAJA/KARO68_DOUBLE)
- Reszta = organika only (owner ma Ads, pozostałe konta wyłączają Ads w danej kategorii)

### Linie produktowe
- KARO: hero linia, 8 kategorii, 169–1320 zł
- KAJA: komplementarna salon, 3 kat
- TOP/T-BOX: premium feature (mechanizm podnoszenia)
- PRALKA/COMBO/SLIM: hero łazienki, 519–579 zł
- KORA/RICO/Angi: niche budżetowe (unikalne PC)

### Sezonowość
- Kwiecień–maj: PEAK doniczki (Dzień Matki 26.05), stoliki podnoszone start, łazienka
- PC ma 90 ofert doniczek vs MnC 25 vs MK 35 + unikalne serie D/M/DUO
- Wrzesień–grudzień: stoliki podnoszone PEAK, witryny/RTV Q4

### Plan wdrożenia (5 faz, 35 dni)
- FAZA 0 (do 28.04): data audit — ceny MK, weryfikacja cen MnC, eksport overlap fraz
- FAZA 1 (29.04–02.05): stop-loss — PC/MnC wyłączają Ads na kategoriach nie-swoich
- FAZA 2 (03–10.05): ownership handoff — nowe kampanie per owner + wykluczenia fraz
- FAZA 3 (11–25.05): monitoring & tuning — daily ROAS check, CPC 0.80–1.50 zł
- FAZA 4 (26–31.05): Dzień Matki + post-mortem
- Kryterium końcowe: ROAS > BE na każdym koncie, 0 overlap fraz, doniczki PC +50% MoM

### Luki danych (TASK 0)
- Ceny MK = 0 zł (brak danych, do pobrania z Allegro API/CSV)
- Pricing MnC KARO65=177 vs PC 199 — paradoks (premium globalnie, tańszy lokalnie)
- Brak raportu overlapping fraz (szacunek 20–40% z bazy wiedzy)
- Brak transakcji per kategoria i marży per kategoria

### Kluczowe zasady strategii
- Stop-loss PRZED segmentacją (kolejność: stop-loss → segmentacja → re-skalowanie)
- Sama segmentacja kanibalizacji NIE naprawi ROAS — problem jest głębszy (marża)
- MnC re-pozycjonowanie: z PREMIUM na WOLUMEN/ORGANIKA (stoliki mid-range)
- Doniczki PC = pewny win (priorytet P0, wdrożenie do 30.04)

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
- produkt (#f5a623 żółty), casestudy (#e879f9 różowy), kalendarz (#f97316 pomarańczowy), rozne (#8b91a8 szary)
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

## Analiza Ofert (zakładka Analiza)
- Upload 3 XLSX per konto: Ads (Statystyki), Sprzedaż (Odwiedziny wg ofert), Konwersja (Wg ofert)
- Opcjonalnie: Ads 30d jako kontekst historyczny (zapobiega false positives z krótkich okresów)
- Parser: aaParseFile() z findSheet() — szuka zakładek po nazwie Allegro
  - Ads → sheet "Statystyki*"
  - Sprzedaż → sheet "Odwiedziny wg ofert"
  - Konwersja → sheet "Wg ofert" (nie "Odwiedziny wg ofert")
- Wartości PLN: pln() helper stripuje "PLN", zamienia , na ., obsługuje separatory tysięcy
- BE ROAS obliczany per konto z calc() — nie hardcoded
- Prompt 8 sekcji: Diagnoza, Zatrzymaj, Tnij, Skaluj, Kanibalizacja, Martwe punkty, Placement, Plan
- Szablony uwag: localStorage, persistent
- Historia analiz: localStorage (aaHistory), ostatnie 20

## Kanibalizator (zakładka Kanibalizator)
- 9 plików XLSX (3 typy × 3 konta MEBLE: MK, PC, MnC)
- Matchowanie produktów po nazwie oferty (25 znaków)
- Wyróżnienia: textarea per konto, auto-saved do localStorage
- Tabela HTML: produkt × konta z kolorowaniem (lider/tnij)
- AI prompt 6 sekcji: Diagnoza, Liderzy, Wyłącz, Wyróżnienia, Budżet, Plan
- Historia + persistent wyróżnienia

## Screener (zakładka Screener)
- Chat z Agentem + paste screenshotów (multi-image, Ctrl+V)
- Vision: obrazki resize do 1024px, base64 w content[]
- Multi-turn: pełna historia konwersacji
- Kopiuj/Drukuj/HTML pod każdą odpowiedzią

## Cockpit (Play button ▶)
- 3-krokowy workflow: Data → Upload XLSX → 23 zadań
- Agent generuje JSON z 23 zadaniami (PILNE/WAŻNE/INFO)
- Karty z checkboxami, progress bar, streak, timer, Did You Know
- Cache dzienny, done state persistent
- Upload per konto: Ads + Sprzedaż + Konwersja + Ads 30d (kontekst)

## Wersjonowanie
- KAŻDY commit do index.html = bump wersji (title + topbar + print footer)
- Szukaj "v9." replace_all=true
- Odpowiedź po pushu zaczynaj od **vX.XX**

## Generowanie komend
- Jedna komenda CC = jedna logiczna zmiana
- Podawaj zawsze nazwę funkcji lub numer linii — nie każ CC czytać całego pliku
- Po każdej zmianie SSE/stream — sprawdź czy Agent nadal działa przed kolejną zmianą

## Praca z plikiem
- index.html ma ~12200 linii
- Zawsze podawaj numer linii lub nazwę 
  funkcji zamiast czytać cały plik