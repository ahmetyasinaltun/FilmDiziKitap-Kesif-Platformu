import { useState } from 'react';

/** Bundan uzun metin kısaltılır: telefonda alttaki bölümlere ulaşmak için çok kaydırmak gerekmesin. */
const LONG_TEXT = 700;

export function ExpandableText({ text, lang }: { text: string; lang?: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > LONG_TEXT;

  return (
    <>
      <p
        lang={lang}
        className={`max-w-[65ch] whitespace-pre-line text-lg leading-relaxed ${
          long && !expanded ? 'line-clamp-[9]' : ''
        }`}
      >
        {text}
      </p>
      {long && (
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="mt-2 flex h-11 cursor-pointer items-center underline underline-offset-4 hover:no-underline"
        >
          {expanded ? 'Daha az göster' : 'Devamını oku'}
        </button>
      )}
    </>
  );
}
