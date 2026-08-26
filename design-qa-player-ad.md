# Player reklama joyi — Design QA

Reference: `C:\Users\user\Downloads\8c6de50d-ee52-4114-8274-8e42e9c95137.png`

| Ko‘rinish | Natija | Dalil |
|---|---|---|
| Desktop | O‘tdi | Player tepasida, kontent kengligida va 250 px balandlikda. |
| Mobil 390×844 | O‘tdi | Player tepasida, 352×100 px va yon paddinglari teng. |
| Responsive tartib | O‘tdi | Kino ma’lumoti → reklama → player ketma-ketligi reference sxemaga mos. |
| Layout shift | O‘tdi | Reklama yuklanishidan oldin mobil va desktop balandligi rezerv qilinadi. |
| Ulanish | O‘tdi | Global loader bir marta ishlaydi, Yandex hostlariga preconnect va dns-prefetch mavjud. |

Real auktsion tezligi Yandex serveri, tarmoq, adblock va moderatsiyaga bog‘liq. Bloklangan Page ID bilan reklama chiqmaydi.

final result: passed
