# Serial kamchiliklari — Design QA

## Reference

- `2026-08-26 19_18_48-.png` — Tavsif va Izohlar orasidagi kino sahifasi patterni
- Mavjud kino tomosha sahifasining like/dislike, actions va `WatchComments` patterni
- Desktop viewport: 1440 × 900

## Natijalar

| Tekshiruv | Natija |
|---|---|
| Serial player ustidagi `1-Qism` sarlavhasi olib tashlandi | passed |
| Player ustiga yig‘iladigan `Tavsif`/syujet kartasi qo‘yildi | passed |
| Serial metadata qatorida `Ko‘rildi` mavjud | passed |
| Embed video URL uchun `Yuklab olish` render qilinmaydi | passed |
| Oldingi/keyingi qism navigatsiyasi player ostida | passed |
| Like/dislike actions qatorining qarama-qarshi tomonida | passed |
| Kino sahifasidagi yangi `WatchComments` dizayni ishlatiladi | passed |
| Eski reyting va eski izohlar paneli DOMdan olib tashlandi | passed |
| Guest izoh formasi va ism maydoni ko‘rinadi | passed |
| Qism til badge’i mikrofon ikonkasi bilan `UZ` ko‘rinishida | passed |
| Production build | passed |

## Vizual tekshiruv

- Serial detail va qism sahifasi 1440 × 900 holatida ochildi.
- Izohlar tugmasi orqali yangi izoh blokiga scroll ishlashi tekshirildi.
- P1/P2 darajadagi ochiq muammo qolmadi.

final result: passed
