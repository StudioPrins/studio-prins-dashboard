import Link from "next/link";
import { PageHeader } from "@/components/PageHeader";
import { SyncButton } from "@/components/mail/SyncButton";
import { MailList } from "@/components/mail/MailList";
import { VerstuurdList } from "@/components/mail/VerstuurdList";
import {
  getMailInbox,
  getMailInboxCount,
  getMailCategoryCounts,
  getMailAccountViews,
  getVerstuurdeMails,
  getVerstuurdCount,
  getLeerlusStats,
  type LeerlusStats,
} from "@/lib/queries";
import { MAIL_CATEGORY_STYLES } from "@/lib/status";

const CATEGORY_ORDER = [
  "belangrijk",
  "beantwoorden",
  "nieuwsbrief",
  "notificatie",
  "onbelangrijk",
];

export default async function MailPage({
  searchParams,
}: {
  searchParams: Promise<{ categorie?: string; account?: string; weergave?: string }>;
}) {
  const { categorie, account, weergave } = await searchParams;
  const accountId = account ? Number(account) : undefined;
  const verstuurdView = weergave === "verstuurd";

  // De leerlus-cijfers diffen elk bewaard concept, dus die halen we alleen op
  // voor de Verstuurd-weergave zelf. Het tabtelletje heeft genoeg aan een count.
  const [messages, totalInView, counts, accounts, verstuurd, verstuurdCount, leerlus] =
    await Promise.all([
      getMailInbox({ categorie, accountId }),
      getMailInboxCount({ categorie, accountId }),
      getMailCategoryCounts(),
      getMailAccountViews(),
      verstuurdView ? getVerstuurdeMails({ accountId }) : Promise.resolve([]),
      getVerstuurdCount({ accountId }),
      verstuurdView ? getLeerlusStats({ accountId }) : Promise.resolve(null),
    ]);

  if (accounts.length === 0) {
    return (
      <div className="p-5 sm:p-8 max-w-[1100px] mx-auto">
        <PageHeader title="Mailassistent" subtitle="Nog geen inbox gekoppeld" />
        <div className="card p-12 text-center">
          <p className="text-lg font-medium">Koppel eerst een mailaccount</p>
          <p className="mt-1 text-sm text-muted">
            Voeg je Outlook-inboxen toe via IMAP/SMTP om te beginnen.
          </p>
          <Link href="/mail/instellingen" className="btn btn-primary mt-4 inline-block">
            Naar mailaccounts
          </Link>
        </div>
      </div>
    );
  }

  const buildHref = (cat?: string, acc?: number, view?: "verstuurd") => {
    const p = new URLSearchParams();
    if (cat) p.set("categorie", cat);
    if (acc != null) p.set("account", String(acc));
    if (view) p.set("weergave", view);
    const qs = p.toString();
    return qs ? `/mail?${qs}` : "/mail";
  };

  return (
    <div className="p-5 sm:p-8 max-w-[1100px] mx-auto">
      <PageHeader
        title="Mailassistent"
        subtitle={`${counts.__totaal ?? 0} nieuwe mail${(counts.__totaal ?? 0) === 1 ? "" : "s"}`}
      >
        <Link href="/mail/instellingen" className="btn btn-secondary">
          Accounts
        </Link>
        <SyncButton />
      </PageHeader>

      {/* Categorie-tabs, met de verstuurde mail als aparte weergave erachter */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Tab
          href={buildHref(undefined, accountId)}
          active={!categorie && !verstuurdView}
          label="Alle"
          count={counts.__totaal ?? 0}
        />
        {CATEGORY_ORDER.map((c) => (
          <Tab
            key={c}
            href={buildHref(c, accountId)}
            active={!verstuurdView && categorie === c}
            label={MAIL_CATEGORY_STYLES[c].label}
            count={counts[c] ?? 0}
          />
        ))}
        <span className="w-px my-1 bg-line" aria-hidden />
        <Tab
          href={buildHref(undefined, accountId, "verstuurd")}
          active={verstuurdView}
          label="Verstuurd"
          count={verstuurdCount}
        />
      </div>

      {/* Accountfilter */}
      {accounts.length > 1 && (
        <div className="flex flex-wrap gap-1.5 mb-5">
          <Chip
            href={buildHref(categorie, undefined, verstuurdView ? "verstuurd" : undefined)}
            active={accountId == null}
            label="Alle accounts"
          />
          {accounts.map((a) => (
            <Chip
              key={a.id}
              href={buildHref(categorie, a.id, verstuurdView ? "verstuurd" : undefined)}
              active={accountId === a.id}
              label={a.naam}
            />
          ))}
        </div>
      )}

      {verstuurdView ? (
        <>
          {leerlus && <LeerlusBalk stats={leerlus} />}
          <VerstuurdList messages={verstuurd} />
        </>
      ) : (
        <MailList
          messages={messages}
          filter={{ categorie, accountId }}
          totalInView={totalInView}
          categoryLabel={categorie ? MAIL_CATEGORY_STYLES[categorie]?.label : undefined}
        />
      )}
    </div>
  );
}

/**
 * De cijfers van de leerlus. Hoe vaker een concept ongewijzigd de deur uitgaat,
 * hoe beter de assistent is geworden — dat is de enige maat die telt.
 */
function LeerlusBalk({ stats }: { stats: LeerlusStats }) {
  if (stats.metConcept === 0) return null;

  const aandeel = Math.round((stats.ongewijzigd / stats.metConcept) * 100);
  const gemiddeld = Math.round(stats.gemiddeldeAanpassing * 100);

  return (
    <div className="card px-4 py-3 mb-3 flex flex-wrap items-center gap-x-6 gap-y-2">
      <Cijfer waarde={String(stats.metConcept)} label="met concept verstuurd" />
      <Cijfer waarde={`${aandeel}%`} label="ongewijzigd verstuurd" />
      <Cijfer waarde={`${gemiddeld}%`} label="gemiddeld aangepast" />
      <p className="text-xs text-muted ml-auto max-w-[320px]">
        Elke aanpassing die je hier ziet gaat mee als correctie in de prompt van je volgende
        concept.
      </p>
    </div>
  );
}

function Cijfer({ waarde, label }: { waarde: string; label: string }) {
  return (
    <div>
      <div className="text-lg font-semibold leading-tight">{waarde}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}

function Tab({
  href,
  active,
  label,
  count,
}: {
  href: string;
  active: boolean;
  label: string;
  count: number;
}) {
  return (
    <Link
      href={href}
      className="rounded-full px-3.5 py-1.5 text-sm font-medium whitespace-nowrap transition-colors"
      style={
        active
          ? { background: "var(--accent-soft)", color: "var(--accent-ink)" }
          : { color: "var(--ink-soft)", background: "var(--surface-2)" }
      }
    >
      {label}
      <span className="ml-1.5 text-xs opacity-70">{count}</span>
    </Link>
  );
}

function Chip({ href, active, label }: { href: string; active: boolean; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap"
      style={
        active
          ? { background: "var(--accent)", color: "#fff" }
          : { color: "var(--ink-soft)", background: "var(--surface-2)" }
      }
    >
      {label}
    </Link>
  );
}
