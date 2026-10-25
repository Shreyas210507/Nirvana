# Nirvana 🏘️

## Hyperlocal Climate Risk Alerts for Vulnerable Urban Communities

> **Advisory Notice**: Nirvana is an advisory platform that complements — never replaces — official IMD / NDMA / State Disaster Authority warnings. Always follow official instructions from government agencies during emergencies.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Nirvana                          │
├───────────────┬──────────────────┬──────────────────────────────┤
│   /web        │   /api           │   /ml                       │
│   Next.js     │   FastAPI        │   Risk Models               │
│   App Router  │   Python 3.11+   │   XGBoost/LightGBM          │
│   TypeScript  │   PostGIS        │   SHAP Explainability       │
│   Tailwind    │   Redis          │   Training Scripts          │
│   MapLibre GL │   Celery         │   Model Cards               │
├───────────────┴──────────────────┴──────────────────────────────┤
│   /data                                                        │
│   Seed data, fixtures, GeoJSON, ward boundaries, CSV imports   │
├────────────────────────────────────────────────────────────────┤
│   /infra                                                       │
│   Docker, docker-compose, nginx, deployment configs            │
└────────────────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# One-command launch (requires Docker)
docker-compose up --build

# Or for development:
make dev
```

### Demo Credentials
| Role             | Username          | Password      |
|------------------|-------------------|---------------|
| Citizen          | +91-9876543210    | OTP: 123456   |
| Municipal Operator | operator@nw.gov | operator123   |
| Municipal Admin  | admin@nw.gov      | admin123      |

## Pilot City: Hyderabad

Seeded with 20+ wards/localities including:
- **Flood-prone zones**: Musi River corridor, Falaknuma, Malakpet, Moosarambagh, Hafiz Baba Nagar, Chaderghat, Musheerabad
- **Heat-exposed areas**: Secunderabad Cantonment, Begumpet, Ameerpet, Kukatpally, ECIL, LB Nagar
- **Mixed risk**: Old City (Charminar), Tolichowki, Mehdipatnam

> ⚠️ **All seed data is synthetic/illustrative** and meant for demonstration purposes only. See "Plugging in Real Data" below.

## Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

See `.env.example` for all available configuration options.

## Project Structure

```
/web          → Next.js frontend (citizen app + municipal dashboard)
/api          → FastAPI backend (risk engine, data ingestion, APIs)
/ml           → ML models, training scripts, model cards
/data         → Seed data, fixtures, GeoJSON boundaries, CSV imports
/infra        → Docker, docker-compose, nginx configs
```

## Onboarding a New City

1. Prepare ward boundaries as GeoJSON (`/data/cities/<city>/wards.geojson`)
2. Generate H3 hex grid for the city extent
3. Import elevation data (SRTM/Copernicus DEM)
4. Import drainage network (OSM Overpass + municipal data)
5. Configure city thresholds in `/api/config/cities/<city>.yaml`
6. Import shelters, historical events, vulnerability data
7. Run `python api/scripts/onboard_city.py --city <city>`

## Adding a Language

1. Add translation JSON files to `/web/src/i18n/messages/<lang>.json`
2. Add alert templates to `/api/templates/alerts/<lang>/`
3. Register the language in `/web/src/i18n/config.ts`
4. Add Noto Sans font variant if needed

## Data Sources

| Source | Type | License | Notes |
|--------|------|---------|-------|
| Open-Meteo | Weather forecast | Free/Open | No API key required |
| OpenStreetMap | Drainage, land use | ODbL | Via Overpass API |
| SRTM/Copernicus | Elevation | Free | Pre-processed tiles |
| Sentinel-2/Landsat | Land cover, LST | Free | Via GEE or fixtures |
| Census of India | Demographics | Gov Open Data | Aggregated only |

## Limitations

- Risk scores are model estimates with stated confidence levels — not definitive predictions
- Drainage condition data relies on crowd-sourced reports and may be incomplete
- Shelter information requires periodic verification
- Machine translations should be reviewed before official use
- SMS/WhatsApp/IVR channels use mock adapters by default

## License

MIT License — See LICENSE file for details.
