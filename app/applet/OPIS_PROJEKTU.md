# Podsumowanie projektu: „Sąsiedzi Stare Stawy”

Stare Stawy — Sąsiedzi to ultra-lokalna platforma społecznościowa stworzona specjalnie dla mieszkańców osiedla Stare Stawy w Oświęcimiu. Aplikacja łączy funkcje sąsiedzkiej tablicy ogłoszeń, mapy incydentów i alertów, pożyczalni sprzętu oraz bezpiecznego komunikatora.

---

## Główne moduły i funkcje aplikacji

### 1. Interaktywna Mapa Osiedla
- Wizualizacja przestrzenna: mapa zintegrowana z Leaflet i OpenStreetMap, wyśrodkowana na Stare Stawy, z podziałem na rejony (Centrum, ul. Zagrodowa, ul. Zwycięstwa, ul. Ceglana, Staw, Błonie).
- Kolorowe znaczniki:
  * Ogłoszenia (sprzedam, oddam, kupię, informacja) - kolor zielony
  * Alerty (awarie, utrudnienia drogowe z pulsującym wskaźnikiem) - kolor czerwony
  * Pomoc sąsiedzka (prośby o wsparcie) - kolor fioletowy
  * Pożyczalnia sprzętu (dostępne narzędzia i przedmioty) - kolor bursztynowy
- Zaznaczanie punktu przez mieszkańca: kliknięcie w dowolne miejsce na mapie pozwala od razu dodać ogłoszenie lub alert powiązany z tą konkretną lokalizacją.
- Przycisk GPS „Moja lokalizacja”: automatyczne centrowanie na pozycji użytkownika.
- Przełącznik warstw: widok uliczny, kontrastowy oraz satelitarny.
- Mini-mapa w formularzach: możliwość doprecyzowania punktu pinezką bezpośrednio podczas dodawania wpisu.

### 2. Tablica Ogłoszeń (Feed)
- Kategorie wpisów: Oddam za darmo (0 zł), Sprzedam, Kupię, Pożyczę, Szukam, Zguba/Znaleziono, Pytanie, Informacja.
- Szczegóły ofert: zdjęcia z automatyczną kompresją w przeglądarce, ceny, stan przedmiotu, odległość od przeglądającego.
- Komentarze i dyskusje: możliwość komentowania pod ogłoszeniami.

### 3. Pożyczalnia Sąsiedzka (Tool-sharing)
- Moduł bezpłatnego udostępniania i pożyczania sprzętu między sąsiadami (np. wiertarki, drabiny, kosiarki, przyczepki, bagażniki).
- Statusy: Dostępne, Wypożyczone, Zarezerwowane.
- Określanie zasad pożyczenia oraz ewentualnej kaucji zwrotnej.

### 4. Pomoc Sąsiedzka
- Zgłaszanie i odpowiadanie na prośby o pomoc: transport, zakupy, drobne naprawy, wniesienie ciężkich rzeczy, opieka nad psem/kotem.
- Trzy stopnie pilności: Zwykła, Pilna, Bardzo pilna (teraz).

### 5. Alerty i Utrudnienia Osiedlowe
- Szybkie ostrzeżenia dla mieszkańców o:
  * Utrudnieniach drogowych i remontach,
  * Awariach prądu, wody czy gazu,
  * Zaginionych lub znalezionych zwierzętach,
  * Zgubionych kluczach, dokumentach itp.
- Widoczne natychmiast na tablicy alertów oraz na mapie.

### 6. Baza Lokalnych Fachowców
- Katalog sprawdzonych specjalistów działających na terenie Oświęcimia i okolic (hydraulik, elektryk, mechanik, fryzjer, kosmetyczka, złota rączka).
- Oceny gwiazdkowe, opinie mieszkańców i zweryfikowane numery telefonów.

### 7. Bezpośredni Komunikator (Chat)
- Wbudowane wiadomości prywatne między mieszkańcami.
- Możliwość kontaktu jednym kliknięciem z poziomu ogłoszenia, prośby o pomoc lub pinezki na mapie.
- Brak konieczności ujawniania swojego prywatnego numeru telefonu czy profilu na Facebooku.

### 8. Szybka Wyszukiwarka (Ctrl+K)
- Uniwersalne przeszukiwanie całej bazy (ogłoszenia, pożyczalnia, pomoc, fachowcy).
- Filtry: cenowe (darmowe, płatne, przedziały kwotowe), dostępność, tylko oferty ze zdjęciem, tylko zweryfikowani użytkownicy.

---

## Bezpieczeństwo i ochrona prywatności mieszkańców

- Bezpieczne maskowanie lokalizacji (Safe Geolocation): aplikacja celowo zaokrągla współrzędne do bezpiecznej siatki rejonu (~350 m), więc nikt nie widzi dokładnego numeru domu ani klatki sąsiada.
- Odznaka „Zweryfikowany sąsiad”: potwierdzenie autentyczności mieszkańca osiedla.
- System moderacji i zgłoszeń: zgłaszanie podejrzanych treści, blokowanie natrętnych użytkowników.
- Panel Administratora: moduł do zarządzania treściami, weryfikacji alertów i moderacji społeczności.

---

## Aspekty techniczne

- PWA (Progressive Web App): aplikację można zainstalować na telefonie (Android / iOS) lub komputerze jak natywną aplikację z ikoną na ekranie głównym.
- Działanie hybrydowe: działa w 100% od razu (dane w pamięci przeglądarki z opcją eksportu/importu JSON) oraz posiada pełną integrację z chmurą Supabase (PostgreSQL).
- Grafika i branding: dedykowany baner OpenGraph i ikony oparte na panoramie Oświęcimia (Wzgórze Zamkowe, rzeka Soła, Stare Miasto).
