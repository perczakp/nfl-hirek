# NFL Fantasy Projekt — PROJECT STATE

**Utolsó frissítés:** 2026-09-10

## 1. A projekt célja
Egy ingyenes NFL fantasy webalkalmazás készítése GitHub Pages-en, amely lehetőség szerint valós adatokat használ, a számításokat átláthatóan és magyarázhatóan kezeli, és megőrzi a már működő funkcionalitást.

**Forrásigazság:** mindig a jelenlegi GitHub repository, nem a korábban megjegyzett vagy rekonstruált kód.

Repository: `perczakp/nfl-hirek`

## 2. Jelenlegi oldalak / tabok
1. Players Trending
2. Dynasty Trade Calculator
3. IDP Rankings (Rookies)
4. Tips
5. Bye Weeks
6. My Fantasy Team
7. Strength of Schedule
8. 2026 IDP Rankings
9. NFL Games

Tervezett:
10. Preseason

### Navigáció
A navigáció site-wide komponens. Minden oldalnak ugyanazokat az aktuális linkeket és ugyanazokat az elrendezési szabályokat kell használnia.

Jelenlegi 9 tabos cél:
- desktop: 3 + 3 + 3;
- közepes/tablet: 2 oszlop;
- keskeny mobil: 1 oszlop.

A navigációs gombok ugyanazt a standard gombstílust használják, mint az oldalon található vezérlők, az aktuális oldal pedig aktív állapotban jelenik meg.

Navigációt nem szabad csak egyetlen oldalon módosítani.

## 3. Állandó fájlnév-szabály
Meglévő production fájl módosításakor az eredeti fájlnevet kötelező megtartani.

Példák:
- `index.html` marad `index.html`
- `my-team.html` marad `my-team.html`
- `tips.html` marad `tips.html`

Tilos `-fixed`, `-final`, `-v2`, `index2` vagy hasonló nevű production helyettesítő fájlokat létrehozni.

A backupok külön biztonsági másolatok lehetnek timestampelt `*.backup-*` fájlok vagy dedikált backup branchek.

## 4. Jelenlegi fő fájlok
- `index.html`
- `trade-chart.html`
- `rookie-idp-rankings.html`
- `IDP26rankings.html`
- `tips.html`
- `bye-weeks.html`
- `my-team.html`
- `strength-of-schedule.html`
- `nfl-games.html`
- `nfl-games.js`
- `nfl-games-normalization-test.html`
- `fantasycalc-values.json`
- `FANTASYCALC-CACHE.md`
- `PROJECT_STATE.md`
- `PROJECT_STATE_HU.md`

Jövőbeli:
- `preseason.html`

A repository timestampelt fejlesztési backupokat is tartalmaz. Ezek biztonsági másolatok, nem alternatív production fájlnevek.

# MY FANTASY TEAM

## 5. Célja
A `my-team.html` a felhasználó valódi Sleeper fantasy ligáját szinkronizálja és elemzi a rostert.

Fő folyamat:

Sleeper → aktuális szezon ligakeresése → liga kiválasztása → league/users/rosters szinkronizálás → játékosazonosítás → opcionális játékos/érték/ranking adatok → roster megjelenítés → Roster Strength + Position Needs + Injury Risk kontextus

## 6. Sleeper integráció
A Sleeper a forrása:
- a liga felfedezésének;
- a kiválasztott liga beállításainak;
- a felhasználóknak;
- a roster(ek)nek;
- a felhasználó tényleges rosterének;
- az elérhető player ID/metadata adatoknak.

### Aktuális League Sync kialakítás
A jelenlegi implementáció a Sleeper NFL state endpoint segítségével meghatározza az aktív liga szezont, majd csak erre a szezonra keres ligákat.

Ez szándékos. A korábbi több-szezonos keresés több ligát jelenített meg a ténylegesnél (például 3 valódi liga 6 megjelenített ligává vált).

A jelenlegi sync szétválasztja a core liga/roster szinkronizálást az opcionális player metadata, külső valuation és ranking adatoktól. Opcionális adatforrás hibája nem akadályozhatja meg a core roster betöltését.

Core sync:
- kiválasztott `/league/<league_id>`;
- `/league/<league_id>/users`;
- `/league/<league_id>/rosters`.

Opcionális enrichment:
- Sleeper `/players/nfl` metadata;
- helyi `fantasycalc-values.json`;
- helyi `IDP26rankings.html` / RPO rankings.

Ha a player metadata nem érhető el, a roster player ID alapján fallbackelhet, és nem bukhat el az egész sync.

## 7. Sleeper starter / bench / taxi mapping
A Sleeper `starters` tömbje starter slot szerint rendezett, miközben a `roster_positions` a `BN` slotokat is tartalmazza.

**Fontos szabály:** a `roster.starters` és `roster_positions` párosítása előtt a `BN` slotokat ki kell szűrni.

Ellenkező esetben az első bench pozíció után a starter játékosok rossz slotokba csúsznak.

Jelenlegi roster megjelenítés:
- Starter: a pontos, nem-BN Sleeper slot sorrend;
- Bench: azok a roster játékosok, akik nem starterek és nem taxi játékosok;
- Taxi Squad: `roster.taxi` játékosok.

A starter sorrendet a kiválasztott liga tényleges `roster_positions` beállítása adja, nem egy hard-coded általános sorrend.

## 8. Játékosazonosítás és ranking fogalmak
Offensive pozíciók:
- QB
- RB
- WR
- TE

IDP pozíciók normalizálása:
- DL
- LB
- DB

A `DE`, `DT`, `NT`, `EDGE`, `OLB`, `ILB`, `MLB`, `CB`, `S`, `FS` és `SS` a megfelelő szélesebb DL/LB/DB kategóriákba kerülnek.

A ranking, market value és roster need külön fogalmak, nem kezelhetők egymás szinonimájaként.

## 9. FantasyCalc
A `fantasycalc-values.json` a My Fantasy Team helyi market-value adatkészlete.

Jelenlegi fogalmak:
- market value;
- market-value percentile;
- pozíciós value poolok;
- azonosítás Sleeper ID és/vagy normalizált játékosnév alapján.

FantasyCalc értéket nem találunk ki. Ha megbízható érték hiányzik, dokumentált fallbacket használunk, vagy az értéket unavailable állapotban hagyjuk.

A repository jelenleg automatikus FantasyCalc cache frissítéseket is kap; a cache input marad, és nem írja felül a kitalált értékek tilalmát.

## 10. RPO IDP rankingek a My Fantasy Team-ben
A `my-team.html` betölti a helyi `IDP26rankings.html` oldalt, és annak ranking szekcióiból DL/LB/DB minőségi kontextust olvas.

A helyi oldal önálló, ezért a My Fantasy Team futás közben nem függ külső iframe elérhetőségétől.

## 11. Roster Strength
A Roster Strength kérdése:

> Mennyire erős ez a roster a kiválasztott liga többi csapatához képest?

A jelenlegi modell átlátható, független számítás, amely figyelembe veszi:
- játékosminőséget;
- starter minőséget;
- pozíciós mélységet;
- liga rosterkövetelményeit;
- pozíciós értékkontextust;
- releváns injury információt.

Játékosminőség inputok:
- offense: FantasyCalc market-value percentile;
- IDP: RPO Football rankingből képzett quality scale;
- hiányzó adat: explicit fallback, nem kitalált market value.

A modell **nem** a FantasyPros 1:1 reprodukciója. A FantasyPros olyan fogalmak referenciaforrása volt, mint a VORP, league-relative comparison, starter value és position strength, de a teljes proprietary formula nem ismert.

A megjelenített `100/100` nem értelmezhető matematikailag tökéletes fantasy rosterként.

## 12. Position Needs
A Position Needs kérdése:

> Melyik pozíciót kellene a rosternek először megerősítenie?

Figyelembe veszi:
- liga kezdőkövetelményeit;
- a pozíció játékosszámát;
- starter minőséget;
- depth-et;
- pozíciós gyengeséget;
- sérülési helyzetet, ha releváns.

Kimeneti kategóriák:
- HIGH
- MEDIUM
- LOW

A pontos formula továbbra is nyitott design item, és nem módosítható csendben.

## 13. Injury Risk
Állandó tervezési döntés:

**Az Injury Risk NEM változtathatja meg a játékos alapértékét.**

A kívánt architektúra:

`Base Player Value + külön Injury Risk információ`

és NEM:

`Base Player Value × rejtett injury penalty`

### Jelenlegi implementációs megjegyzés
A jelenlegi `my-team.html` quality calculation továbbra is tartalmaz `injuryPenalty()` levonást a quality score-on belül. Ez ellentmond a fenti állandó döntésnek, ezért **ismert hiba**, amelyet a modell véglegesítése előtt javítani kell.

Ezt a penalty logikát nem szabad tovább építeni vagy végleges valuation modellként kezelni.

## 14. Bye Weeks
A `bye-weeks.html` NFL bye-week információkat biztosít.

A bye-week információ releváns a roster elemzésében, és segíthet az elérhetőségi problémák felismerésében.

## 15. Strength of Schedule
A `strength-of-schedule.html` külön navigációs tab.

Jelenlegi preseason koncepció:
- 2026 NFL schedule difficulty;
- az ellenfelek előző szezonbeli összesített győzelmi arányán alapuló opponent strength;
- mind a 32 NFL csapat;
- SOS Rank, Team, Abbreviation, Rank, Opponent Win %.

Az SOS nem módosíthatja automatikusan a játékos alapértékét, hacsak erről külön döntés és dokumentáció nem születik.

# NFL GAMES

## 16. NFL Games oldal
A `nfl-games.html` elkészült NFL Games funkcióoldal.

Az oldal a közös `nfl-games.js` normalizációs réteget használja, nem közvetlenül az ESPN nyers event struktúráját.

Jelenlegi funkcionalitás:
- Week 1–18 selector;
- Previous Week / Next Week vezérlők;
- valós ESPN regular-season game adatok;
- home-first megjelenítés: HOME → AWAY;
- kickoff időpont;
- Hungary Time ↔ US Eastern timezone váltás;
- kiválasztott timezone szerinti napcsoportosítás;
- UPCOMING / LIVE / FINAL status mapping;
- ESPN által adott score-ok;
- venue és lokáció;
- neutral-site jelzés;
- lassabb automatikus frissítés pre-game adatokhoz és gyorsabb frissítés LIVE meccseknél;
- nem destruktív hibakezelés, amely hiba esetén megtartja az utolsó sikeres adatokat;
- reszponzív desktop/mobile layout;
- site-wide 9 elemű navigáció.

## 17. ESPN game-data normalizáció
Az `nfl-games.js` az ESPN scoreboard eventeket stabil, alkalmazásspecifikus game shape-pé alakítja.

A normalizált game tartalmazza:
- game ID;
- season year/type;
- week;
- kickoff UTC timestamp;
- normalizált home és away team;
- normalizált game status;
- venue információ;
- neutral-site flag.

ESPN status mapping:
- `pre` → `UPCOMING`;
- `in` → `LIVE`;
- `post` vagy completed → `FINAL`;
- minden más → `UNKNOWN`.

A normalizált status megőrzi az ESPN status metadata további részeit is, például state, name, description, completed flag, clock, display clock és period, ha rendelkezésre állnak.

Ez elválasztja az ESPN adatstruktúráját a weboldal belső adatmodelljétől.

## 18. NFL Games runtime ellenőrzés
Az `nfl-games-normalization-test.html` a normalizációs réteget valós ESPN adatokkal ellenőrizte az NFL Games oldal elkészítése előtt.

A felhasználó böngészőben ellenőrizte az élő GitHub Pages oldalt, többek között:
- Week 1 betöltése 16 meccsel;
- egy másik regular-season week helyes adatváltása (Week 7-en 14 meccs jelent meg);
- valós csapatok, kickoff időpontok, venue-k és státuszok;
- HOME → AWAY sorrend;
- napcsoportosítás;
- Hungary Time;
- US Eastern;
- timezone váltáskor helyes időváltozás;
- Melbourne neutral-site jelzés;
- reszponzív/mobile layout;
- a 9 elemű site-wide navigáció láthatósága és használhatósága;
- a navigációs gombok kívánt standard mérete és stílusa.

A normál felhasználói NFL Games flow ezért runtime-validáltnak tekinthető. Az auto-refresh időzítése és a hiba utáni adatmegőrzési útvonal implementálva és kódellenőrzéssel vizsgálva lett, de ezeket nem kényszerítettük végig külön böngészős failure/runtime teszttel.

# IDP / PRESEASON

## 19. 2026 IDP Rankings
Az `IDP26rankings.html` statikus, önálló megjelenítése az RPO Football 2026 IDP rankingnek:
- 73 DL;
- 73 LB;
- 78 DB;
- rank, játékosnév és team abbreviation.

Látható források:
- RPO Football 2026 IDP Rankings;
- publikált RPO ranking sheet.

Az oldal a validált ranking adatokat helyben tárolja, nem külső iframe-re támaszkodik. Frissítés csak az RPO forrással történő újraellenőrzés után történhet.

## 20. Rookie IDP oldal
A canonical fájlnév: `rookie-idp-rankings.html`.

A hibás, szóközt tartalmazó változat eltávolításra került. Minden navigációnak a canonical fájlnevet kell használnia.

## 21. Tervezett Preseason tab
A jövőbeli `Preseason` tab:
- QB
- RB
- WR
- TE

A dataset minden preseason mérkőzés után bővülhet.

Megbeszélt mezők:
- games played;
- target share;
- passing statisztikák;
- rushing statisztikák.

A felhasználó külön **Passing** és **Rushing** oszlopokat / szekciókat szeretne.

A snap countot vizsgáltuk, de jelenleg nem kerül bele.

A Preseason addig nem tekinthető késznek, amíg a valós adatforrás, schema és frissítési folyamat nincs tesztelve.

# FANTASYPROS KUTATÁS

## 22. FantasyPros referencia-kutatás
A FantasyPros vizsgálata rosterértékelési referenciaként történt, többek között browser developer tools, page source, network activity, nagy JavaScript bundle-ök, VORP/replacement fogalmak és Draft Analyzer outputok segítségével.

A pontos proprietary számítási formula nem került elő.

Nem állítható, hogy a projekt pontosan reprodukálja a FantasyPros képletét. A FantasyPros outputjai validációs/referencia pontok lehetnek, miközben a projekt saját modellje átlátható és független marad.

## 23. A FantasyPros-összehasonlítás tanulságai
A rosterértékelésnek figyelembe kell vennie:
- liga-relatív kontextust;
- pozíciót;
- starter/depth helyzetet;
- értelmes játékosértékeket;
- a rank, market value, roster strength és roster need világos elkülönítését.

A modellt több valódi példával kell validálni, nem egyetlen screenshot reprodukálására hangolni.

# NAVIGÁCIÓ

## 24. Site-wide navigációs szabály
A navigáció módosítása site-wide változtatás.

Minden oldalnak:
- ugyanazokat az aktuális linkeket kell tartalmaznia;
- ugyanazokat az elrendezési szabályokat kell használnia;
- ugyanazt a reszponzív viselkedést kell megtartania.

A jelenlegi stabil implementáció CSS Gridet használ a 9 aktuális navigációs elemmel.

# FEJLESZTÉSI MUNKAFOLYAMAT

## 25. Kötelező pre-change audit
Érdemi változtatásnál **nem szabad azonnal kódot szerkeszteni**.

Először:
1. Állapítsuk meg a tényleges aktuális GitHub állapotot.
2. Vizsgáljuk meg a teljes releváns adatfolyamot end-to-end.
3. Azonosítsuk az érintett fájlokat, API-kat, függőségeket és számításokat.
4. Hasonlítsuk össze az aktuális kódot a `PROJECT_STATE.md`-vel.
5. A gyökérokot keressük, ne csak a látható tünetet.
6. Ha van működő baseline, ellenőrizzük a legutolsó ismert jó verziót.
7. Határozzuk meg a legkisebb biztonságos módosítást.

Ez a szabály a League Sync / Roster Strength hibakeresési ciklus után került rögzítésre, mert a részleges javítások új hibákat hozhatnak létre vagy rossz adatfolyamot tarthatnak fenn.

## 26. Backup-first szabály
Meglévő production fájl módosítása előtt:

1. Fetch-eljük az aktuális production fájlt.
2. Készítsünk backupot.
3. Ellenőrizzük, hogy a backup valóban létezik.
4. Módosítsuk az eredeti fájlt.
5. Ellenőrizzük az eredményt.

Ha a backup nem hozható létre, **az eredetit nem módosítjuk**.

A backup biztonsági másolat, nem production alternatíva.

## 27. Minimális változtatás és ellenőrzés
Backup után:
1. A lehető legkisebb szükséges módosítást végezzük.
2. Minden nem kapcsolódó működő funkcionalitást őrizzünk meg.
3. Ellenőrizzük a syntaxot és a strukturális konzisztenciát.
4. Ha a környezet lehetővé teszi, teszteljük az oldalbetöltést, JavaScript/data flow-t, navigációt, vizuális struktúrát és releváns számításokat.
5. Egyértelműen jelentsük, mit teszteltünk és mit nem.

Soha ne állítsunk működőnek olyan runtime tesztet, amelyet nem végeztünk el.

# ELKERÜLENDŐ ISMERT HIBÁK

- Ne készítsünk `-fixed`, `-final`, `-v2` vagy hasonló production duplikátumokat.
- Ne nevezzük át feleslegesen a production fájlokat.
- Ne módosítsuk csak egyetlen oldal navigációját.
- Ne feltételezzük, hogy a megjegyzett/régi kód az aktuális.
- Ne cseréljük le a működő JavaScriptet mock vagy placeholder kódra.
- Ne találjunk ki FantasyCalc értékeket.
- Ne engedjük, hogy az Injury Risk rejtetten módosítsa az alapértéket.
- Ne nevezzünk működőnek nem tesztelt preview-t.
- Ne mutassunk sample adatot valós adatként.
- Ne változtassunk csendben számítási logikát.
- Ne állítsuk, hogy egy generált ZIP tesztelve lett pusztán azért, mert létrejött.
- Ne aggregáljunk több Sleeper szezont, ha a feature az aktív/current liga szezonját igényli.
- Ne párosítsuk a `roster.starters` tömböt a teljes `roster_positions` tömbbel a `BN` slotok kiszűrése nélkül.
- Opcionális adatforrás hibája nem akadályozhatja meg a core League Syncot.
- Komplex alrendszert ne javítsunk piecemeal end-to-end adatfolyam audit nélkül.

# JELENLEGI ELLENŐRZÖTT BASELINE

2026-09-10-i állapot szerint a legutóbbi production változtatás az NFL Games navigációs gombjainak standardizálása.

Legutóbbi production commit:
`1276292953fb1d829b6c5efd4cdaab3d8a781905`

A legutóbbi My Fantasy Team kód-baseline továbbra is a Sleeper starter-slot mapping javítása:
`2a9dbc6f4e75efe96ffea366001c6f720aedf8ce`

Ezt a javítást megelőző dedikált backup commit:
`f07891578f39c535e32539fac72afd3e8fc0c8e4`

A repository történetében későbbi automatikus FantasyCalc cache és news/tips adatfrissítések is vannak; ezek adatfrissítések, és nem váltják ki a My Fantasy Team kód-baseline-ját.

A starter mapping és League Sync/Roster Strength javítások után a felhasználói visszajelzés szerint az eredmény helyesnek tűnt. Ez azonban nem helyettesíti a teljes, valódi Sleeper ligával végzett browser/runtime tesztet.

Az NFL Games funkció most már integrálva van a site-wide navigációba, és a normál felhasználói flow browserben validálva lett.

# JELENLEGI PRIORITÁSOK

## P0 — My Fantasy Team stabilitás és helyesség
1. A `my-team.html` teljes runtime tesztje valódi Sleeper ligával.
2. Ellenőrizni, hogy az aktuális szezon League Sync pontosan a felhasználó jelenlegi ligáit adja vissza.
3. Roster betöltés és pontos Sleeper starter slot mapping ellenőrzése.
4. Player identification ellenőrzése a valódi rosteren.
5. FantasyCalc értékek és missing-value fallbackek ellenőrzése.
6. Roster Strength ellenőrzése több valódi liga példáján.
7. Position Needs ellenőrzése.
8. A jelenlegi rejtett `injuryPenalty()` hatás eltávolítása a base player quality-ból, és az Injury Risk külön megjelenítése.

## P1 — Projektmegbízhatóság és karbantartás
9. A navigáció konzisztenciájának ellenőrzése minden production oldalon a 9-tabos integráció után.
10. A GitHub Actions news/tips és FantasyCalc refresh workflow-k auditja hibakezelés és stale-data viselkedés szempontjából.
11. A nagy JSON datasetek, például `player-news.json` és `players.json`, méretének és betöltési viselkedésének felülvizsgálata a szezon terhelése előtt.
12. A `PROJECT_STATE.md` szinkronban tartása minden érdemi projektváltoztatás után.
13. A fejlesztési backupok fokozatos kivezetése a production `main` tree-ből, és ahol célszerű, biztonsági másolatok dedikált backup branchekben tartása.

## P2 — Tesztelés és kódminőség
14. A jelenlegi browser normalization test kibővítése könnyű regression suite-tá a legfontosabb adatfolyamokra.
15. A dinamikus HTML rendering és külső adatok kezelésének auditja karbantarthatóság és biztonságos DOM használat szempontjából.
16. Teljes cross-page mobile/desktop regression pass nagyobb navigációs vagy layout változtatások után.

## Következő nagy feature
17. Preseason tab elkészítése.
18. Valós, ingyenes preseason adatforrás meghatározása.
19. Preseason JSON schema definiálása.
20. Games, passing, rushing és target-share adatok hozzáadása.
21. Az egyes preseason mérkőzések utáni frissítési folyamat definiálása és tesztelése.

# PROJEKT FILOZÓFIÁJA

**Valós adat → átlátható logika → kis, biztonságos változtatás → explicit tesztelés → dokumentált állapot.**

A projektben nem a funkciók gyors hozzáadása az elsődleges, hanem az adatok helyessége és a stabil működés.