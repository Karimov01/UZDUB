# Dizayn QA hisoboti

Holat: **BLOCKED**

## Manba rasmlar

- `C:\Users\user\Downloads\Hero banner va header qismi, janr  Desktop.png`
- `C:\Users\user\Downloads\Hero banner va header qismi, janr  mobile.png`
- `C:\Users\user\Downloads\Qismlar desktop.png`
- `C:\Users\user\Downloads\Qismlar mobile.png`

## Tekshirilgan viewportlar

- Desktop: rejalashtirilgan `1680x945`
- Mobile: rejalashtirilgan `390x844`

## Natija

- Kod darajasida desktop va mobil tuzilma reference talablariga moslashtirildi.
- `lint`, TypeScript va production build muvaffaqiyatli tugadi.
- Codex ichki brauzeri Windows hostidagi `localhost:3001` va `172.18.192.1:3001` manzillariga ulana olmadi (`ERR_CONNECTION_REFUSED`). Shu sabab reference va lokal screenshotni bitta taqqoslash tasvirida vizual tekshirish yakunlanmadi.
- Brauzer orqali pixel-level QA bajarilmaguncha bu hisobot `PASSED` deb belgilanmaydi.

## Screenshotlar

- Lokal screenshot olinmadi: ichki brauzer host dev serveriga kira olmadi.

## Kod bo‘yicha tasdiqlangan holatlar

- Home header desktop/mobile alohida responsive ko‘rinishga ega.
- Home hero desktopda 2 karta, mobilda 1 karta va nuqta indikatorlar bilan ishlaydi.
- Home janrlar qatori gorizontal scroll va alohida scroll tugmasiga ega.
- Serial detail qismlar bloki mobilda 3, desktopda 8 ustungacha moslashadi.
- Detail sahifalaridan izoh/reaksiya paneli olib tashlangan; player sahifalari o‘zgartirilmagan.
