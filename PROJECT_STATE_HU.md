# NFL Fantasy Projekt — PROJECT STATE

**Utolsó frissítés:** 2026-08-30

> **Cél:** Ez a dokumentum a projekt tartós munkamemóriája. Rögzíti az elfogadott felépítést, adatforrásokat, számítási elveket, UI-döntéseket, ismert hibákat és következő lépéseket, hogy a fejlesztést új beszélgetésben is következetesen lehessen folytatni.

---

## 1. A PROJEKT CÉLJA

Egy ingyenes NFL fantasy webalkalmazás készítése GitHub Pages-en, amely lehetőség szerint valós adatokat használ, átlátható számításokat alkalmaz, és az új funkciók hozzáadásakor megőrzi a már működő funkcionalitást.

A projekt fő alapelvei:
- lehetőség szerint valós adatok használata;
- a számítások legyenek érthetők;
- ne adjunk félrevezetően pontos értékeket;
- a navigáció és az oldalstruktúra legyen következetes;
- módosított fájl mindig az eredeti fájlnevén maradjon.

---

## 2. JELENLEGI OLDALAK / TABOK

Jelenlegi navigáció:

1. Players Trending
2. Dynasty Trade Calculator
3. IDP Rankings (Rookies)
4. Tips
5. Bye Weeks
6. My Fantasy Team
7. Strength of Schedule

Tervezett:

8. Preseason

### Navigációs szabály

Minden oldal ugyanazt a navigációs struktúrát használja.

A jelenlegi 7 tabos verzió szándékosan több sorban jelenik meg:
- 1. sor: 3 tab
- 2. sor: 3 tab
- 3. sor: 1 tab

A Preseason hozzáadásakor a cél egy rendezett 4 + 4 elrendezés.

A navigáció szerkezete nem változhat attól függően, hogy a felhasználó melyik oldalról melyik oldalra lép.

---

## 3. FÁJLNÉV-SZABÁLY — FONTOS

### Állandó szabály

Meglévő fájl módosításakor az eredeti fájlnevet KÖTELEZŐ megtartani.

Példák:
- `index.html` → `index.html`
- `my-team.html` → `my-team.html`
- `tips.html` → `tips.html`
- `strength-of-schedule.html` → `strength-of-schedule.html`

TILOS ilyen duplikátumokat létrehozni:
- `index-final.html`
- `index2.html`
- `my-team-fixed.html`
- `tips-new.html`
- `strength-of-schedule-final.html`

Korábban ezek felesleges duplikált fájlokat és GitHub-takarítást okoztak.

---

## 4. JELENLEGI FŐ FÁJLOK

- `index.html`
- `trade-chart.html`
- `idp-rankings.html`
- `tips.html`
- `bye-weeks.html`
- `my-team.html`
- `strength-of-schedule.html`

Jövőbeli:
- `preseason.html`

GitHub repository:

`perczakp/nfl-hirek`

A GitHubot kell a jelenlegi, telepített kód forrásának tekinteni.

---

## 5. FEJLESZTÉSI / VERZIÓKEZELÉSI SZABÁLYOK

Meglévő oldal módosítása előtt:

1. Ha elérhető, a jelenlegi GitHub/RAW verzió legyen az alap.
2. Ne egy régi kódverzióra vagy emlékezetből származó kódra támaszkodjunk.
3. A már működő funkcionalitást őrizzük meg.
4. A lehető legkisebb szükséges módosítást végezzük.
5. Az eredeti fájlnevet tartsuk meg.
6. A kész változatot teszteljük, mielőtt működőnek nyilvánítjuk.
7. Nagyobb változtatás előtt legyen mentés a működő állapotról.

Soha ne feltételezzük, hogy két HTML-oldal CSS-e vagy navigációja azonos csak azért, mert hasonlóan néznek ki.

# MY FANTASY TEAM

## 6. CÉLJA

A `my-team.html` feladata a felhasználó valódi Sleeper fantasy ligájának szinkronizálása és a saját roster elemzése.

Fő folyamat:

Sleeper
→ Liga kiválasztása
→ Roster szinkronizálása
→ Játékosok azonosítása
→ Fantasy érték / ranking adatok
→ Roster elemzése
→ Roster Strength + Position Needs + Injury Risk + Bye Week információk

A cél nem pusztán a játékoslista megjelenítése, hanem használható roster-elemzés.

---

## 7. SLEEPER INTEGRÁCIÓ

A Sleeper a felhasználó tényleges fantasy ligájának és rosterének adatforrása.

Az oldal célja:
- a felhasználó ligáinak megkeresése;
- a megfelelő liga kiválasztásának lehetővé tétele;
- liga beállításainak lekérése;
- roster(ek) lekérése;
- a felhasználó rosterének azonosítása;
- a Sleeper játékosadatainak használata.

A rosternek a kiválasztott valódi Sleeper ligából kell származnia, nem előre megadott példa-játékosokból.

**A Sleeper a forrása a tényleges rosternek és liga-struktúrának.**

---

## 8. JÁTÉKOS-RANGSOROK

Offensive játékosoknál:
- QB
- RB
- WR
- TE

a Sleeper játékos-rangsorai / statisztikai információi adnak kontextust.

Az IDP / defensive játékosoknál a megfelelő defensive adatok követendők.

Fontos: a ranking és a market value két külön fogalom, ezeket nem szabad összekeverni.

---

## 9. FANTASYCALC MARKET VALUE

A FantasyCalc market value fontos input a játékosértékeléshez.

A My Fantasy Team modellben használt fogalmak:
- market value;
- market-value percentile;
- pozíciónkénti value pool;
- játékos azonosítása Sleeper ID és/vagy név alapján.

Ha nincs megbízható FantasyCalc érték, ne találjunk ki magas értéket. A hiányzó adat maradjon hiányzó, vagy csak dokumentált fallback használható.

---

## 10. ROSTER STRENGTH

A Roster Strength kérdése:

> Mennyire erős a rosterem a ligám többi csapatához képest?

Figyelembe kell venni:
- játékosminőséget;
- kezdők minőségét;
- pozíciós mélységet;
- liga rosterkövetelményeit;
- pozíciós értéket;
- releváns injury információt.

A 100/100 nem jelenthet szó szerint tökéletes fantasy csapatot.

A relatív ligahelyezés fontos. Például a `1/12` helyes lehet, ha az adott pozícióban a felhasználó csapata a 12 csapat közül a legerősebb.

---

## 11. POSITION NEEDS

A Position Needs kérdése:

> Melyik pozíciót kellene a leginkább megerősíteni?

Figyelembe kell venni:
- kezdőkövetelményeket;
- a pozícióban lévő játékosok számát;
- kezdők minőségét;
- depth-et;
- pozíciós gyengeséget;
- sérülési helyzetet, ha releváns.

A prioritás lehet:
- HIGH
- MEDIUM
- LOW

A végleges képletet nem szabad csendben megváltoztatni anélkül, hogy ellenőriznénk a hatását.

---

## 12. INJURY RISK

Állandó tervezési döntés:

**Az Injury Risk NEM változtathatja meg a játékos alapértékét.**

A sérülési információ külön jelenjen meg, hogy a felhasználó maga mérlegelhessen.

Elv:

`Base Player Value + külön Injury Risk információ`

és NEM:

`Base Player Value × rejtett injury penalty`

---

## 13. BYE WEEKS

A `bye-weeks.html` külön oldalon kezeli az NFL bye heteket.

Ez a My Fantasy Team elemzésben is fontos, mert segíthet megmutatni, ha egy adott héten több rosterelt játékos nem bevethető.

---

## 14. STRENGTH OF SCHEDULE

A `strength-of-schedule.html` külön tabként szerepel.

Jelenlegi preseason koncepció:
- 2026 NFL schedule difficulty;
- az ellenfelek előző szezonbeli összesített győzelmi arányán alapuló opponent strength;
- mind a 32 NFL csapat;
- SOS Rank, Team, Abbreviation, Rank, Opponent Win % oszlopok.

Ez preseason kiindulópont, mert a tényleges aktuális erősség változhat.

Az SOS-t nem szabad automatikusan beépíteni a játékos alapértékébe, hacsak ezt külön nem döntjük el és dokumentáljuk.

# PRESEASON

## 15. TERVEZETT PRESEASON TAB

A jövőbeli `Preseason` tab az alábbi posztokat kezeli:
- QB
- RB
- WR
- TE

Az adatbázis minden új preseason mérkőzéssel bővül.

Megbeszélt mezők:
- meccsek száma;
- target share;
- passing statisztikák;
- rushing statisztikák.

A felhasználó külön **Passing** és **Rushing** oszlopokat / szekciókat szeretne.

### Snap Count

A snap countot vizsgáltuk, de jelenleg **nem kerül bele**.

## 16. PRESEASON ADATFORRÁS

A The Football Database és az NFL.com is vizsgálva lett lehetséges adatforrásként.

A felhasználó lehetőség szerint egyetlen ingyenes sportoldalról szeretné beszerezni az összes szükséges preseason információt.

A növekvő preseason adatbázishoz a JSON megfelelő architektúrának tűnik.

A Preseason funkciót addig nem tekintjük késznek, amíg a valós adatforrás, JSON séma és frissítési folyamat nincs tesztelve.

# FANTASYPROS KUTATÁS

## 17. FANTASYPROS VIZSGÁLAT

A FantasyPros-t a rosterértékelés megértéséhez használtuk referenciaértékként.

Vizsgáltuk:
- böngésző fejlesztői eszközöket;
- page source-t;
- network kéréseket;
- nagy JavaScript bundle-öket;
- VORP / replacement fogalmakat.

Egy rendkívül nagy, összeállított JavaScript-kódot találtunk, és a `VORP` illetve `replacement` egyszerű keresése nem fedte fel a teljes számítási modellt.

Nem szabad feltételezni, hogy egyetlen látható képlet a teljes FantasyPros modellt jelenti.

## 18. A FANTASYPROS-ÖSSZEHASONLÍTÁS TANULSÁGAI

A rosterértékelésnek figyelembe kell vennie:
- liga-relatív kontextust;
- pozíciót;
- kezdő/depth helyzetet;
- értelmes játékosértékeket;
- a rank, market value és roster need elkülönítését.

A modellt valódi példákkal kell validálni, nem egyetlen screenshothoz kell igazítani.

# NAVIGÁCIÓS TANULSÁGOK

## 19. NAVIGÁCIÓS HIBA

Korábbi módosítás után:
- egyes oldalakon minden tab egy sorban volt;
- másokon több sorban;
- egy oldalon csak négy tab jelent meg.

Az ok: az oldalak navigációs struktúrája és CSS-e nem volt teljesen egységes.

Helyes megközelítés:
- a navigáció site-wide komponens;
- minden oldalon ugyanazok a linkek legyenek;
- minden oldal ugyanazokat az elrendezési szabályokat használja;
- egyetlen oldal javítása nem elegendő.

A jelenlegi stabil irány CSS Gridet használ, nem csak flexbox sortörést.

## 20. JELENLEGI CÉL

7 tab:
- 1. sor: 3
- 2. sor: 3
- 3. sor: 1

8 tab, Preseason után:
- cél: 4 + 4

A működő oldal tartalmát nem szabad feláldozni pusztán a navigáció módosítása miatt.

# 21. ELKERÜLENDŐ HIBÁK

- Ne készítsünk `-fixed` / `-final` duplikátumokat.
- Ne nevezzük át feleslegesen a production fájlokat.
- Ne csak egy oldal navigációját módosítsuk.
- Ne feltételezzük, hogy a régi kód a jelenleg telepített kód.
- Ne cseréljük le a működő JavaScriptet mock kódra.
- Ne találjunk ki FantasyCalc értékeket.
- Ne engedjük, hogy az Injury Risk rejtetten módosítsa az alapértéket.
- Ne nevezzünk működőnek egy nem tesztelt előnézetet.
- Ne mutassunk mintaadatot valós adatként.
- Ne változtassuk meg csendben a számítási logikát.
- Ne állítsuk, hogy egy ZIP tesztelve lett csak azért, mert létrehoztuk.

# 22. JELENLEGI PRIORITÁSOK

## Magas prioritás
1. `my-team.html` teljes tesztelése valódi Sleeper ligával.
2. League Sync ellenőrzése.
3. Roster betöltésének ellenőrzése.
4. Játékosazonosítás ellenőrzése.
5. FantasyCalc értékek ellenőrzése.
6. Roster Strength ellenőrzése.
7. Position Needs ellenőrzése.
8. Injury Risk megjelenítésének ellenőrzése úgy, hogy az alapérték ne változzon.
9. Navigáció ellenőrzése minden oldalon.

## Következő nagy funkció
10. Preseason tab elkészítése.
11. Valós, ingyenes preseason adatforrás meghatározása.
12. Preseason JSON séma meghatározása.
13. Meccsek, passing, rushing és target share hozzáadása.
14. Az adatbázis frissítése/bővítése minden új preseason meccs után.

# 23. PROJEKT MUNKAFOLYAMAT

Minden jövőbeli módosításnál:

1. Aktuális állapot meghatározása a tényleges repository/fájl alapján.
2. Érintett függőségek azonosítása.
3. A lehető legkisebb szükséges módosítás.
4. Tesztelés: oldalbetöltés, navigáció, JavaScript/adatfolyam, vizuális szerkezet és meglévő funkcionalitás.
5. Objektív beszámoló: mi változott, miért, mit teszteltünk, mit nem tudtunk tesztelni.
6. Eredeti fájlnév megtartása.
7. Nagyobb változtatás előtt működő verzió mentése.

# 24. PROJEKT ALAPELVEI

**Valós adat > kitalált adat**

**Átlátható számítás > megmagyarázhatatlan pontszám**

**Liga-relatív kontextus > önkényes abszolút érték**

**Külön kezelt kockázati információ > rejtett büntetés**

**Stabil architektúra > gyors javítgatás**

**Aktuális repository > emlékezetből elővett kód**

**Egy kanonikus fájlnév > duplikált verziók**

# 25. ÚJ BESZÉLGETÉS / FOLYTATÁSI PROTOKOLL

Új beszélgetés indításakor:

1. Töltsük be a `PROJECT_STATE.md`-t.
2. Tekintsük a dokumentumot a projekt dokumentált döntéseinek és architektúrájának.
3. Olvassuk / kérjük le az aktuális repository fájlokat, amelyeket módosítani fogunk.
4. Hasonlítsuk össze a dokumentált állapotot a tényleges kóddal.
5. Eltérés esetén ne válasszunk csendben; jelezzük az eltérést.
6. Jelentős döntés vagy elkészült funkció után frissítsük a `PROJECT_STATE.md`-t.

A dokumentum a projekt memóriája, nem helyettesíti a tényleges forráskódot.

# 26. PROJECT STATE KARBANTARTÁSI SZABÁLY

A `PROJECT_STATE.md` egy **folyamatosan karbantartott projektmemória**, ezért a projekt fejlődésével együtt frissíteni kell.

### Frissítési folyamat

Minden **jelentős** projektváltoztatásnál:

**Kód módosítása → Teszt → PROJECT_STATE.md frissítése → mentés/commit**

Frissíteni kell többek között, ha:
- új funkció készül;
- egy funkció megszűnik vagy jelentősen megváltozik;
- adatforrás változik;
- számítási képlet vagy értékelési logika változik;
- API vagy adatfolyam változik;
- jelentős UI/navigációs döntés változik;
- egy korábban felfedezett hiba javításra kerül;
- új állandó fejlesztési szabály születik;
- egy fontos korábbi döntést visszavonunk vagy felülírunk;
- egy nagyobb funkció működőként ellenőrzésre kerül.

### Mit dokumentáljunk?

Szükség esetén frissíteni kell:
- aktuális funkcióállapot;
- architektúra/adatfolyam;
- adatforrások;
- számítási szabályok;
- fontos tervezési döntések;
- ismert hibák és megoldásaik;
- tanulságok / elkerülendő hibák;
- aktuális prioritások;
- nyitott kérdések;
- changelog.

### Ne dokumentáljunk túl

Nem kell frissíteni a `PROJECT_STATE.md`-t minden apró CSS-módosítás, elírásjavítás vagy olyan változtatás után, amely nem módosítja érdemben a projekt állapotát.

A cél egy használható, kellően részletes projektmemória, nem egy teljes commitnapló.

# 27. CHANGELOG

A changelog a jelentős projektmérföldkövek és döntések rögzítésére szolgál.

### 2026-08-30
- Létrehoztuk a `PROJECT_STATE.md` fájlt a projekt tartós munkamemóriájaként.
- Rögzítettük, hogy a GitHub a jelenlegi production kód forrása.
- Rögzítettük az eredeti fájlnév megtartásának szabályát.
- Dokumentáltuk a site-wide navigáció egységességének követelményét.
- Dokumentáltuk a My Fantasy Team architektúráját és jelenlegi számítási elveit.
- Dokumentáltuk a tervezett Preseason funkciót és jelenlegi adatkövetelményeit.
- Rögzítettük, hogy a `PROJECT_STATE.md`-t a projekt fejlődésével együtt karban kell tartani.
- Elkészült a magyar nyelvű változat.

# 28. ARANYSZABÁLY

> **Soha ne áldozzunk fel egy már működő projekt-részt azért, hogy egy új rész gyorsabban működjön.**
>
> Kétség esetén: őrizzük meg a működő verziót, készítsünk mentést, teszteljük a módosítást, és csak ezután cseréljük le a production fájlt.

# 29. NYITOTT KÉRDÉSEK

- A Roster Strength pontos végleges matematikai képlete.
- A Position Needs pontos végleges matematikai képlete.
- A FantasyPros módszertana a saját, független modellünkhöz képest.
- A teljes preseason statisztikákhoz használható legjobb ingyenes, egyetlen adatforrás.
- A végleges preseason JSON séma.
- A snap count későbbi beszerzésének lehetősége ugyanattól a szolgáltatótól.
- Az SOS későbbi felhasználása matchup/player elemzésben.
- A végleges 8-tabos navigációs elrendezés a Preseason hozzáadása után.
