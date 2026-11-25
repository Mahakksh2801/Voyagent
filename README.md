# Voyagent

AI-powered travel planner that turns a destination, dates and a budget into a complete, editable day-by-day itinerary, with real-time budget tracking and weather-aware activity planning.

> **Status:** early development. The domain layer (schemas, data model, itinerary validation) is in place and tested against mocked API responses. There is no UI and no live API calls yet.

## What it will do

- Generate a day-by-day itinerary (sights, meals, transit) for one or more destinations, within budget.
- Track estimated spend per day and per category, warn when a plan goes over budget, and suggest cheaper alternatives.
- Pull the forecast for the trip dates, keep outdoor activities on clear days, and offer indoor backups for rain.
- Let travellers edit, move, delete or regenerate individual stops, and save trips for later.
- Map view with numbered pins and routes, PDF and `.ics` export, read-only share links, packing lists and per-stop feedback.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS 4 |
| Validation | Zod |
| Database | PostgreSQL with Prisma |
| Auth | Auth.js (email magic link or OAuth) |
| Itinerary generation | OpenAI API, structured JSON output validated with Zod |
| Places and routes | Google Maps Platform: Places API, Routes API, Maps JavaScript API |
| Weather | OpenWeatherMap |
| Tests | Vitest |
| CI | GitHub Actions |

## Project layout

```
prisma/schema.prisma          Data model (User, Trip, Day, Stop, Place, Feedback, ApiUsageLog, Auth.js tables)
src/app/                      Next.js App Router (placeholder page for now)
src/lib/schemas/              Zod schemas: trip request, itinerary (model output), places, weather, preferences, feedback
src/lib/validation/           Itinerary validation and model-response parsing
src/lib/generation/           Generate -> validate -> retry-once loop (generator is injected)
src/lib/budget/               Budget totals per day and category
src/lib/weather/              Clear / wet / unknown day classification
src/lib/adapters/             Normalizers for OpenAI, Google Places and OpenWeatherMap responses
src/mocks/                    Mocked API responses used by tests (no network)
```

## Itinerary validation

Every generated itinerary is checked before it is saved. Errors fail validation and are fed back to the model for one retry; warnings are shown to the user.

| Check | Code | Severity |
| --- | --- | --- |
| Response is JSON and matches the itinerary schema | `SCHEMA` | error |
| Itinerary currency matches the budget currency | `CURRENCY_MISMATCH` | error |
| Every trip date has exactly one day, in order, none outside the range | `DATE_OUT_OF_RANGE`, `DATE_MISSING`, `DATE_DUPLICATE`, `DATES_OUT_OF_ORDER` | error |
| Activities and meals use a place ID from the candidate set; transit has none | `PLACE_NOT_IN_CANDIDATES`, `PLACE_MISSING`, `TRANSIT_HAS_PLACE` | error |
| Stops fit the day window (default 07:00 to 23:00), in time order, without overlap | `STOP_OUTSIDE_DAY_WINDOW`, `STOPS_OUT_OF_ORDER`, `STOPS_OVERLAP` | error |
| Weather-dependent stops are not on wet days (rain, drizzle, storm, snow, or precipitation chance of 50% or more) | `WEATHER_DEPENDENT_ON_WET_DAY` | error |
| Weather-dependent stop on a day with no forecast yet | `WEATHER_UNKNOWN` | warning |
| Total estimated cost is within budget | `OVER_BUDGET` | error |

Lodging is exempt from the day window and may have no place ID, since booking is out of scope.

## Local development

Requirements: Node.js 20.9 or newer, npm, and PostgreSQL 15 or newer (only needed once database features land).

```bash
git clone https://github.com/Mahakksh2801/voyagent.git
cd voyagent
cp .env.example .env      # fill in values as features need them
npm install               # also runs `prisma generate`
npm run dev               # http://localhost:3000
```

Useful scripts:

| Script | What it does |
| --- | --- |
| `npm test` | Run unit tests once (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |
| `npm run build` | Production build |
| `npm run db:validate` | Validate the Prisma schema |
| `npm run db:migrate` | Create and apply a migration against `DATABASE_URL` |

All tests run against the mocked responses in `src/mocks/`, so no API keys are needed to run them.

## Contributing

- `main` is production; `development` is the integration branch.
- Create a feature branch off `development`, e.g. `feat/budget-tracker` or `feat/weather-integration`.
- Use [Conventional Commits](https://www.conventionalcommits.org/): `feat`, `fix`, `chore`, `docs`, `test`, `refactor`.
- Open a pull request into `development` with a description and linked issue(s). Merge after review and green CI.
- `development` is merged into `main` for releases.

## License

[MIT](LICENSE)
