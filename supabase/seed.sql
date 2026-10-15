-- ==============================================================================
-- STARE STAWY — SĄSIEDZI: DANE STARTOWE (SEED SQL DLA SUPABASE)
-- Uruchom ten plik w Supabase SQL Editor po wykonaniu 'schema.sql'
-- ==============================================================================

-- 1. ZWERYFIKOWANI LOKALNI FACHOWCY NA OSIEDLU
INSERT INTO public.professionals (id, name, description, category, service_area, phone, is_verified, rating, reviews_count)
VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    'Marek Kwiecień — Hydraulika & Ogrzewanie',
    'Mieszkaniec Starych Stawów. Pogotowie hydrauliczne, wymiana zaworów, montaż baterii, naprawa spłuczek i instalacji c.o. Szybki dojazd na osiedlu.',
    'hydraulik',
    'Stare Stawy, Zasole, Oświęcim',
    '+48 601 234 567',
    TRUE,
    4.95,
    18
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Stanisław Nowak — Usługi Elektryczne SEP',
    'Pomiary instalacji, wymiana bezpieczników, podłączanie płyt indukcyjnych z pieczątką gwarancyjną, montaż oświetlenia LED i gniazdek.',
    'elektryk',
    'Stare Stawy, Błonie, Oświęcim',
    '+48 603 987 654',
    TRUE,
    4.88,
    12
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Piotr Zieliński — Usługi Ogrodnicze & Pielęgnacja',
    'Koszenie trawników, wertykulacja, cięcie żywopłotów i drzew owocowych, porządki wiosenno-jesienne w ogrodach przydomowych.',
    'ogrodnictwo',
    'Stare Stawy i okolice Oświęcimia',
    '+48 605 555 444',
    TRUE,
    5.00,
    9
  )
ON CONFLICT (id) DO NOTHING;

