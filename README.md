# Stare Stawy — Sąsiedzi 🏡

> Nowoczesna, ultra-lokalna platforma społecznościowa Progressive Web App (PWA) dla mieszkańców osiedla Stare Stawy w Oświęcimiu. Pożyczalnia sprzętu, tablica ogłoszeń, pomoc sąsiedzka, alerty i zweryfikowani lokalni fachowcy.

---

## 🎨 Materiały Promocyjne & Baner Startowy (ImageOG)

W folderze `public/` znajduje się oficjalny baner promocyjny:
- `public/og-image.jpg` (1376 × 768 px) — automatyczna karta podglądu OpenGraph dla linków na Facebooku, Messengerze, WhatsAppie i Twitterze/X.
- `public/banner-promocyjny.jpg` — ten sam baner wysokiej rozdzielczości gotowy do pobrania na plakaty osiedlowe i posty w mediach społecznościowych.
- W aplikacji w oknie **„Start Osiedla & Wdrożenie”** dostępne są gotowe teksty zaproszeń do skopiowania na:
  - Grupę sąsiedzką na Facebooku
  - Czaty sąsiedzkie WhatsApp / Messenger
  - Kartkę informacyjną / plakat do wydrukowania na tablicę ogłoszeń na klatce schodowej

---

## 🚀 Czysty Start Osiedla (Tryb Produkcyjny)

Aplikacja posiada wbudowaną funkcję **Czystego Startu**:
- W menu profilu lub w panelu administratora kliknij **„Start Osiedla & Wdrożenie” ➔ „Włącz Czysty Start Osiedla”**.
- Spowoduje to wyczyszczenie wszystkich fikcyjnych wpisów testowych i pożyczek demonstracyjnych.
- Na tablicy pozostanie oficjalny profil **Rady Osiedla Stare Stawy**, oficjalny wpis powitalny z banerem promocyjnym oraz oficjalne numery alarmowe dla Oświęcimia.
- Baza jest w 100% czysta i gotowa na pierwszych prawdziwych mieszkańców!
- W każdej chwili można też jednym kliknięciem przywrócić dane testowe do prezentacji.

---

## ☁️ Wdrożenie na Vercel (Deployment w 3 minuty)

### Co jest potrzebne?
1. **Darmowe konto na GitHub** (rejestracja na [github.com](https://github.com/) w 30 sekund).
2. **Darmowe konto na Vercel** (logowanie przez GitHub na [vercel.com](https://vercel.com/)).
3. **Pobrane archiwum ZIP** z tej aplikacji (`stare-stawy-sasiedzi.zip`).

### Krok po kroku:
1. Rozpakuj pobrany plik `.zip` na swoim komputerze.
2. Utwórz nowe repozytorium na GitHub (np. `stare-stawy-sasiedzi`).
3. Wyślij kod poleceniami w terminalu:
   ```bash
   git init
   git add .
   git commit -m "Start osiedla Stare Stawy"
   git branch -M main
   git remote add origin https://github.com/TWOJ_LOGIN/stare-stawy-sasiedzi.git
   git push -u origin main
   ```
4. Zaloguj się na [vercel.com](https://vercel.com) i kliknij **Add New... ➔ Project**.
5. Wybierz swoje repozytorium z GitHub.
6. Vercel automatycznie ustawi framework jako **Vite**, polecenie budowania `npm run build` i katalog wyjściowy `dist`.
7. Kliknij **Deploy**. W 40 sekund aplikacja jest online z darmowym certyfikatem SSL i subdomeną `.vercel.app`!
8. (Opcjonalnie) W zakładce *Settings ➔ Domains* możesz dodać własną domenę (np. `starestawy.pl`).

---

## 🗄️ Baza danych w chmurze (Opcjonalnie — Supabase)

Aplikacja domyślnie działa w trybie **Local-First** (w pamięci przeglądarki z pełnym eksportem/importem JSON i trybem offline).

Jeśli chcesz, aby wszyscy mieszkańcy widzieli nawzajem swoje posty w czasie rzeczywistym z różnych telefonów i komputerów:
1. Załóż darmowy projekt na [supabase.com](https://supabase.com).
2. Wklej do edytora SQL w Supabase zawartość pliku `supabase/schema.sql`.
3. (Opcjonalnie) Wklej `supabase/seed.sql` dla początkowych zweryfikowanych fachowców z Oświęcimia.
4. W Vercel w zakładce *Settings ➔ Environment Variables* dodaj:
   - `VITE_SUPABASE_URL` = `https://twoj-projekt.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `twoj-klucz-anon-publiczny`
   *(Możesz je również wpisać bezpośrednio w panelu administratora w aplikacji!)*.

---

## 🛠️ Uruchomienie lokalne (Development)

Wymagania: Node.js 18+ lub 20+.

```bash
# 1. Instalacja zależności
npm install

# 2. Uruchomienie serwera lokalnego
npm run dev

# 3. Zbudowanie wersji produkcyjnej
npm run build

# 4. Sprawdzenie poprawności typów TypeScript
npm run lint
```

---

## 📱 Funkcje Progressive Web App (PWA)
- Instalacja na telefonach z iOS (Safari ➔ Dodaj do ekranu początkowego) oraz Androidzie (Chrome ➔ Zainstaluj aplikację).
- Tryb Offline (Service Worker w `public/sw.js`).
- Bezpieczeństwo i RODO: brak śledzenia, maskowanie dokładnych współrzędnych GPS (do kwartału ulicy), regulamin i polityka prywatności dostosowane do prawa polskiego i UE.
