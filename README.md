# 🎬 wideOS — Creative Second Brain v1.0

System freelancera do zarządzania projektami filmowymi/fotograficznymi, zsynchronizowany z Notion i Frame.io.

---

## Funkcjonalności (v1.0)

- **Panel Administratora** (`/admin/dashboard`) — przegląd projektów klientów w czasie rzeczywistym
- **Ustawienia integracji** (`/admin/settings`) — konfiguracja tokenów Notion, Frame.io, Nextcloud oraz mappingów pól
- **Tworzenie projektów** — jednym kliknięciem tworzy rekord w Notion i projekt w Frame.io
- **Lokalna baza projektów** (`data/projects.json`) — przechowuje stan i statusy synchronizacji
- **Automatyczna synchronizacja z Notion** — w tle co X sekund sprawdza zmiany w bazie Notion i aktualizuje lokalne rekordy
- **Force Sync / Resync API** — ręczna ponowna synchronizacja nieudanych projektów
- **API Debug Console** — wbudowana konsola do śledzenia wywołań API na żywo
- **Bezpieczne zarządzanie kluczami** — tokeny przechowywane tylko lokalnie w `data/config.json` (ignorowanym przez Git) i `.env`

---

## Struktura projektu

```
wideOS/
├── apps/
│   ├── web/                   # Next.js 16 — admin panel + API
│   │   ├── app/admin/         # Strony: dashboard, settings
│   │   ├── app/api/           # Endpointy REST
│   │   │   ├── frameio/       # verify, create-client
│   │   │   ├── notion/        # databases, properties, verify-changes
│   │   │   ├── projects/      # GET list, POST create, POST sync
│   │   │   ├── settings/      # config.json read/write
│   │   │   ├── status/        # connection status check
│   │   │   └── webhooks/      # Frame.io webhooks
│   │   └── data/              # (gitignored) config.json, projects.json
│   └── adobe-extension/       # Adobe UXP plugin dla Premiere Pro
├── packages/
│   └── shared/                # Wspólne typy i logika Notion API
├── docker/                    # Konfiguracja Docker
├── docs/                      # Dokumentacja
├── .env.example               # Szablon zmiennych środowiskowych
└── .gitignore
```

---

## Pierwsze uruchomienie

### 1. Sklonuj i zainstaluj zależności
```bash
git clone <repo-url>
cd wideOS
npm install
```

### 2. Skopiuj i uzupełnij plik `.env`
```bash
cp .env.example .env
# Edytuj .env i wpisz swoje tokeny:
# NOTION_TOKEN=secret_...
# FRAME_IO_TOKEN=fio-u-...
# NEXTCLOUD_URL=https://...
```

### 3. Uruchom serwer deweloperski
```bash
cd apps/web
npm run dev
# Otwórz: http://localhost:8080/admin/dashboard
```

### 4. Skonfiguruj integracje
Wejdź w `/admin/settings` i:
1. Wklej token Notion → kliknij **Test Connection** → wybierz bazę danych
2. Zamapuj kolumny Notion na pola Frame.io
3. Wklej token Frame.io → kliknij **Test Connection**
4. Zapisz konfigurację przyciskiem **Save All Integrations**

---

## Zmienne środowiskowe

| Zmienna | Opis |
|---|---|
| `NOTION_TOKEN` | Token integracji z Notion (`secret_...`) |
| `FRAME_IO_TOKEN` | Token dewelopera Frame.io (`fio-u-...`) |
| `NEXTCLOUD_URL` | URL instancji Nextcloud |

> Tokeny są przechowywane w `apps/web/data/config.json` (runtime) i nigdy nie trafiają do Gita.

---

## Technologie

- **Next.js 16** (App Router, TypeScript)
- **Notion API** v2022-06-28
- **Frame.io API** v2
- **Vanilla CSS** (Glassmorphism design)
- **Adobe UXP** (Premiere Pro plugin)
