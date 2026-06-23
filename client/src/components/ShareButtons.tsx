import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  imageUrl?: string;
  /** Si es true, muestra los botones siempre; si es false (default), aparecen al hacer hover */
  alwaysVisible?: boolean;
}

function encodeShare(text: string) {
  return encodeURIComponent(text);
}

/**
 * Intenta compartir en Instagram Stories usando la mejor estrategia disponible:
 * 1. En móvil con Web Share API + soporte de archivos → descarga imagen y comparte nativamente
 * 2. En móvil sin Web Share API → abre la cámara de Instagram Stories (instagram://story-camera)
 * 3. En desktop → muestra tooltip explicativo de que solo funciona en móvil
 */
async function shareToInstagramStories(
  e: React.MouseEvent,
  imageUrl: string | undefined,
  title: string,
  articleUrl: string
) {
  e.preventDefault();
  e.stopPropagation();

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  if (!isMobile) {
    alert("Para compartir en Instagram Stories, abre esta noticia desde tu teléfono.");
    return;
  }

  // Estrategia 1: Web Share API con archivos (Chrome Android, Safari iOS 15+)
  if (navigator.share && navigator.canShare) {
    try {
      if (imageUrl) {
        // Descargar la imagen y convertirla a File
        const response = await fetch(imageUrl);
        const blob = await response.blob();
        const mimeType = blob.type || "image/jpeg";
        const ext = mimeType.includes("png") ? "png" : "jpg";
        const file = new File([blob], `noticia.${ext}`, { type: mimeType });

        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: title,
            text: `${title} — Cancún al Minuto\n${articleUrl}`,
          });
          return;
        }
      }

      // Sin imagen: compartir solo texto/url
      if (navigator.canShare({ url: articleUrl })) {
        await navigator.share({ title, url: articleUrl, text: `${title} — Cancún al Minuto` });
        return;
      }
    } catch (err: any) {
      // El usuario canceló el diálogo nativo — no hacer nada
      if (err?.name === "AbortError") return;
      // Otro error: caer al siguiente método
    }
  }

  // Estrategia 2: Deep link instagram://story-camera (abre la cámara de Stories)
  // La última imagen del carrete quedará preseleccionada si se descargó antes
  window.location.href = "instagram://story-camera";
}

export function ShareButtons({ url, title, imageUrl, alwaysVisible = false }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [igLoading, setIgLoading] = useState(false);

  const shareText = `${title} — Cancún al Minuto`;

  const links = {
    whatsapp: `https://wa.me/?text=${encodeShare(`${shareText}\n${url}`)}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeShare(url)}&quote=${encodeShare(shareText)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeShare(shareText)}&url=${encodeShare(url)}`,
    telegram: `https://t.me/share/url?url=${encodeShare(url)}&text=${encodeShare(shareText)}`,
  };

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleShare = (e: React.MouseEvent, shareUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const handleInstagram = async (e: React.MouseEvent) => {
    setIgLoading(true);
    try {
      await shareToInstagramStories(e, imageUrl, title, url);
    } finally {
      setIgLoading(false);
    }
  };

  return (
    <div
      className={`flex items-center gap-1 transition-all duration-200 ${
        alwaysVisible ? "opacity-100" : "opacity-0 group-hover:opacity-100"
      }`}
      onClick={(e) => e.preventDefault()}
    >
      {/* WhatsApp */}
      <button
        onClick={(e) => handleShare(e, links.whatsapp)}
        title="Compartir en WhatsApp"
        className="h-7 w-7 flex items-center justify-center rounded-full bg-[#25D366] hover:bg-[#1ebe5d] text-white transition-all duration-150 active:scale-95 shrink-0"
        aria-label="Compartir en WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
      </button>

      {/* Facebook */}
      <button
        onClick={(e) => handleShare(e, links.facebook)}
        title="Compartir en Facebook"
        className="h-7 w-7 flex items-center justify-center rounded-full bg-[#1877F2] hover:bg-[#0d6ee0] text-white transition-all duration-150 active:scale-95 shrink-0"
        aria-label="Compartir en Facebook"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      </button>

      {/* X / Twitter */}
      <button
        onClick={(e) => handleShare(e, links.twitter)}
        title="Compartir en X (Twitter)"
        className="h-7 w-7 flex items-center justify-center rounded-full bg-black hover:bg-slate-800 text-white transition-all duration-150 active:scale-95 shrink-0"
        aria-label="Compartir en X"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.73-8.835L1.254 2.25H8.08l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z"/>
        </svg>
      </button>

      {/* Telegram */}
      <button
        onClick={(e) => handleShare(e, links.telegram)}
        title="Compartir en Telegram"
        className="h-7 w-7 flex items-center justify-center rounded-full bg-[#2AABEE] hover:bg-[#1a9bde] text-white transition-all duration-150 active:scale-95 shrink-0"
        aria-label="Compartir en Telegram"
      >
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
        </svg>
      </button>

      {/* Instagram Stories */}
      <button
        onClick={handleInstagram}
        disabled={igLoading}
        title="Compartir en Instagram Stories"
        className="h-7 w-7 flex items-center justify-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] hover:opacity-90 text-white transition-all duration-150 active:scale-95 shrink-0 disabled:opacity-60"
        aria-label="Compartir en Instagram Stories"
      >
        {igLoading ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 animate-spin fill-none stroke-current stroke-2">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.3" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
          </svg>
        )}
      </button>

      {/* Copiar enlace */}
      <button
        onClick={handleCopy}
        title={copied ? "¡Copiado!" : "Copiar enlace"}
        className={`h-7 w-7 flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 shrink-0 ${
          copied
            ? "bg-green-500 text-white"
            : "bg-slate-200 hover:bg-slate-300 text-slate-600"
        }`}
        aria-label="Copiar enlace"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-none stroke-current stroke-2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
      </button>
    </div>
  );
}
