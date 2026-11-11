import "server-only";

import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";
import { createElement } from "react";

import { OG_SIZE } from "./constants";
import { OG_ICONS, type OgIcon } from "./icons";

/**
 * Shared look of the Open Graph images (link previews in messengers, social media, search).
 * Every `opengraph-image.tsx` renders this template with its own title, description, and icon.
 * Satori can't read variable fonts, so `Geist-*.ttf` are static instances of
 * `public/fonts/Geist.ttf` (Latin subset). Their kerning table (GPOS) is removed: Satori
 * misapplies it around spaces, which shows as wide gaps between some words.
 */

// Colors of the light theme (`src/app/globals.css`), as hex for Satori
const COLORS = {
  background: "#fafafa",
  foreground: "#09090b",
  muted: "#71717a",
  border: "#e4e4e7",
  primary: "#8199a9",
};

const ASSETS = join(process.cwd(), "src/lib/og");
const assets = Promise.all([
  readFile(join(ASSETS, "Geist-Regular.ttf")),
  readFile(join(ASSETS, "Geist-ExtraBold.ttf")),
  readFile(join(ASSETS, "logo.png")),
]);

export async function ogImage({
  title,
  description,
  icon,
  tags,
}: {
  title: string;
  description?: string;
  /** Section icon, top right */
  icon?: OgIcon;
  /** Small labels at the bottom, e.g. the sections on the default image */
  tags?: string[];
}) {
  const [regular, extraBold, logo] = await assets;
  const logoSource = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "64px 72px",
        backgroundColor: COLORS.background,
        color: COLORS.foreground,
        fontFamily: "Geist",
        position: "relative",
      }}
    >
      {/* Large faded logo as background motif */}
      {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori, not the browser */}
      <img
        src={logoSource}
        alt=""
        width={560}
        height={560}
        style={{
          position: "absolute",
          right: -120,
          bottom: -150,
          opacity: 0.05,
        }}
      />
      {/* Brand bar at the left edge */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 16,
          backgroundColor: COLORS.primary,
        }}
      />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by Satori */}
          <img src={logoSource} alt="" width={72} height={72} />
          <div style={{ display: "flex", fontSize: 40, fontWeight: 400 }}>
            <span style={{ color: COLORS.primary, fontWeight: 800 }}>Ulm</span>
            <span>iversität</span>
          </div>
        </div>
        {icon ? (
          <svg
            width={96}
            height={96}
            viewBox="0 0 24 24"
            fill="none"
            stroke={COLORS.primary}
            strokeWidth={1.75}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {OG_ICONS[icon].map(([tag, attributes], index) =>
              createElement(tag, { key: index, ...attributes }),
            )}
          </svg>
        ) : (
          <Domain />
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div
          style={{
            fontSize: title.length > 32 ? 64 : 84,
            fontWeight: 800,
            lineHeight: 1.05,
            letterSpacing: -2,
            maxWidth: 1000,
            textWrap: "balance",
          }}
        >
          {title}
        </div>
        {description && (
          <div
            style={{
              fontSize: 34,
              lineHeight: 1.35,
              color: COLORS.muted,
              maxWidth: 960,
              lineClamp: 3,
            }}
          >
            {description}
          </div>
        )}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: `2px solid ${COLORS.border}`,
          paddingTop: 28,
          fontSize: 26,
          color: COLORS.muted,
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          {tags?.map((tag) => (
            <div
              key={tag}
              style={{
                display: "flex",
                padding: "6px 16px",
                borderRadius: 999,
                border: `2px solid ${COLORS.border}`,
                backgroundColor: "#ffffff",
                color: COLORS.foreground,
              }}
            >
              {tag}
            </div>
          ))}
        </div>
        {icon && <Domain />}
      </div>
    </div>,
    {
      ...OG_SIZE,
      fonts: [
        { name: "Geist", data: regular, weight: 400, style: "normal" },
        { name: "Geist", data: extraBold, weight: 800, style: "normal" },
      ],
    },
  );
}

function Domain() {
  return (
    <div
      style={{
        display: "flex",
        fontSize: 26,
        fontWeight: 800,
        color: COLORS.muted,
      }}
    >
      ulmiversitaet.de
    </div>
  );
}
