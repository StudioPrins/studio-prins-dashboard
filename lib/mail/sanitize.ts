import "server-only";
import sanitizeHtml from "sanitize-html";

/**
 * Maakt HTML uit een e-mail veilig om te tonen. Verwijdert scripts, event
 * handlers, forms en dergelijke, en strip externe afbeeldingen (privacy: geen
 * tracking-pixels). Bedoeld om daarna in een <iframe sandbox srcDoc> te tonen —
 * dubbele verdediging.
 */
export function sanitizeEmailHtml(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "div", "span", "a", "b", "strong", "i", "em", "u", "s",
      "ul", "ol", "li", "blockquote", "pre", "code",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "table", "thead", "tbody", "tr", "td", "th",
      "img", "hr",
    ],
    allowedAttributes: {
      a: ["href", "title"],
      img: ["alt", "width", "height"],
      "*": ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
        "background-color": [/^#(0x)?[0-9a-f]+$/i, /^rgb\(/, /^[a-z]+$/i],
        "text-align": [/^left$/, /^right$/, /^center$/],
        "font-weight": [/^bold$/, /^normal$/, /^\d+$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    // Externe afbeeldingen niet laden: src wordt verwijderd.
    transformTags: {
      img: (tagName, attribs) => {
        const rest = { ...attribs };
        delete rest.src;
        return { tagName, attribs: rest };
      },
      a: (tagName, attribs) => ({
        tagName,
        attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
      }),
    },
    disallowedTagsMode: "discard",
  });
}
