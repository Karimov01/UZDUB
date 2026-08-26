"use client";

import YandexAd from "@/components/ads/YandexAd";

// ============================================================================
// REKLAMA KODI UCHUN JOY
// ============================================================================
// Bu yerga <script>...</script> kodini to'liq qo'ymang — TSX kompilyatsiyasi
// buziladi. Player tepasida chiqadigan oddiy RESPONSIVE Yandex banner blokining
// ID sini .env.local fayliga quyidagicha yozing:
// NEXT_PUBLIC_YANDEX_PLAYER_AD_BLOCK_ID=R-A-XXXXXXXX-X
//
// Eslatma: `type: "floorAd"` blok konteynerga joylashmaydi; u ekran pastida
// suzuvchi reklama bo'lib chiqadi. Shu sababli floorAd ID sini bu slotga qo'ymang.
// ============================================================================
const PLAYER_AD_BLOCK_ID = process.env.NEXT_PUBLIC_YANDEX_PLAYER_AD_BLOCK_ID?.trim();

/**
 * Player sahifalari uchun yagona responsive reklama joyi.
 * Yandex panelida responsive banner sifatida sozlangan bitta aktiv block ID ishlatiladi.
 */
export default function PlayerAdSlot() {
  if (!PLAYER_AD_BLOCK_ID) {
    if (process.env.NODE_ENV !== "development") return null;

    return (
      <aside
        aria-label="Reklama joyi (test ko‘rinishi)"
        className="mb-3 flex h-[100px] w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-violet-400/45 bg-violet-500/[.06] text-center md:mb-4 md:h-[250px] md:rounded-2xl"
      >
        <div>
          <p className="text-sm font-semibold text-violet-200 md:text-base">Reklama kodi uchun joy</p>
          <p className="mt-1 text-[11px] text-slate-500 md:text-xs">Mobil: responsive · Desktop: 970 × 250</p>
        </div>
      </aside>
    );
  }

  return (
    <YandexAd
      blockId={PLAYER_AD_BLOCK_ID}
      className="player-ad-slot mb-3 min-h-[100px] rounded-xl border border-white/[.08] bg-white/[.025] md:mb-4 md:min-h-[250px] md:rounded-2xl"
    />
  );
}
