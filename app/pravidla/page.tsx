import { redirect } from "next/navigation";
import { getCurrentSession } from "@/lib/authGuards";

export default async function RulesPage() {
  const session = await getCurrentSession();
  if (!session?.user) redirect("/login");

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-club-primary">
        Pravidla bodování
      </h1>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">1. Body za tip na výsledek</h2>
        <p className="text-sm text-gray-700">
          Počítá se jen ta nejlepší shoda (body se nesčítají):
        </p>
        <ul className="text-sm space-y-1">
          <li>
            <span className="font-bold text-club-primary">5 bodů</span> –
            uhodl(a) jsi přesný výsledek (např. tip 2:1 a padlo 2:1).
          </li>
          <li>
            <span className="font-bold text-club-primary">3 body</span> –
            přesný výsledek ne, ale uhodl(a) jsi správný rozdíl branek (např.
            tip 2:1, padlo 3:2 – v obou případech vedeme o 1 gól).
          </li>
          <li>
            <span className="font-bold text-club-primary">1 bod</span> –
            rozdíl ne, ale uhodl(a) jsi aspoň, jestli to bude výhra, remíza
            nebo prohra.
          </li>
          <li>
            <span className="font-bold text-club-primary">0 bodů</span> –
            netrefil(a) jsi ani výsledek zápasu (výhra/remíza/prohra).
          </li>
        </ul>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">2. Body za tip na střelce</h2>
        <p className="text-sm text-gray-700">
          Kromě výsledku tipuješ i to, kdo z našeho týmu dá gól (nebo že
          nikdo z nás gól nedá). Pokud uhodneš, dostaneš{" "}
          <span className="font-bold text-club-primary">2 až 5 bodů</span> –
          a je to spravedlivé i k odvážným tipům:
        </p>
        <ul className="text-sm space-y-1">
          <li>
            Čím <span className="font-semibold">méně lidí</span> tipovalo
            stejného hráče jako ty, tím víc bodů dostaneš, pokud to vyjde. Tip
            na jasného favorita, kterého tipuje "každý", vynese méně bodů,
            protože to nebyl žádný risk.
          </li>
          <li>
            Tip na hráče, kterého tipoval(a) jen málokdo (nebo nikdo jiný),
            vynese víc bodů, pokud vyjde – klidně i celých 5 – protože jsi
            šel(šla) s kůží na trh.
          </li>
          <li>
            I když trefíš úplně stejného střelce jako všichni ostatní, vždycky
            dostaneš aspoň{" "}
            <span className="font-semibold">2 body</span> za správný tip –
            nikdy ne 0.
          </li>
          <li>
            Netrefený tip na střelce = <span className="font-semibold">0 bodů</span>{" "}
            za tuto část (výsledek se počítá zvlášť, viz výše).
          </li>
        </ul>
        <p className="text-sm text-gray-600 italic">
          Příklad: na zápas tipovalo střelce 5 lidí. 4 z vás tipovali
          útočníka Nováka, 1 z vás tipoval obránce Svobodu. Oba dají gól.
          Ti, co tipovali Nováka, dostanou méně bodů (byl to bezpečný, hodně
          tipovaný tip), zatímco ten, co tipoval Svobodu, dostane bodů víc –
          protože to byl vzácnější, odvážnější tip.
        </p>
      </section>

      <section className="card space-y-3">
        <h2 className="text-lg font-semibold">3. Celkové body</h2>
        <p className="text-sm text-gray-700">
          Tvoje celkové body za zápas jsou prostě součet bodů za výsledek a
          bodů za střelce. Ty se pak sčítají přes všechny zápasy a promítají
          se do Žebříčku – jak celkově, tak po jednotlivých kolech.
        </p>
      </section>
    </div>
  );
}
