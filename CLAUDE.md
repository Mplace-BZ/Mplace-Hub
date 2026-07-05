# MPlace Hub — instrukcje dla Claude Code

The marginal cost of completeness is near zero with AI. Do the whole thing. Do it right. Do it with tests. Do it with documentation. Do it so well that Chris is genuinely impressed - not politely satisfied, actually impressed. Never offer to "table this for later" when the permanent solve is within reach. Never leave a dangling thread when tying it off takes five more minutes. Never present a workaround when the real fix exists. The standard isn't "good enough" - it's "holy shit, that's done." Search before building. Test before shipping. Ship the complete thing. When Chris asks for something, the answer is the finished product, not a plan to build it. Time is not an excuse. Fatigue is not an excuse. Complexity is not an excuse. Boil the ocean.

Każda zasada niżej ma WHY — bo zasada bez powodu jest łamana przy pierwszym edge case. Jeśli WHY nie pasuje do twojej sytuacji, nadal stosujesz zasadę i pytasz — nie odwrotnie.

---

## ZANIM NAPISZESZ PIERWSZĄ LINIJKĘ KODU

- **Sprawdź co już istnieje.** Grep po nazwie feature/funkcji zanim zbudujesz cokolwiek nowego (bo już raz zbudowano od zera feature, który istniał 3 miesiące — zmarnowana sesja).
- **index.html ma ~29 500 linii (~1.8MB).** Nigdy nie czytaj całego pliku — szukaj po nazwie funkcji lub numerze linii (bo pełny read zżera kontekst i nic nie wnosi).
- **Jedna zmiana = jedna logiczna rzecz.** Zero "przy okazji poprawię też X" (bo zmiany "przy okazji" psują rzeczy, których potem nikt nie umie cofnąć).
- **Większa zmiana = plan przed implementacją.** Pokaż plan, czekaj na OK Chrisa (bo Chris nie jest programistą — musi zatwierdzić skutki, nie kod).

---

## DRZEWA DECYZYJNE

### 1. Ocena ROAS (gdy analizujesz kampanię / ofertę / raport Ads)

```
Ile dni danych?
├─ < 7 dni → STOP: za mało do decyzji (1-2 transakcje to szum, nie sygnał).
│            Wyjątek: koszt dzienny > 30 zł na ofercie BEZ transakcji → wyłącz od razu.
└─ ≥ 7 dni → policz BE ROAS = 1 / (marża / 100)   [poniżej BE każda złotówka Ads = strata]
    ├─ ROAS < 3         → wyłącz kampanię natychmiast
    ├─ ROAS < BE        → tnij budżet 50%, obserwuj 7 dni
    ├─ BE ≤ ROAS ≤ BE+2 → zostaw, monitoruj
    ├─ ROAS > BE+2      → można skalować
    └─ ROAS > 10        → skaluj agresywnie (rzadkie okno — nie zwlekaj)
```
- Decyzje SKALUJ / KANIBALIZACJA / WYKLUCZ wymagają **min. 3 transakcji** (mniej = losowość, nie trend).
- BE ROAS licz zawsze z `calc()` per konto — nigdy hardcoded (marże się zmieniają, hardcode gnije).
- Budżet = **cap, nie cel**. 100% wydania to limit bezpieczeństwa, nie target do "dowiezienia".

### 2. Podejrzenie kanibalizacji cross-account (grupa MEBLE)

```
Identyczny wariant produktu na 2-3 kontach?
└─ TAK → różnica ROAS między kontami > 1.5?
    ├─ TAK → kanibalizacja: konto z wyższym ROAS = lider (zostaje z Ads),
    │        pozostałe konta: wyłącz Ads na tej ofercie, ZOSTAW organikę i wyróżnienia
    └─ NIE → obserwuj, nie ruszaj (różnica < 1.5 może być szumem)
```
- **Wyróżnienie ≠ Ads.** Wyróżnienie = organika (fee platformowe), Ads = CPC. Niski ROAS Ads NIE jest powodem wyłączania wyróżnień (dwa osobne kanały — raz je pomylono i kosztowało to sprzedaż organiczną).
- Smart dostawa konwertuje **4-7x wyżej** niż DPD 2/3 paczki — przy analizie konwersji MEBLE najpierw sprawdź typ dostawy, zanim obwinisz Ads albo cenę.

### 3. Debugowanie (gdy Chris zgłasza bug)

```
1. ZMIERZ stan narzędziem (curl / test / console.log) — nie zgaduj z pamięci.
2. Grep całego pliku: znajdź WSZYSTKIE wystąpienia wzorca, nie tylko zgłoszone miejsce
   (załatanie 1 z 5 miejsc = ten sam bug wraca za tydzień — sprawdzone boleśnie).
3. Napraw wszystkie wystąpienia naraz.
4. ZWERYFIKUJ POMIAREM po zmianie ("powinno działać" ≠ dowód).
5. Zmiana dotykała SSE/stream/fetch? → ręcznie sprawdź czy Agent odpowiada,
   ZANIM zrobisz kolejną zmianę (regresja Agenta wykryta po 3 commitach = 3x dłuższy rollback).
6. 2-3 nieudane próby → STOP: opisz co próbowałeś i zapytaj Chrisa
   (szósta próba na ślepo psuje więcej niż naprawia).
```

### 4. Zapis danych (gdy kod ma coś persystować)

```
Gdzie ma trafić dana?
├─ Dane użytkownika Huba (rows, decyzje, notatki, ustawienia)
│   → saveAllWithSync() — NIGDY saveAll()
│     (saveAll() pisze tylko do localStorage bez Firebase → dane ZNIKAJĄ przy
│      logowaniu z innego urządzenia; Chris pracuje z kilku — to był realny data loss)
│   → architektura: dual-write — localStorage primary, Firebase sync layer
├─ Nowy feature z własnym stanem
│   → musi mieć sync do Firestore; localStorage-only = bug z definicji
│     (zasada globalności: WSZYSTKO dostępne na każdym urządzeniu po zalogowaniu)
├─ Publiczne artefakty (prezentacje, podcasty)
│   → publicPresentations / publicPodcasts: read publiczny, write auth + ownerUid
│     (rules odrzucają write bez ownerUid — cichy fail bez tego pola)
└─ Ścieżka danych usera: /users/{userId}/{document=**}  (NIE allegro_users — stara,
   nieistniejąca ścieżka; pisanie tam = dane w próżnię)
```
- Flaga `_fsLoaded`: NIE usuwaj (onAuthStateChanged strzela wielokrotnie — to normalne zachowanie Firebase, nie bug; bez flagi drugi strzał nadpisuje świeże dane starymi z poprzedniej sesji).
- Nie modyfikuj logiki zapisu bez wyraźnej instrukcji Chrisa (to najbardziej krucha część systemu).

---

## STREFY ZAKAZANE — jeśli działa, NIE DOTYKAJ

### Agent / Cloudflare Worker / SSE
- Worker URL: `https://red-haze-5f37mplace-agent.contactmplace.workers.dev`
- Worker **zawsze** zwraca SSE (`text/event-stream`). NIE zastępuj SSE readera przez `response.json()` (json() czeka na koniec streamu, który nigdy nie przychodzi → UI wisi na zawsze; ta wpadka kosztowała pełną sesję debugowania).
- NIE modyfikuj funkcji fetch do Workera ani obsługi stream readera / chunks / `delta.text`.
- Jeśli Agent działa → kod fetch/stream/Worker jest poza zakresem KAŻDEGO refactoru, nawet "kosmetycznego".

### Playbook
- `PLAYBOOK_SECTIONS` zdefiniowane PRZED `openPlaybook()` (const nie hoistuje się jak function declaration — funkcja dostaje undefined i Playbook pada po cichu).
- Nie skracaj promptów — wszystkie 100 w pełnej treści (skrócony prompt = gorszy output Agenta w produkcji, a widać to dopiero w złym raporcie u klienta).

### Print CSS
- `@media print` — nie modyfikuj nigdy, bez wyjątków (drukowane raporty idą do klientów; regresja wychodzi dopiero u klienta, gdzie już nie ma undo).

### Autopilot (Agent 2.0 — dane wpisują się SAME od v9.83)
- Silnik: `/Users/chrismac/MPlace-Agent/tools/hub-sync.mjs` (`--daily`) + `ads-inbox.mjs`; launchd `com.mplace.director`: 9:00 + refresh 13:30/19:30 + inbox-ads co 15 min.
- Pisze do Firestore: `accounts/{k}.rows` (rynek PL), `sync/mebleGlobal` (MEBLE multi-market), `sync/d2d` (snapshoty dzienne), `sync/hubPending` (baner w zakładce Data).
- NIE RUSZAĆ markerów: note `⚙ Auto API…` i `_src:'autopilot'` (jedyny guard odróżniający wpisy ręczne od automatu — bez nich merge nadpisze ręczną pracę Chrisa).
- Merge policy: `roas`/`wartoscAds`/`ss`/`qlt`/notatki ręczne NIETYKALNE; `adsCost = max(screen, billing)`.
- `commission` = prowizja BAZOWA; prowizja od ofert wyróżnionych → `promoC` (wyróżnienia).
- Waluty: PLN → pola główne; CZK/EUR/HUF → global/notatka. NIGDY nie mieszać (suma CZK+PLN w jednym polu = fałszywe metryki we wszystkich raportach w dół strumienia).
- ROAS + wartość Ads: TYLKO ze screena (Hub OCR slot 2 lub folder `MPlace-Agent/inbox-ads/`) — API nie daje tych wartości wiarygodnie.
- Dokumentacja + rollback: `/Users/chrismac/MPlace-Agent/docs/HUB-AUTOPILOT.md` · tag `safe-v9.81-preautomat`.

---

## GDY PARSUJESZ XLSX / KARMISZ AGENTA DANYMI — anti-halucynacja

Historia wpadki: parser nie znajdował ID oferty, Agent "zgadywał" numerki i raporty z wymyślonymi ID poszły do klientów. Stąd zasady:

- Parser MUSI czytać WSZYSTKIE pozycje z XLSX, nie top 10 (obcięte dane = Agent wnioskuje z niepełnego obrazu, a brzmi równie pewnie).
- Parser MUSI wyciągać ID oferty z KAŻDEGO typu pliku (Ads, Odwiedziny, Sprzedaż).
- Brak kolumny → loguj WARNING i przekaż `[ID:brak]` do Agenta — nigdy pusto, nigdy zmyślone.
- Agent NIGDY nie wymyśla ID, nazw ani liczb. Brak danych → "BRAK — wymaga sprawdzenia kodu/danych". Lepiej odmówić niż skłamać.
- Po KAŻDEJ zmianie parsera → test end-to-end czy ID i liczby realnie docierają do kontekstu Agenta ("parser zwraca obiekt" to nie dowód; ten bug wracał wielokrotnie).
- DOMPurify / `esc()` na WSZYSTKICH danych z XLSX i na `err.message` przed wstawieniem do DOM (XSS przez arkusz Excel to realna, załatana podatność — nie otwieraj jej ponownie).
- Wartości PLN: helper `pln()` — stripuje "PLN", zamienia `,` na `.`, obsługuje separatory tysięcy.

---

## GDY GENERUJESZ RAPORT / PREZENTACJĘ / OUTPUT AGENTA

- **Agent zwraca JSON, JS renderuje HTML.** Nigdy markdown template z Agenta (markdown = niespójny format, zero interaktywności, brak clickable buttonów; tę architekturę już raz cofnięto — nie wracaj do niej).
- Każdy raport MUSI mieć pasek przycisków: Kopiuj / Drukuj / Pobierz .html (standard rozszerzony: + Email / Zapisz / Screener) — bez nich Chris nie ma jak użyć raportu w pracy z klientem.
- Skróty (BE ROAS, ACoS, EOM, MTD): przy pierwszym użyciu pełna nazwa w nawiasie (Chris zna, klienci nie).
- Zero emoji w treściach klienckich; w UI Huba tylko strzałki (↑↓→) i figury geometryczne. Wyjątek: raporty Total Restart mogą mieć emoji priorytetów/sekcji.
- Zero długich kresek (—) w widocznej treści klienckiej — zawsze krótka (-). Linki tylko zweryfikowane (HTTP 200), nigdy z pamięci.

### Slide Report (prezentacje klienckie)
- Flow: `runSlideReport()` → Claude API → `openSlideWindow()` → `sharePresentation()` → `view.html`.
- `SLIDE_REPORT_PROMPT` = struktura 12-16 slajdów (tezy, hero numbers, puenty).
- Dashboard slide (`buildDashboardSlide`) = czysty HTML/CSS, NIGDY Canvas/Chart.js (Canvas.outerHTML to pusty tag bez rysunku — Firebase przechowuje HTML, nie DOM, więc wykres znika w view.html).
- Tabela m/m (`buildMoMTable`) = bieżący vs poprzedni miesiąc.
- Oba bloki MUSZĄ mieć `class="slide-block"` (bez tego `sharePresentation()` pomija je po cichu — slajd znika bez żadnego błędu).
- Plan działań: kolumny "Działanie | Konto | Oczekiwany efekt" — BEZ "Właściciel", BEZ "Termin".
- `view.html` = publiczny viewer: ładuje gotowy HTML z `publicPresentations`, zero JS renderowania (wszystko co ma być widoczne musi być zserializowanym HTML-em w momencie share).

---

## GDY KOŃCZYSZ ZMIANĘ — deploy workflow (obowiązkowy, w tej kolejności)

1. **Bump wersji** przy KAŻDYM commicie do index.html: title + topbar + print footer (szukaj `"v9."` replace_all) — numer w topbarze to jedyny sygnał dla Chrisa, że deploy zaszedł.
2. **Commit + push + merge do `main`** — GitHub Pages serwuje TYLKO z `main`; push na `redesign` lub inny branch = Chris nie widzi NIC (wygląda, jakby praca nie została zrobiona).
3. **Odpowiedź po pushu zaczynaj od `**vX.XX**`** — sygnał "jest live". Zero wyjątków.
4. Zmiana w okolicach SSE/stream → ręczny test Agenta PRZED zgłoszeniem "gotowe".
5. Deploy do infrastruktury klienta (WP/Shopify/produkcja) = pokaż diff + czekaj na jawne "OK" Chrisa W TEJ rozmowie (wcześniejsze "zrób to" ≠ approve). Po deployu wyczyść cache i sprawdź live.

---

## DOMYŚLNA LOGIKA BIZNESOWA (decyzje, które podejmujesz bez pytania)

- BE ROAS = `1 / (marża_przed / 100)` — break-even; poniżej = reklama przynosi stratę.
- Próg alarmu Ads: koszt dzienny > 30 zł na ofertę bez transakcji (10% średniego koszyka 300 zł) → wyłącz.
- Próg wyróżnień: max 5% wartości sprzedaży danego konta.
- Dynamic CPC = domyślna strategia Allegro Ads: 7 dni nauki, widełki 0.80-1.50 zł.
- Podział decyzji: techniczne (wersje, biblioteki, architektura) → ty, tłumaczone Chrisowi po skutkach; biznesowe (koszty, klienci, publikacje) → ZAWSZE Chris.
- NIE wymyślaj faktów o kliencie (ceny, polityki zwrotów, obietnice, tytuły) — każde takie zdanie wymaga źródła lub potwierdzenia Chrisa.

---

## FAKTY O SYSTEMIE (referencja — sprawdź tu zamiast zgadywać)

### Stack
- Vanilla JS, jeden plik `index.html` (~1.8MB, ~29 500 linii).
- Chart.js 4.4.1 + datalabels · SheetJS XLSX 0.18.5 (ostatnia wersja MIT — nie podbijaj, nowsze mają inną licencję) · DOMPurify 3.4.8 + marked.js 9.1.6 · Firebase 11.10.0 (Firestore + Google OAuth).
- Hosting: GitHub Pages `mplace-bz.github.io/Mplace-Hub/` (serwuje z `main`).
- Wszystkie CDN z SRI sha384 (`integrity=` + `crossorigin=anonymous`) — nowa biblioteka bez SRI = regresja bezpieczeństwa po audycie v9.86.

### Model AI
- `claude-sonnet-4-6`, klucz `mplace-agent` (console.anthropic.com), Worker obsługuje vision (base64 images w `content[]`).
- max_tokens wg feature: 512 Smart Search · 1024 Voice/Decision JSON · 2048 Podcast · 4096 Screener std · 8192 Analizy/Kanibalizator/Cockpit · 16384 Cockpit/CA Architect/Screener pełny. Nie podnoś "na zapas" (koszty), nie obniżaj (ucięty JSON psuje renderer).

### Design System
- DM Mono = liczby, DM Sans = tekst UI. Tło `#0f1117`, akcent `#ff6b35`.
- Grupy: MEBLE=orange `#ff6b35`, LUXSEN=teal `#2dd4a0`, ONE=purple. Ciemne tło, minimalistycznie.

### Konta i fee
- MEBLE (65%): MobelKap (MK), PerfektCięcie (PC), MeblenaCzasie (MnC = benchmark efektywności grupy) — fee 7500 zł netto stałe.
- LUXSEN (60%): Luxsen, Semmi, BOTAVIT — fee 20% od marży grupy (brutto→netto /1.23).
- ONE (55%): Materazzi + MtzzEU (3500 zł stałe), Ankado24 (2900 zł stałe).

### Konwencje danych
- Dane wpisywane brutto; dzień N = dane za dzień N-1.
- EOM projection tylko dla bieżącego miesiąca (zamknięte miesiące = dane rzeczywiste — projekcja na zamkniętym = fałszowanie historii).
- Historia: najnowszy miesiąc po lewej, najstarszy po prawej.
- Konwencja nazw kampanii Ads: Format A v2 — `/NNN/ KAT_LINIA` + `[KONTO][NNN][WW][RW]`.

### Zakładki (parametry parserów i flow)
- **Analiza**: 3 XLSX per konto — Ads (sheet `Statystyki*`), Sprzedaż (`Odwiedziny wg ofert`), Konwersja (`Wg ofert` — NIE "Odwiedziny wg ofert", łatwo pomylić i parser czyta zły arkusz). Opcjonalnie Ads 30d jako kontekst historyczny (zapobiega false positives z krótkich okresów). Parser: `aaParseFile()` + `findSheet()`. Prompt 8 sekcji: Diagnoza, Zatrzymaj, Tnij, Skaluj, Kanibalizacja, Martwe punkty, Placement, Plan. Szablony uwag + historia: localStorage (`aaHistory`, ostatnie 20).
- **Kanibalizator**: 9 XLSX (3 typy × 3 konta MEBLE). Matchowanie produktów po nazwie oferty (25 znaków). Wyróżnienia: textarea per konto, auto-save do localStorage. Prompt 6 sekcji: Diagnoza, Liderzy, Wyłącz, Wyróżnienia, Budżet, Plan.
- **Screener**: chat multi-turn z pełną historią konwersacji + paste screenshotów (Ctrl+V, multi-image, resize do 1024px, base64 w `content[]`). Kopiuj/Drukuj/HTML pod każdą odpowiedzią.
- **Cockpit (▶)**: 3 kroki — Data → Upload XLSX (Ads + Sprzedaż + Konwersja + Ads 30d per konto) → Agent generuje JSON z 23 zadaniami (PILNE/WAŻNE/INFO). Karty z checkboxami, progress bar, streak, timer. Cache dzienny, done state persistent.
- **Playbook**: 10 sekcji (PD,RM,RA,KP,DT,SE,IA,RC,MC,BA), 100 promptów; pola: id, name, cel, needsKonto, tags, prompt. Klik promptu bez konta = natychmiastowe wysłanie do Agenta; z kontem = dropdown + Uruchom.

### Wiedza — kategorie
- slownik `#a78bfa` · benchmark żółty · artykul niebieski · zasady accent · klient `#2dd4a0` · rynek `#4d9fff` · sezonowosc `#b47fff` · produkt `#f5a623` · casestudy `#e879f9` · kalendarz `#f97316` · rozne `#8b91a8`.
- Stara kategoria `inne` zostaje w `CAT_LABELS` (usunięcie łamie stare wpisy — wsteczna kompatybilność); nowe wpisy używają `rozne`.

### Firebase Rules
- Dane usera: `/users/{userId}/{document=**}` (NIE `allegro_users`).
- `publicPresentations` / `publicPodcasts`: read publiczny, write wymaga auth + `ownerUid`.
