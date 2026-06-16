import { RssSource } from "../drizzle/schema";
import { updateRssSourceLastFetched, upsertArticle } from "./db-news";

interface RssItem {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
  enclosure?: { url?: string };
  "media:content"?: { $?: { url?: string } };
  "media:thumbnail"?: { $?: { url?: string } };
}

interface ParsedFeed {
  items: RssItem[];
}

/**
 * Parsea un feed RSS usando el XML del servidor sin dependencias externas.
 */
async function parseFeed(url: string): Promise<ParsedFeed> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "CancunAlMinuto/1.0 RSS Reader" },
    });
    clearTimeout(timeout);

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const xml = await res.text();
    return parseXml(xml);
  } catch (err) {
    clearTimeout(timeout);
    throw err;
  }
}

function parseXml(xml: string): ParsedFeed {
  const items: RssItem[] = [];

  // Extract <item> blocks
  const itemRegex = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const item: RssItem = {
      title: extractTag(block, "title"),
      link: extractTag(block, "link") || extractTag(block, "guid"),
      description: extractTag(block, "description") || extractTag(block, "content:encoded"),
      pubDate: extractTag(block, "pubDate") || extractTag(block, "dc:date"),
    };

    // Try to extract image from enclosure or media tags
    const enclosureUrl = extractAttr(block, "enclosure", "url");
    const mediaContentUrl = extractAttr(block, "media:content", "url");
    const mediaThumbnailUrl = extractAttr(block, "media:thumbnail", "url");

    const imageUrl = enclosureUrl || mediaContentUrl || mediaThumbnailUrl || extractImageFromHtml(item.description || "");

    if (imageUrl) {
      item.enclosure = { url: imageUrl };
    }

    if (item.title && item.link) {
      items.push(item);
    }
  }

  return { items };
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractAttr(xml: string, tag: string, attr: string): string {
  const regex = new RegExp(`<${tag}[^>]*${attr}=["']([^"']+)["'][^>]*>`, "i");
  const match = xml.match(regex);
  return match ? match[1].trim() : "";
}

function extractImageFromHtml(html: string): string {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match ? match[1] : "";
}

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

/**
 * Importa artículos de todas las fuentes RSS activas.
 */
export async function fetchAndImportRss(sources: RssSource[]): Promise<{ total: number; sources: string[] }> {
  let total = 0;
  const importedSources: string[] = [];

  for (const source of sources) {
    try {
      const feed = await parseFeed(source.url);

      for (const item of feed.items) {
        const publishedAt = item.pubDate ? new Date(item.pubDate) : new Date();
        const excerpt = cleanHtml(item.description || "").slice(0, 500);

        await upsertArticle({
          title: cleanHtml(item.title).slice(0, 500),
          excerpt: excerpt || null,
          content: item.description || null,
          imageUrl: item.enclosure?.url || null,
          sourceUrl: item.link,
          sourceName: source.name,
          category: source.category,
          publishedAt: isNaN(publishedAt.getTime()) ? new Date() : publishedAt,
        });

        total++;
      }

      await updateRssSourceLastFetched(source.id);
      importedSources.push(source.name);
      console.log(`[RSS] Imported ${feed.items.length} items from ${source.name}`);
    } catch (err) {
      console.error(`[RSS] Failed to fetch ${source.name} (${source.url}):`, err);
    }
  }

  return { total, sources: importedSources };
}
