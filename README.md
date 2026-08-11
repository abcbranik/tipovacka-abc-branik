# Tipovačka

Webová aplikace pro fotbalový klub se čtyřmi týmy (A muži, B muži, A ženy,
A dorost), ve které členové klubu každé kolo tipují **výsledek zápasu** a
**střelce branky** za náš tým. Po odehrání zápasu zadá administrátor
skutečný výsledek a aplikace automaticky spočítá body všem, kdo tipovali.
Body se sčítají do celkového žebříčku klubu.

Postaveno na: Next.js 14 (App Router) + TypeScript, Prisma ORM, next-auth v4
(přihlášení přes jméno + heslo), Tailwind CSS.

> **Tato větev je nasazená verze (Postgres/Vercel/Neon).** Jde o stejnou
> appku jako v původním zdrojovém balíčku, jen `prisma/schema.prisma` a
> `lib/prisma.ts` cílí na Postgres místo SQLite (kvůli tomu, jak Vercel
> hostuje appky - potřebuje běžnou síťovou databázi, ne lokální soubor).
> Sestavovací příkaz (`npm run build`, viz `package.json`) při každém
> nasazení automaticky provede `prisma db push` (sesynchronizuje schéma
> databáze) a spustí seed skript (založí 4 týmy a superadmina, pokud ještě
> neexistují) - není tedy potřeba nic spouštět ručně.

---

## 1. Jak aplikace funguje (pro členy klubu)

- Na hlavní stránce **Přehled** vidíš u každého týmu jeho nejbližší
  naplánované zápasy. U každého zápasu vyplníš svůj tip: skóre (kolik dají
  góly "naši" a kolik "soupeř") a vybereš střelce - buď konkrétního hráče
  ze soupisky, nebo možnost "Nikdo z nás nedá gól". Tip můžeš kdykoliv do
  výkopu upravit, po výkopu už ne.
- Po odehrání zápasu a zadání výsledku administrátorem se v sekci
  "Odehrané zápasy" objeví skutečný výsledek, tvůj tip a body, které jsi za
  něj získal(a) (zvýrazněno zeleně, pokud jsi bodoval(a)).
- V sekci **Žebříček** je vidět pořadí všech členů podle celkového součtu
  bodů, s možností zobrazit rozpad bodů podle jednotlivých týmů.

## 2. Bodovací pravidla (jak se počítají body)

Za každý zápas může člen získat body ve dvou nezávislých kategoriích, které
se pak sečtou do celkového počtu bodů za daný tip.

### a) Body za tip na výsledek

Body za výsledek se dávají jen za **nejlepší vyhovující** pásmo (pásma se
nesčítají):

| Co jsi trefil(a)                                                    | Body |
| -------------------------------------------------------------------- | ---- |
| Přesný výsledek (např. tip 2:1, výsledek 2:1)                        | 5    |
| Správný rozdíl skóre, ale ne přesný výsledek (tip 3:1, výsledek 2:0 - oba +2) | 3    |
| Správný výsledek zápasu - výhra/remíza/prohra (tip 2:0, výsledek 1:0) | 1    |
| Nic z výše uvedeného                                                  | 0    |

### b) Body za tip na střelce - "diskont za popularitu"

Cílem je, aby tip na střelce byl férový: pokud si všichni tipnou stejného
"jasného favorita" na gól, je to bezpečná, ale málo "odvážná" volba a
neměla by být odměněna stejně jako odvážný, méně obvyklý tip, který
nakonec vyjde. Zároveň chceme, aby **každý správný tip** něco přinesl - i
kdyby si stejného hráče tipli úplně všichni.

Jak se to počítá:

1. Pro daný zápas se vezmou všechny tipy na střelce (včetně tipů "Nikdo z
   nás nedá gól" - to je taky platná volba).
2. U každé konkrétní volby (konkrétní hráč, nebo "nikdo") se spočítá, jak
   velké procento všech tipů na tuto volbu připadá - tomu říkáme
   **popularita tipu**.
3. Tip je "trefený", pokud:
   - opravdu nikdo z našich nedal gól a tys tipoval(a) "Nikdo z nás nedá
     gól", nebo
   - tebou tipovaný hráč je mezi hráči, kteří admin zadal jako skutečné
     střelce.
4. Netrefený tip = **0 bodů**.
5. Trefený tip = **základ 2 body** + bonus za vzácnost tipu, maximálně
   +3 body navíc (tedy body za střelce jsou vždy mezi 2 a 5). Bonus se
   počítá jako `zaokrouhleno(3 × (1 − popularita tipu))` - čím míň lidí
   tipovalo stejně jako ty, tím vyšší bonus.

**Příklad:** Na zápas tipovalo střelce 10 lidí. 8 z nich tipovalo hvězdu
týmu Jana Nováka, 1 tipoval Petra Svobodu a 1 tipoval "nikdo nedá gól".
Ve skutečnosti dal gól Petr Svoboda.

- Těch 8, co tipovali Nováka: netrefili se → 0 bodů.
- Ten, co tipoval "nikdo": netrefil se → 0 bodů.
- Ten, co tipoval Svobodu (popularita 1/10 = 10 %): trefil se → bonus =
  zaokrouhleno(3 × 0,9) = 3, body = 2 + 3 = **5 bodů za střelce**.

Kdyby naopak Svobodu tipovalo 5 lidí z 10 (popularita 50 %) a jeden z nich
se trefil, dostal by bonus = zaokrouhleno(3 × 0,5) = 2, tedy 2 + 2 =
**4 body**. A kdyby se trefil ten "oblíbený" tip, který si vybralo všech
10 lidí (popularita 100 %), dostal by každý bonus = zaokrouhleno(3 × 0) =
0, tedy jen základních **2 body**.

### c) Celkový počet bodů za tip

`Celkem = body za výsledek + body za střelce`

Přepočet bodů proběhne (a případně se přepíše) vždy, když administrátor
zadá nebo opraví výsledek zápasu - přepočítají se všechny tipy na daný
zápas najednou, takže i oprava chybně zadaného výsledku je bezpečná.

Přesnou implementaci najdeš v [`lib/scoring.ts`](./lib/scoring.ts) - je to
čistá, snadno testovatelná logika bez závislosti na databázi.

---

## 3. První spuštění (lokální vývoj)

### Požadavky

- Node.js 18+ (testováno na Node 22)
- npm

### Kroky

```bash
npm install
cp .env.example .env
# uprav .env - hlavně NEXTAUTH_SECRET (viz níže)

npx prisma migrate dev   # vytvoří SQLite databázi podle prisma/migrations
npx prisma db seed       # založí 4 týmy, pár ukázkových hráčů a superadmina
npm run dev              # spustí aplikaci na http://localhost:3000
```

Pak stačí otevřít [http://localhost:3000/login](http://localhost:3000/login).

Pro produkční build:

```bash
npm run build
npm run start
```

### Proměnné prostředí (`.env`)

| Proměnná              | Význam                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------- |
| `DATABASE_URL`        | Připojení k databázi. Pro lokální SQLite: `file:./dev.db` (soubor `prisma/dev.db`).       |
| `NEXTAUTH_SECRET`     | Náhodný tajný řetězec pro podepisování přihlašovacích tokenů. Vygeneruj např. `openssl rand -base64 32`. |
| `NEXTAUTH_URL`        | Veřejná URL běžící aplikace (lokálně `http://localhost:3000`).                            |
| `SEED_ADMIN_NAME`     | Jméno superadmin účtu, který se založí příkazem `npx prisma db seed` (výchozí `Admin`).   |
| `SEED_ADMIN_PASSWORD` | Heslo superadmin účtu při založení (výchozí `zmenteheslo123` - **hned po prvním přihlášení změň!**). |

Ukázkový soubor je v [`.env.example`](./.env.example).

---

## 4. Přihlášení jako superadmin a první nastavení klubu

1. Přihlas se na `/login` jménem a heslem ze `SEED_ADMIN_NAME` /
   `SEED_ADMIN_PASSWORD` (výchozí `Admin` / `zmenteheslo123`).
2. **Hned zajdi do sekce "Uživatelé"** (vidí ji jen superadmin) a přes
   "Resetovat heslo" u svého účtu si nastav vlastní bezpečné heslo.
   Aplikace nemá žádné samoobslužné "zapomenuté heslo" přes e-mail -
   jediný způsob obnovy hesla je právě přes tento panel superadmina, takže
   je dobré mít alespoň dva superadmin účty pro jistotu.
3. V sekci "Administrace" najdeš přepínač týmů (superadmin vidí a
   spravuje všechny 4 týmy). Aplikace při zakládání (seed) vytvoří jen
   týmy a pár **fiktivních ukázkových hráčů**, aby appka nebyla úplně
   prázdná - jejich jména jsou vymyšlená (např. "Jan Novák") a je potřeba
   je smazat/deaktivovat a nahradit skutečnou soupiskou. Žádné zápasy ani
   běžní členové se automaticky nezakládají.
4. Pro každý tým v Administraci:
   - **Soupiska hráčů** - přidej skutečné hráče (tlačítko "Přidat
     hráče"), staré ukázkové hráče deaktivuj tlačítkem "Deaktivovat"
     (needstraňují se kvůli historii tipů, jen zmizí z nabídky pro nové
     tipy).
   - **Přidat zápas** - vyplň kolo, soupeře, doma/venku a datum a čas
     výkopu. Zápas se objeví na Přehledu všem členům a mohou na něj
     tipovat až do výkopu.
   - Po odehrání zápasu klikni u zápasu na **"Zadat výsledek"**, vyplň
     skóre a zaškrtni, kteří hráči dali gól. Uložením se automaticky
     přepočítají body všem, kdo na zápas tipovali.
5. V sekci "Uživatelé" (jen superadmin) můžeš:
   - povyšovat/snižovat role uživatelů (Člen ↔ Admin ↔ Superadmin),
   - u Adminů zaškrtnout, které týmy mají na starosti (spravují jen ty),
   - komukoliv resetovat heslo.

Členové se registrují sami na `/register` (jméno + heslo, min. 6 znaků).
Jméno musí být unikátní (bez ohledu na velikost písmen).

---

## 4a. Vzhled a branding (klubové barvy a logo)

Appka je přebarvená podle klubového znaku (modrá/černá/bílá) a používá klubové
logo. Pokud budete chtít barvy nebo logo v budoucnu upravit (např. při
změně vizuální identity klubu), stačí sáhnout na tato dvě místa:

- **Barvy** – `tailwind.config.ts`, klíč `theme.extend.colors.club`. Jsou tam
  tři odstíny: `primary` (hlavní modrá - tlačítka, odkazy, zvýraznění),
  `primary-dark` (tmavší odstín pro horní navigační lištu) a `primary-light`
  (velmi světlý odstín pro pozadí karet/zvýraznění). Všechny ostatní
  komponenty v appce používají jen tyto tři pojmenované barvy (přes
  `bg-club-primary`, `text-club-primary` apod.), takže změna tří hex kódů na
  jednom místě přebarví celou appku.
- **Logo** – `public/logo.png` (zobrazuje se v navigaci a na
  přihlašovací/registrační stránce) a `app/icon.png` (favicon v záložce
  prohlížeče - Next.js ho automaticky použije, protože se jmenuje `icon.png`
  a leží přímo ve složce `app/`). Nový soubor stačí zkopírovat na stejné
  místo se stejným názvem.

---

## 5. Nasazení do produkce

Schéma je připravené v `prisma/schema.prisma` s `provider = "sqlite"`.
Pro produkci doporučujeme jednu ze dvou cest:

### a) Vercel + hostovaný Postgres zdarma (Neon / Supabase) - doporučeno

1. Založ si databázi na [Neon](https://neon.tech) nebo
   [Supabase](https://supabase.com) (obě mají zdarma tier) a zkopíruj si
   connection string.
2. V `prisma/schema.prisma` změň:
   ```prisma
   datasource db {
     provider = "postgresql"   // dříve "sqlite"
     url      = env("DATABASE_URL")
   }
   ```
   a v `lib/prisma.ts` / `prisma/seed.ts` přestaň používat SQLite driver
   adapter (`@prisma/adapter-better-sqlite3`) - stačí `new PrismaClient()`
   bez adaptéru, Postgres už native engine podporuje běžně. Zvaž také
   odebrání `engineType = "client"` z generátoru, pokud ho nepotřebuješ.
3. Nastav `DATABASE_URL` v proměnných prostředí Vercelu na connection
   string z kroku 1, `NEXTAUTH_SECRET` a `NEXTAUTH_URL` (veřejná URL
   nasazené appky).
4. Po nasazení jednorázově spusť `npx prisma migrate deploy` (např. přes
   Vercel CLI nebo build hook) a `npx prisma db seed`.
5. Propoj repozitář ve Vercelu a nasaď - hotovo.

### b) Vlastní server / VPS / Railway / Render se SQLite souborem

1. Ujisti se, že adresář, kde bude ležet `prisma/dev.db`, je na
   **persistentním disku** (u Railway/Render je potřeba připojit volume,
   jinak se soubor při redeployi ztratí).
2. Na serveru:
   ```bash
   npm install
   npx prisma migrate deploy
   npx prisma db seed        # jen při prvním nasazení
   npm run build
   npm run start
   ```
3. Aplikaci dej za reverzní proxy (nginx / Caddy) s HTTPS, ideálně jako
   systemd službu nebo přes process manager (pm2), aby se po pádu/restartu
   serveru sama znovu spustila.
4. Nastav `DATABASE_URL=file:./dev.db`, `NEXTAUTH_URL` na veřejnou
   doménu a bezpečný `NEXTAUTH_SECRET`.

---

## 6. Poznámky pro vývojáře / technické detaily

- **Proč jsou role/typy jako `Venue` a `MatchStatus` v `schema.prisma`
  obyčejné `String` sloupce, a ne Prisma `enum`?** SQLite nemá nativní
  podporu enumů v Prisma schématu. Povolené hodnoty jsou zdokumentované
  jako TypeScript union typy v [`lib/types.ts`](./lib/types.ts) a
  validují se v API routách. Při přechodu na Postgres je můžeš, ale
  nemusíš, převést na skutečné Prisma enumy.
- **Proč `engineType = "client"` a `@prisma/adapter-better-sqlite3`
  místo výchozího nastavení?** Tahle kombinace ("driver adapters")
  znamená, že Prisma Client nepoužívá nativní Rust query engine binárku,
  ale čistě TypeScript/WASM compiler + běžný npm balíček
  `better-sqlite3` pro samotný přístup k souboru databáze. Funguje to
  stejně na jakékoliv platformě/architektuře a nevyžaduje stahování
  žádné platformě-specifické binárky - hodí se to i v prostředích s
  omezeným/firemním přístupem k internetu. Native modul `better-sqlite3`
  je proto v `next.config.js` vyjmutý z webpack bundlování přes
  `experimental.serverComponentsExternalPackages` (bez toho by build
  procházel, ale běh appky by padal na chybě z balíčku `bindings`).
- **Poznámka pro velmi restriktivní firemní síť:** pokud ti `npx prisma
  generate` / `migrate` / `db seed` hlásí `403 Forbidden` při stahování
  z `binaries.prisma.sh` (typicky za firemním firewallem, který tuto
  doménu blokuje), Prisma nabízí oficiální únikovou cestu přes proměnné
  prostředí `PRISMA_QUERY_ENGINE_LIBRARY`, `PRISMA_SCHEMA_ENGINE_BINARY`
  apod. (viz [pris.ly/d/custom-engines](https://pris.ly/d/custom-engines)).
  Díky `engineType = "client"` výše popsanému nastavení to ale v běžném
  provozu není potřeba - jen `prisma generate`/`migrate` samotné CLI si
  před spuštěním chce ověřit dostupnost enginů, i když je pak fakticky
  nepoužije.
- Bodovací logika je čistě funkční a otestovaná v
  [`lib/scoring.ts`](./lib/scoring.ts) (`computeResultPoints`,
  `computeScorerPointsForMatch`) - snadno se dá pokrýt jednotkovými testy
  (Jest/Vitest), pokud je do projektu později přidáš.
- Middleware (`middleware.ts`) chrání celou sekci `/admin/**` na úrovni
  role (jen ADMIN/SUPERADMIN); konkrétní tým, který smí daný ADMIN
  spravovat, se ověřuje až server-side v jednotlivých API routách
  (`lib/authGuards.ts` → `canAdministerTeam`), nejde tedy obejít úpravou
  URL ani zásahem do UI.
