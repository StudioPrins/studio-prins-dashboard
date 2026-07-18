import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import { BEDRIJF } from "@/lib/bedrijf";
import { LOGO_DATA_URI } from "@/lib/pdf/logo";
import { formatCents, formatDate } from "@/lib/format";
import { lineTotalCents } from "@/lib/invoice-calc";
import type { InvoiceWithTotals } from "@/lib/queries";

const INK = "#17161b";
const MUTED = "#78767f";
const LINE = "#e2ded7";

const s = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    color: INK,
    fontFamily: "Helvetica",
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 36,
  },
  brand: { fontSize: 15, fontFamily: "Helvetica-Bold" },
  tagline: { color: MUTED, fontSize: 9 },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  docNr: { color: MUTED, fontSize: 10 },
  logo: { width: 120, objectFit: "contain" },
  cols: { flexDirection: "row", justifyContent: "space-between", marginBottom: 28 },
  col: { width: "48%" },
  labelSmall: {
    fontSize: 8,
    color: MUTED,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 3,
  },
  bold: { fontFamily: "Helvetica-Bold" },
  meta: { flexDirection: "row", gap: 24, marginBottom: 20 },
  tableHead: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: INK,
    paddingBottom: 5,
    color: MUTED,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: LINE,
    paddingVertical: 6,
  },
  cDesc: { flex: 1 },
  cQty: { width: 55, textAlign: "right" },
  cPrice: { width: 80, textAlign: "right" },
  cTotal: { width: 80, textAlign: "right" },
  totals: { alignItems: "flex-end", marginTop: 18 },
  totalsBox: { width: 220 },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalsGrand: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: INK,
    marginTop: 5,
    paddingTop: 6,
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
  },
  notitie: { marginTop: 22, color: "#45434d" },
  kor: {
    marginTop: 16,
    fontSize: 9,
    color: MUTED,
    fontFamily: "Helvetica-Oblique",
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 48,
    right: 48,
    borderTopWidth: 1,
    borderTopColor: LINE,
    paddingTop: 8,
    flexDirection: "row",
    gap: 18,
    fontSize: 8,
    color: MUTED,
  },
});

export function InvoicePdf({ invoice }: { invoice: InvoiceWithTotals }) {
  const titel = invoice.type === "offerte" ? "Offerte" : "Factuur";
  const address = [BEDRIJF.postcode, BEDRIJF.plaats].filter(Boolean).join(" ");

  return (
    <Document title={`${titel} ${invoice.nummer}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.docTitle}>{titel}</Text>
            <Text style={s.docNr}>{invoice.nummer}</Text>
          </View>
          {/* Logo rechtsboven */}
          <Image src={LOGO_DATA_URI} style={s.logo} />
        </View>

        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.labelSmall}>Van</Text>
            <Text style={s.bold}>{BEDRIJF.naam}</Text>
            {!!BEDRIJF.adres && <Text>{BEDRIJF.adres}</Text>}
            {!!address && <Text>{address}</Text>}
            <Text>{BEDRIJF.email}</Text>
            {!!BEDRIJF.telefoon && <Text>{BEDRIJF.telefoon}</Text>}
          </View>
          <View style={s.col}>
            <Text style={s.labelSmall}>Aan</Text>
            <Text style={s.bold}>{invoice.ontvangerBedrijf}</Text>
            {!!invoice.ontvangerContact && <Text>{invoice.ontvangerContact}</Text>}
            {!!invoice.ontvangerAdres && <Text>{invoice.ontvangerAdres}</Text>}
            {!!invoice.ontvangerEmail && <Text>{invoice.ontvangerEmail}</Text>}
          </View>
        </View>

        <View style={s.meta}>
          <Text>
            <Text style={{ color: MUTED }}>Datum: </Text>
            {formatDate(invoice.datum)}
          </Text>
          {!!invoice.vervaldatum && (
            <Text>
              <Text style={{ color: MUTED }}>Vervaldatum: </Text>
              {formatDate(invoice.vervaldatum)}
            </Text>
          )}
        </View>

        <View style={s.tableHead}>
          <Text style={s.cDesc}>Omschrijving</Text>
          <Text style={s.cQty}>Aantal</Text>
          <Text style={s.cPrice}>Prijs</Text>
          <Text style={s.cTotal}>Totaal</Text>
        </View>
        {invoice.lines.map((l) => (
          <View style={s.row} key={l.id} wrap={false}>
            <Text style={s.cDesc}>{l.omschrijving}</Text>
            <Text style={s.cQty}>{l.aantal}</Text>
            <Text style={s.cPrice}>{formatCents(l.prijsCents)}</Text>
            <Text style={s.cTotal}>{formatCents(lineTotalCents(l.aantal, l.prijsCents))}</Text>
          </View>
        ))}

        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totalsRow}>
              <Text style={{ color: MUTED }}>Subtotaal</Text>
              <Text>{formatCents(invoice.totals.subtotaalCents)}</Text>
            </View>
            {invoice.btwPercentage > 0 && (
              <View style={s.totalsRow}>
                <Text style={{ color: MUTED }}>Btw ({invoice.btwPercentage}%)</Text>
                <Text>{formatCents(invoice.totals.btwCents)}</Text>
              </View>
            )}
            <View style={s.totalsGrand}>
              <Text>Totaal</Text>
              <Text>{formatCents(invoice.totals.totaalCents)}</Text>
            </View>
          </View>
        </View>

        {!!invoice.notitie && <Text style={s.notitie}>{invoice.notitie}</Text>}

        {invoice.btwPercentage === 0 && BEDRIJF.kor && (
          <Text style={s.kor}>{BEDRIJF.korVermelding}</Text>
        )}

        <View style={s.footer} fixed>
          {!!BEDRIJF.iban && <Text>IBAN: {BEDRIJF.iban}</Text>}
          {!!BEDRIJF.kvk && <Text>KVK: {BEDRIJF.kvk}</Text>}
          {!!BEDRIJF.btw && <Text>Btw: {BEDRIJF.btw}</Text>}
        </View>
      </Page>
    </Document>
  );
}
