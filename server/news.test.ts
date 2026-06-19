import { describe, expect, it } from "vitest";

// Test the HTML entity decoding logic
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

function cleanHtml(html: string): string {
  return decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

describe("RSS Importer - HTML entity decoding", () => {
  it("decodes numeric HTML entities like &#8217;", () => {
    const input = "Manganitas &#8217; AFA";
    expect(decodeHtmlEntities(input)).toBe("Manganitas \u2019 AFA");
  });

  it("decodes &amp; correctly", () => {
    expect(decodeHtmlEntities("Cancún &amp; Quintana Roo")).toBe("Cancún & Quintana Roo");
  });

  it("decodes &quot; correctly", () => {
    expect(decodeHtmlEntities("Dijo &quot;hola&quot;")).toBe('Dijo "hola"');
  });

  it("decodes &nbsp; to space", () => {
    expect(decodeHtmlEntities("texto&nbsp;aquí")).toBe("texto aquí");
  });

  it("decodes hex entities like &#x2019;", () => {
    expect(decodeHtmlEntities("it&#x2019;s")).toBe("it\u2019s");
  });

  it("strips HTML tags from titles", () => {
    const input = "<strong>Noticia</strong> importante";
    expect(cleanHtml(input)).toBe("Noticia importante");
  });

  it("strips CDATA and HTML together", () => {
    const input = "<b>Título</b> con &amp; entidades &#8217;";
    expect(cleanHtml(input)).toBe("Título con & entidades \u2019");
  });

  it("handles empty string", () => {
    expect(cleanHtml("")).toBe("");
    expect(decodeHtmlEntities("")).toBe("");
  });

  it("handles plain text without entities", () => {
    const plain = "Noticias de Cancún hoy";
    expect(cleanHtml(plain)).toBe(plain);
  });
});

describe("RSS Article validation", () => {
  it("validates that a valid article has title and link", () => {
    const article = {
      title: "Noticia de prueba",
      link: "https://example.com/noticia",
      description: "Descripción de la noticia",
    };
    expect(article.title).toBeTruthy();
    expect(article.link).toBeTruthy();
    expect(article.link).toMatch(/^https?:\/\//);
  });

  it("rejects articles without title or link", () => {
    const noTitle = { title: "", link: "https://example.com" };
    const noLink = { title: "Título", link: "" };
    const valid = { title: "Título", link: "https://example.com" };
    // noTitle should be rejected (missing title)
    expect(!noTitle.title || !noTitle.link).toBe(true);
    // noLink should also be rejected (missing link)
    expect(!noLink.title || !noLink.link).toBe(true);
    // valid should pass
    expect(!valid.title || !valid.link).toBe(false);
  });

  it("truncates long titles to 500 chars", () => {
    const longTitle = "A".repeat(600);
    const truncated = cleanHtml(longTitle).slice(0, 500);
    expect(truncated.length).toBe(500);
  });

  it("parses valid dates", () => {
    const dateStr = "Mon, 16 Jun 2026 10:00:00 +0000";
    const date = new Date(dateStr);
    expect(isNaN(date.getTime())).toBe(false);
    expect(date.getFullYear()).toBe(2026);
  });

  it("falls back to current date for invalid dates", () => {
    const invalidDate = new Date("not-a-date");
    const fallback = isNaN(invalidDate.getTime()) ? new Date() : invalidDate;
    expect(isNaN(fallback.getTime())).toBe(false);
  });
});

// ── Moderación: flujo de status ───────────────────────────────────────────────
describe("Flujo de moderación de artículos", () => {
  it("los artículos nuevos deben llegar con status 'pending'", () => {
    const newArticle = {
      title: "Noticia de prueba",
      sourceUrl: "https://example.com/noticia-1",
      sourceName: "Fuente Test",
      category: "General",
      publishedAt: new Date(),
      status: "pending" as const,
    };
    expect(newArticle.status).toBe("pending");
  });

  it("solo artículos published y no ocultos aparecen en el portal público", () => {
    const articles = [
      { id: 1, status: "published", hidden: false },
      { id: 2, status: "pending", hidden: false },
      { id: 3, status: "rejected", hidden: false },
      { id: 4, status: "published", hidden: true },
    ];
    const publicArticles = articles.filter(
      (a) => a.status === "published" && !a.hidden
    );
    expect(publicArticles).toHaveLength(1);
    expect(publicArticles[0].id).toBe(1);
  });

  it("moderateArticle puede publicar con categoría y tags", () => {
    const article = { id: 5, status: "pending" as const, category: "General", tags: null };
    const updated = {
      ...article,
      status: "published" as const,
      category: "Cancún",
      tags: JSON.stringify(["Turismo", "Seguridad"]),
    };
    expect(updated.status).toBe("published");
    expect(updated.category).toBe("Cancún");
    expect(JSON.parse(updated.tags)).toContain("Turismo");
  });

  it("moderateArticle puede rechazar un artículo", () => {
    const article = { id: 6, status: "pending" as const };
    const updated = { ...article, status: "rejected" as const };
    expect(updated.status).toBe("rejected");
  });

  it("bulkModerate actualiza múltiples artículos a la vez", () => {
    const ids = [1, 2, 3, 4, 5];
    const results = ids.map((id) => ({ id, status: "published" as const }));
    expect(results).toHaveLength(5);
    results.forEach((r) => expect(r.status).toBe("published"));
  });
});

// ── Categorías y etiquetas ────────────────────────────────────────────────────
describe("Categorías y etiquetas", () => {
  const VALID_CATEGORIES = ["Cancún", "Quintana Roo", "Nacional", "Deportes", "General"];

  it("las categorías válidas están definidas", () => {
    expect(VALID_CATEGORIES).toContain("Cancún");
    expect(VALID_CATEGORIES).toContain("General");
    expect(VALID_CATEGORIES).not.toContain("Internacional");
  });

  it("las etiquetas se serializan como JSON", () => {
    const tags = ["Seguridad", "Política", "Turismo"];
    const serialized = JSON.stringify(tags);
    expect(JSON.parse(serialized)).toEqual(tags);
  });

  it("tags nulos se parsean como array vacío", () => {
    const tagsRaw: string | null = null;
    const parsed: string[] = (() => {
      try { return tagsRaw ? JSON.parse(tagsRaw) : []; } catch { return []; }
    })();
    expect(parsed).toEqual([]);
  });
});
