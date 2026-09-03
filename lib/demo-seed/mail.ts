/**
 * Verzonnen mailbox voor de demo. Bevat één account, een stijlprofiel met
 * voorbeelden, en 25 binnengekomen mails verdeeld over de vijf categorieën die
 * de classificatie oplevert.
 *
 * De mails in "beantwoorden" hebben een `aiDraft`. Dat concept is met dezelfde
 * prompt en hetzelfde model gemaakt als in productie, alleen vooraf: zo laat de
 * knop in de demo een echt resultaat zien zonder dat een publieke pagina API-
 * tegoed kan opmaken. Zie de guard in lib/actions/mail.ts.
 */

export type DemoMail = {
  /** Volgorde in de mailbox; wordt ook de IMAP-UID. */
  uid: number;
  fromName: string;
  fromAddress: string;
  subject: string;
  /** Hoeveel uur geleden binnengekomen. */
  urenGeleden: number;
  categorie: "belangrijk" | "beantwoorden" | "nieuwsbrief" | "notificatie" | "onbelangrijk";
  body: string;
  aiDraft?: string;
};

export const DEMO_ACCOUNT = {
  naam: "Studio Prins (demo)",
  email: "hallo@studioprins-demo.nl",
  imapHost: "imap.voorbeeld-provider.nl",
  smtpHost: "smtp.voorbeeld-provider.nl",
  sentFolder: "Verzonden items",
  trashFolder: "Prullenbak",
  styleProfile: `- Aanhef: "Hoi <voornaam>," — altijd de voornaam, altijd jij/jou. Nooit "Beste" of "u".
- Afsluiting: "Groet, Sijmen" of bij klanten die hij langer kent alleen "Sijmen". Geen functietitel of bedrijfsnaam eronder.
- Toon: informeel maar zakelijk, warm zonder overdreven te zijn. Kort. Zegt "even" en "gewoon" veel ("ik pak het even op", "dat kan gewoon").
- Antwoordt eerst op de vraag, pas daarna context. Geen inleidende beleefdheidszin van drie regels.
- Bij planning altijd een concrete dag of termijn, nooit "zo snel mogelijk".
- Typische frasen: "Helder", "Ik zet het op de lijst", "Laat maar weten of dit zo klopt", "Scheelt jou weer werk".
- Opmaak: korte alinea's van één tot drie zinnen, witregel ertussen. Bullets alleen bij drie of meer punten. Geen emoji.`,
  /** Voorbeelden uit de Verzonden-map waaruit dat profiel gedistilleerd is. */
  voorbeelden: [
    {
      toAddress: "marijke@korenbloem-demo.nl",
      subject: "Re: Foto's voor de nieuwe pagina",
      bodyText: `Hoi Marijke,

Helder, ik heb ze binnen. De liggende foto's werken het beste voor de bovenkant van de pagina, die staande gebruik ik verderop.

Ik zet het deze week live en stuur je een linkje zodra je het kunt bekijken.

Groet,
Sijmen`,
    },
    {
      toAddress: "ronald@warmte-en-co-demo.nl",
      subject: "Re: Extra pagina voor onderhoudscontracten",
      bodyText: `Hoi Ronald,

Dat kan gewoon. Ik schat er een uur of drie voor, inclusief de teksten netjes zetten en een formulier eronder.

Ik pak het volgende week dinsdag op, dan staat het woensdag live. Laat maar weten of dit zo klopt.

Groet,
Sijmen`,
    },
    {
      toAddress: "anouk@maasoever-demo.nl",
      subject: "Re: Vergoedingen bijwerken",
      bodyText: `Hoi Anouk,

Ik zet het op de lijst voor deze week.

Handig als je me de nieuwe lijst als tekstbestand stuurt in plaats van een screenshot, dan kan ik het zo overnemen. Scheelt jou weer werk als er volgend jaar weer iets wijzigt.

Sijmen`,
    },
    {
      toAddress: "youssef@zoutkeet-demo.nl",
      subject: "Re: Menukaart winter",
      bodyText: `Hoi Youssef,

Staat live. Ik heb de wintergerechten bovenaan gezet en de zomerkaart eronder weggehaald.

Eén ding: bij twee gerechten stond geen prijs, die heb ik voorlopig leeg gelaten. Stuur je ze even door?

Groet,
Sijmen`,
    },
    {
      toAddress: "sofie@dehaven-demo.nl",
      subject: "Demo van jullie nieuwe site",
      bodyText: `Hoi Sofie,

Ik heb een demo gemaakt van hoe jullie site eruit zou kunnen zien. Je vindt hem hier: de-haven-demo.vercel.app

Het is nog geen definitief ontwerp, meer een idee van de richting. Als het je aanspreekt plan ik graag een keer een half uur in om je wensen door te nemen.

Groet,
Sijmen`,
    },
  ],
};

export const DEMO_MAILS: DemoMail[] = [
  /* --- beantwoorden: persoonlijke mail die om een reactie vraagt ----------- */
  {
    uid: 5001,
    fromName: "Marijke de Vries",
    fromAddress: "marijke@korenbloem-demo.nl",
    subject: "Nieuwe foto's voor het najaar",
    urenGeleden: 3,
    categorie: "beantwoorden",
    body: `Hoi Sijmen,

We hebben afgelopen weekend nieuwe foto's laten maken van het najaarsassortiment. Zou jij die op de site kunnen zetten, net als vorig jaar?

Ik heb ze in een Drive-map gezet, ik stuur de link zo apart. Het zijn er ongeveer twintig, dus zoek er vooral zelf een paar mooie uit — jij hebt daar meer verstand van dan ik.

Is het nog voor het weekend te doen? We beginnen maandag met de pompoenbroodjes.

Groetjes,
Marijke`,
    aiDraft: `Hoi Marijke,

Leuk, die ga ik bekijken. Stuur de link maar door, dan kies ik er een stuk of zes uit die goed werken op de site.

Voor het weekend lukt: ik pak het donderdag op, dan staat het vrijdagochtend live. Ruim op tijd voor de pompoenbroodjes dus.

Groet,
Sijmen`,
  },
  {
    uid: 5002,
    fromName: "Anouk Verlinden",
    fromAddress: "anouk@maasoever-demo.nl",
    subject: "Aanmeldformulier werkt niet goed op mobiel",
    urenGeleden: 7,
    categorie: "beantwoorden",
    body: `Hoi Sijmen,

Een patiënt belde net dat het aanmeldformulier op zijn telefoon niet werkt. Hij kon het laatste veld niet zien, het viel achter het toetsenbord.

Ik heb het zelf geprobeerd op mijn iPhone en ik zie hetzelfde. Op de laptop is er niks aan de hand.

Kun je hier naar kijken? Het is wel vervelend, want de meeste aanmeldingen komen via de telefoon binnen.

Groet,
Anouk`,
    aiDraft: `Hoi Anouk,

Vervelend, daar kijk ik meteen naar. Klinkt alsof het formulier niet meescrollt als het toetsenbord openklapt — dat is een bekend geval op iOS en goed op te lossen.

Ik pak het vandaag nog op en laat je weten zodra het gefixt is. Kun jij het dan even testen op je eigen telefoon?

Groet,
Sijmen`,
  },
  {
    uid: 5003,
    fromName: "Nienke Bos",
    fromAddress: "nienke@atelierbos-demo.nl",
    subject: "Vraag over een webshop",
    urenGeleden: 21,
    categorie: "beantwoorden",
    body: `Hoi Sijmen,

Ik krijg de laatste tijd steeds vaker de vraag of mensen mijn werk online kunnen kopen. Nu verwijs ik ze naar de mail, maar dat kost me best veel tijd.

Ik heb geen idee wat zoiets kost of hoeveel werk het is. Kun je me een indicatie geven? Het gaat om een stuk of vijftien stukken tegelijk, geen enorme voorraad dus.

En moet ik dan zelf iets met verzenden regelen of kan dat automatisch?

Groetjes,
Nienke`,
    aiDraft: `Hoi Nienke,

Goed idee, en met vijftien stukken is het prima behapbaar.

Twee dingen om te weten:

- Voor de betaling koppel ik iets als Mollie aan de site. Je krijgt dan gewoon iDEAL, en je betaalt per transactie een klein bedrag.
- Verzenden blijft handwerk: je krijgt een mailtje bij elke bestelling met het adres erbij, en je maakt zelf het pakket klaar. Automatisch labels printen kan ook, maar dat is bij dit aantal overdreven.

Voor een indicatie moet ik even weten of je zelf stukken wilt kunnen toevoegen en verwijderen, of dat ik dat voor je doe. Dat scheelt in de opzet.

Zullen we een keer bellen? Dan is het in tien minuten duidelijk en stuur ik je daarna een offerte.

Groet,
Sijmen`,
  },
  {
    uid: 5004,
    fromName: "Sofie Willems",
    fromAddress: "sofie@dehaven-demo.nl",
    subject: "Re: Demo van jullie nieuwe site",
    urenGeleden: 30,
    categorie: "beantwoorden",
    body: `Beste Sijmen,

Bedankt voor de demo, die ziet er goed uit. Vooral dat de menukaart meteen zichtbaar is vinden we fijn, dat missen we nu.

We hebben wel een paar vragen:
- Kunnen we zelf de menukaart aanpassen? Die verandert bij ons elke maand.
- Kunnen gasten online reserveren, of moeten ze bellen?
- Wat zou dit ongeveer kosten?

We zitten er serieus over te denken, maar willen wel eerst weten waar we aan toe zijn.

Met vriendelijke groet,
Sofie Willems
Restaurant De Haven`,
    aiDraft: `Hoi Sofie,

Fijn om te horen, en goede vragen. Kort antwoord op alle drie:

De menukaart kun je zelf aanpassen. Je krijgt een simpel scherm waar je gerechten en prijzen kunt wijzigen, zonder dat je iets van techniek hoeft te weten. Dat is bij een maandelijkse kaart echt de moeite waard.

Online reserveren kan. Ik koppel daar meestal een bestaand reserveringssysteem aan in plaats van er zelf een te bouwen; dat werkt beter en is voor jullie goedkoper.

Voor de prijs wil ik eerst weten hoeveel pagina's je precies wilt en of je met foto's komt of dat die gemaakt moeten worden. Zullen we een keer een half uur bellen? Daarna stuur ik je een offerte waar geen verrassingen in zitten.

Groet,
Sijmen`,
  },
  {
    uid: 5005,
    fromName: "Ronald Kuipers",
    fromAddress: "ronald@warmte-en-co-demo.nl",
    subject: "Vraagje over de laatste factuur",
    urenGeleden: 46,
    categorie: "beantwoorden",
    body: `Sijmen,

Factuur binnen, dank je. Eén ding: ik zie 4,5 uur staan voor de referentiepagina, maar volgens mij hadden we het over een uur of drie.

Zit ik ernaast of is er meer werk in gaan zitten? Geen probleem hoor, ik wil het gewoon even snappen voor mijn eigen administratie.

Groet,
Ronald`,
    aiDraft: `Hoi Ronald,

Goed dat je het vraagt, en je zit er niet naast: ik had drie uur ingeschat.

Het is anderhalf uur meer geworden omdat de foto's die je aanleverde allemaal een ander formaat hadden. Die heb ik bijgesneden zodat ze op de pagina netjes uitlijnen, anders werd het een rommeltje.

Ik had je dat moeten laten weten voordat ik doorging. Zal ik dat anderhalve uur van deze factuur halen? Dan is het voor ons allebei duidelijk en let ik er de volgende keer op.

Groet,
Sijmen`,
  },

  /* --- belangrijk: klant, geld of opdracht, maar geen directe vraag ------- */
  {
    uid: 5006,
    fromName: "Tom Bakker",
    fromAddress: "tom@groenrijk-demo.nl",
    subject: "Foto's staan in de map",
    urenGeleden: 11,
    categorie: "belangrijk",
    body: `Hoi Sijmen,

De foto's van de projecten van afgelopen zomer staan in de Drive-map die je had gestuurd. Het zijn er wat meer geworden dan gepland, ik hoop dat dat niet uitmaakt.

De teksten komen volgende week, mijn vrouw is er nog mee bezig.

Groet,
Tom`,
  },
  {
    uid: 5007,
    fromName: "Youssef El Amrani",
    fromAddress: "youssef@zoutkeet-demo.nl",
    subject: "Betaling onderweg",
    urenGeleden: 18,
    categorie: "belangrijk",
    body: `Sijmen,

Factuur 2026-003 is vanochtend overgemaakt. Zou vandaag of morgen op je rekening moeten staan.

Bedankt voor het snelle werk aan de winterkaart.

Youssef`,
  },
  {
    uid: 5008,
    fromName: "Deniz Yildirim",
    fromAddress: "deniz@rijschoolvooruit-demo.nl",
    subject: "Domeinnaam is nog vrij",
    urenGeleden: 27,
    categorie: "belangrijk",
    body: `Hoi Sijmen,

Ik heb gekeken en rijschoolvooruit.nl is nog beschikbaar. Zal ik hem zelf vastleggen of doe jij dat liever?

Het intakeformulier ga ik dit weekend invullen, ik kwam er nog niet aan toe.

Deniz`,
  },
  {
    uid: 5009,
    fromName: "Boekhouding Vermeer",
    fromAddress: "administratie@vermeer-boekhouding-demo.nl",
    subject: "Aangifte omzetbelasting derde kwartaal",
    urenGeleden: 52,
    categorie: "belangrijk",
    body: `Beste Sijmen,

De aangifte omzetbelasting over het derde kwartaal moet uiterlijk eind volgende maand ingediend zijn.

Wil je de facturen en bonnen van juli tot en met september voor de 20e aanleveren? Dan hebben we voldoende tijd om alles te controleren.

Je valt onder de KOR, dus de aangifte zelf is beperkt, maar we hebben de administratie wel nodig voor de inkomstenbelasting.

Met vriendelijke groet,
Boekhouding Vermeer`,
  },
  {
    uid: 5010,
    fromName: "Lotte Prins",
    fromAddress: "lotte@ademruimte-demo.nl",
    subject: "Akkoord op de offerte",
    urenGeleden: 73,
    categorie: "belangrijk",
    body: `Hoi Sijmen,

Ik ga akkoord met de offerte. De aanbetaling maak ik deze week over.

Wanneer zouden we ongeveer kunnen beginnen? Ik zou graag voor het nieuwe seizoen live willen.

Groetjes,
Lotte`,
  },

  /* --- nieuwsbrief -------------------------------------------------------- */
  {
    uid: 5011,
    fromName: "Vercel",
    fromAddress: "newsletter@vercel-demo.com",
    subject: "Ship: what shipped this month",
    urenGeleden: 9,
    categorie: "nieuwsbrief",
    body: `This month on Vercel: faster builds, a new observability dashboard, and improved cron job controls.

Read the full changelog on our blog.

You are receiving this because you signed up for product updates. Unsubscribe from these emails.`,
  },
  {
    uid: 5012,
    fromName: "Smashing Magazine",
    fromAddress: "newsletter@smashing-demo.com",
    subject: "Designing forms people actually finish",
    urenGeleden: 25,
    categorie: "nieuwsbrief",
    body: `In this issue: why multi-step forms outperform long ones, the accessibility trap in custom selects, and a look at how three teams rebuilt their checkout.

Plus: our new workshop schedule for spring.

Unsubscribe | Manage preferences`,
  },
  {
    uid: 5013,
    fromName: "Ondernemersvereniging Rotterdam",
    fromAddress: "nieuws@ov-rotterdam-demo.nl",
    subject: "Netwerkborrel donderdag 12 maart",
    urenGeleden: 34,
    categorie: "nieuwsbrief",
    body: `Beste ondernemer,

Donderdag 12 maart organiseren wij weer onze maandelijkse netwerkborrel, deze keer bij een locatie in Delfshaven.

Aanmelden kan via de link in deze mail. Deelname is gratis voor leden.

U ontvangt deze mail omdat u lid bent. Afmelden voor de nieuwsbrief kan onderaan.`,
  },
  {
    uid: 5014,
    fromName: "Figma",
    fromAddress: "hello@figma-demo.com",
    subject: "New in Figma: variables for typography",
    urenGeleden: 49,
    categorie: "nieuwsbrief",
    body: `Typography variables are now available to everyone. Define your type scale once and reuse it across every file.

We also improved auto layout performance on large files.

Manage your email preferences or unsubscribe.`,
  },
  {
    uid: 5015,
    fromName: "KVK",
    fromAddress: "nieuwsbrief@kvk-demo.nl",
    subject: "Nieuwe regels voor kleine ondernemers",
    urenGeleden: 68,
    categorie: "nieuwsbrief",
    body: `In deze nieuwsbrief: wat er verandert aan de kleineondernemersregeling, en waar je op moet letten bij het factureren aan het buitenland.

Ook: gratis webinar over administratie bijhouden.

Afmelden voor deze nieuwsbrief`,
  },
  {
    uid: 5016,
    fromName: "Tailwind Labs",
    fromAddress: "news@tailwind-demo.com",
    subject: "Tailwind CSS: what is next",
    urenGeleden: 90,
    categorie: "nieuwsbrief",
    body: `A look at what we are working on: better container queries, a rewritten docs site, and the roadmap for the next release.

You can unsubscribe from these updates at any time.`,
  },

  /* --- notificatie: geautomatiseerde systeemmail -------------------------- */
  {
    uid: 5017,
    fromName: "Vercel",
    fromAddress: "no-reply@vercel-demo.com",
    subject: "Deployment ready — studio-prins-dashboard",
    urenGeleden: 2,
    categorie: "notificatie",
    body: `Your deployment is ready.

Project: studio-prins-dashboard
Branch: main
Status: Ready
Duration: 47s

View deployment. This is an automated message; replies are not monitored.`,
  },
  {
    uid: 5018,
    fromName: "Mollie",
    fromAddress: "no-reply@mollie-demo.com",
    subject: "Betaling ontvangen: 895,00 EUR",
    urenGeleden: 19,
    categorie: "notificatie",
    body: `Er is een betaling bijgeschreven.

Bedrag: 895,00 EUR
Omschrijving: Factuur 2026-003
Status: Betaald

Dit is een automatisch bericht. Reageren op dit adres heeft geen zin.`,
  },
  {
    uid: 5019,
    fromName: "Neon",
    fromAddress: "notifications@neon-demo.tech",
    subject: "Your project is at 72% of its storage limit",
    urenGeleden: 38,
    categorie: "notificatie",
    body: `Project: studio-prins-dashboard
Storage used: 0.36 GB of 0.5 GB (72%)

No action is required yet. You will receive another notification at 90%.

Do not reply to this email.`,
  },
  {
    uid: 5020,
    fromName: "TransIP",
    fromAddress: "noreply@transip-demo.nl",
    subject: "Domein korenbloem.nl is verlengd",
    urenGeleden: 57,
    categorie: "notificatie",
    body: `Het domein korenbloem.nl is automatisch verlengd voor een periode van één jaar.

Nieuwe vervaldatum: over 12 maanden.
Het bedrag is afgeschreven van de gekoppelde rekening.

Dit bericht is automatisch verstuurd.`,
  },
  {
    uid: 5021,
    fromName: "GitHub",
    fromAddress: "noreply@github-demo.com",
    subject: "New sign-in from Chrome on Windows",
    urenGeleden: 81,
    categorie: "notificatie",
    body: `We noticed a new sign-in to your account.

Device: Chrome on Windows
Location: Rotterdam, NL

If this was you, no action is needed. If not, secure your account immediately.`,
  },

  /* --- onbelangrijk: spam en cold outreach -------------------------------- */
  {
    uid: 5022,
    fromName: "Growth Partners",
    fromAddress: "sales@growthpartners-demo.biz",
    subject: "Sijmen, jullie website scoort slecht in Google",
    urenGeleden: 5,
    categorie: "onbelangrijk",
    body: `Beste Sijmen,

Ik heb een gratis SEO-scan gedaan op jullie website en zag direct 14 kritieke fouten die jullie posities kosten.

Zonder ingrijpen loopt u maandelijks omzet mis. Ik heb donderdag om 10:00 of 14:00 een half uur vrij voor een vrijblijvend gesprek.

Welk tijdstip komt u het beste uit?

Met vriendelijke groet,
Growth Partners`,
  },
  {
    uid: 5023,
    fromName: "Vikram S.",
    fromAddress: "vikram@offshore-webdev-demo.com",
    subject: "Website development at 70% lower cost",
    urenGeleden: 29,
    categorie: "onbelangrijk",
    body: `Hello,

We are a team of 40 developers specialising in WordPress, Shopify and custom web development.

We can work as your white-label partner at a fraction of your current cost. Our rates start at 12 USD per hour.

Would you be available for a short call this week?

Best regards,
Vikram`,
  },
  {
    uid: 5024,
    fromName: "Talent Scout NL",
    fromAddress: "recruitment@talentscout-demo.nl",
    subject: "Interessante functie voor jou",
    urenGeleden: 44,
    categorie: "onbelangrijk",
    body: `Hoi,

Ik kwam jouw profiel tegen en dacht meteen aan een vacature die ik nu in behandeling heb. Een snelgroeiende scale-up zoekt een frontend developer.

Sta je open voor een vrijblijvend gesprek? Dan bel ik je graag even.

Groet,
Talent Scout NL`,
  },
  {
    uid: 5025,
    fromName: "Pakketservice",
    fromAddress: "info@pakket-bezorging-demo.net",
    subject: "Uw pakket kon niet worden bezorgd",
    urenGeleden: 63,
    categorie: "onbelangrijk",
    body: `Geachte klant,

Uw pakket kon niet worden bezorgd wegens onvoldoende portokosten. Betaal binnen 24 uur 1,95 euro om bezorging opnieuw in te plannen.

Klik op de link om te betalen.

Met vriendelijke groet,
Pakketservice`,
  },
];
