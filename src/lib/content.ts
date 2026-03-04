import { readFileSync } from "node:fs";
import path from "node:path";
import { cache } from "react";

export type Artwork = {
  id: string;
  title: string;
  author: string;
  year: number;
  color: string;
  dimensions: string;
  image: string;
};

export type SiteContent = {
  name: string;
  tagline: string;
  hero: {
    headline: string;
    subheadline: string;
    image: string;
    primaryCta: string;
    secondaryCta: string;
  };
  about: string[];
  licensing: string[];
  contactEmail: string;
  galleryIntro: string;
  artworks: Artwork[];
};

const SOURCE_PATH = path.join(process.cwd(), "sourcematerial.md");

const FALLBACK_CONTENT: SiteContent = {
  name: "Galaxy Graphics",
  tagline: "Art + Function",
  hero: {
    headline: "Beautiful Art for Modern Brands",
    subheadline:
      "We blend expressive art direction with production-ready visual systems for digital and physical experiences.",
    image: "/hero.jpeg",
    primaryCta: "Gallery",
    secondaryCta: "Contact Us"
  },
  about: [
    "Galaxy Graphics creates premium visual collections for teams that need both beauty and utility."
  ],
  licensing: [
    "All artworks in this collection are available with clear commercial licensing."
  ],
  contactEmail: "contact@galaxygraphics.co",
  galleryIntro:
    "Explore a curated set of placeholder pieces and build your own selection for export.",
  artworks: [
    {
      id: "art-001",
      title: "Cobalt Drift",
      author: "A. Mercer",
      year: 2022,
      color: "Blue",
      dimensions: "24 x 36 in",
      image: "/gallery/cobalt-drift.svg"
    }
  ]
};

const escapeRegex = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const extractSection = (markdown: string, sectionName: string): string => {
  const sectionPattern = new RegExp(
    `##\\s+${escapeRegex(sectionName)}\\s*\\n([\\s\\S]*?)(?=\\n##\\s+|$)`,
    "i"
  );
  const match = markdown.match(sectionPattern);
  return match?.[1]?.trim() ?? "";
};

const extractValue = (section: string, fieldName: string): string => {
  const fieldPattern = new RegExp(`^${escapeRegex(fieldName)}:\\s*(.+)$`, "im");
  const match = section.match(fieldPattern);
  return match?.[1]?.trim() ?? "";
};

const parseParagraphs = (section: string): string[] => {
  if (!section) {
    return [];
  }

  return section
    .replace(/```[\s\S]*?```/g, "")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/^[-*]\s+/gm, "").replace(/\n+/g, " ").trim())
    .filter((block) => block.length > 0);
};

const parseArtworks = (gallerySection: string): Artwork[] => {
  const jsonMatch = gallerySection.match(/```json\s*([\s\S]*?)```/i);
  if (!jsonMatch?.[1]) {
    return FALLBACK_CONTENT.artworks;
  }

  try {
    const parsed = JSON.parse(jsonMatch[1]) as unknown;
    if (!Array.isArray(parsed)) {
      return FALLBACK_CONTENT.artworks;
    }

    const mapped = parsed
      .map((item): Artwork | null => {
        if (
          typeof item !== "object" ||
          item === null ||
          typeof (item as Record<string, unknown>).id !== "string" ||
          typeof (item as Record<string, unknown>).title !== "string" ||
          typeof (item as Record<string, unknown>).author !== "string" ||
          typeof (item as Record<string, unknown>).year !== "number" ||
          typeof (item as Record<string, unknown>).color !== "string" ||
          typeof (item as Record<string, unknown>).dimensions !== "string" ||
          typeof (item as Record<string, unknown>).image !== "string"
        ) {
          return null;
        }

        const value = item as {
          id: string;
          title: string;
          author: string;
          year: number;
          color: string;
          dimensions: string;
          image: string;
        };

        return {
          id: value.id,
          title: value.title,
          author: value.author,
          year: value.year,
          color: value.color,
          dimensions: value.dimensions,
          image: value.image
        };
      })
      .filter((item): item is Artwork => item !== null);

    return mapped.length > 0 ? mapped : FALLBACK_CONTENT.artworks;
  } catch {
    return FALLBACK_CONTENT.artworks;
  }
};

export const getSiteContent = cache((): SiteContent => {
  let markdown = "";

  try {
    markdown = readFileSync(SOURCE_PATH, "utf8");
  } catch {
    return FALLBACK_CONTENT;
  }

  if (!markdown.trim()) {
    return FALLBACK_CONTENT;
  }

  const brandSection = extractSection(markdown, "Brand");
  const heroSection = extractSection(markdown, "Hero");
  const aboutSection = extractSection(markdown, "About");
  const licensingSection = extractSection(markdown, "Licensing");
  const contactSection = extractSection(markdown, "Contact");
  const gallerySection = extractSection(markdown, "Gallery");

  const aboutParagraphs = parseParagraphs(aboutSection);
  const licensingParagraphs = parseParagraphs(licensingSection);

  return {
    name: extractValue(brandSection, "Name") || FALLBACK_CONTENT.name,
    tagline: extractValue(brandSection, "Tagline") || FALLBACK_CONTENT.tagline,
    hero: {
      headline:
        extractValue(heroSection, "Headline") || FALLBACK_CONTENT.hero.headline,
      subheadline:
        extractValue(heroSection, "Subheadline") ||
        FALLBACK_CONTENT.hero.subheadline,
      image: extractValue(heroSection, "Image") || FALLBACK_CONTENT.hero.image,
      primaryCta:
        extractValue(heroSection, "PrimaryCTA") ||
        FALLBACK_CONTENT.hero.primaryCta,
      secondaryCta:
        extractValue(heroSection, "SecondaryCTA") ||
        FALLBACK_CONTENT.hero.secondaryCta
    },
    about: aboutParagraphs.length > 0 ? aboutParagraphs : FALLBACK_CONTENT.about,
    licensing:
      licensingParagraphs.length > 0
        ? licensingParagraphs
        : FALLBACK_CONTENT.licensing,
    contactEmail:
      extractValue(contactSection, "Email") || FALLBACK_CONTENT.contactEmail,
    galleryIntro:
      extractValue(gallerySection, "Intro") || FALLBACK_CONTENT.galleryIntro,
    artworks: parseArtworks(gallerySection)
  };
});
