"""
Mock and seed data for Hyderabad pilot — 22 monitored wards, shelters, alerts, reports.
Adheres to Nirvana's pilot city extent and calculation standards.
"""

from datetime import datetime, timezone, timedelta
from app.models import WardBase, AlertResponse, ShelterResponse, ReportResponse


# ============================================================================
# WARDS — Hyderabad pilot (22 surveyed wards with authentic geometry & metrics)
# ============================================================================
HYDERABAD_WARDS = [
    WardBase(
        id="w-001", name="Malakpet", name_local="మలక్‌పేట", zone="Charminar",
        population=48000, area=3.2, avg_elevation=512.0, drainage_condition="poor",
        impervious_fraction=0.78, green_cover_fraction=0.08, informal_settlement_fraction=0.22,
        elderly_population_fraction=0.12, outdoor_worker_fraction=0.35, historical_flood_frequency=8,
        historical_heatwave_days=15,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.502, 17.365], [78.515, 17.365], [78.515, 17.375], [78.502, 17.375], [78.502, 17.365]]]}, "properties": {}},
    ),
    WardBase(
        id="w-002", name="Chaderghat", name_local="చాదర్‌ఘాట్", zone="Charminar",
        population=35000, area=2.1, avg_elevation=505.0, drainage_condition="poor",
        impervious_fraction=0.82, green_cover_fraction=0.05, informal_settlement_fraction=0.30,
        elderly_population_fraction=0.14, outdoor_worker_fraction=0.40, historical_flood_frequency=12,
        historical_heatwave_days=18,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.490, 17.370], [78.502, 17.370], [78.502, 17.380], [78.490, 17.380], [78.490, 17.370]]]}, "properties": {}},
    ),
    WardBase(
        id="w-003", name="Falaknuma", name_local="ఫలక్‌నుమా", zone="Charminar",
        population=52000, area=4.5, avg_elevation=535.0, drainage_condition="partial",
        impervious_fraction=0.65, green_cover_fraction=0.12, informal_settlement_fraction=0.35,
        elderly_population_fraction=0.15, outdoor_worker_fraction=0.38, historical_flood_frequency=6,
        historical_heatwave_days=20,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.465, 17.340], [78.485, 17.340], [78.485, 17.360], [78.465, 17.360], [78.465, 17.340]]]}, "properties": {}},
    ),
    WardBase(
        id="w-004", name="Moosarambagh", name_local="మూసారాంబాగ్", zone="LB Nagar",
        population=42000, area=3.8, avg_elevation=508.0, drainage_condition="poor",
        impervious_fraction=0.75, green_cover_fraction=0.10, informal_settlement_fraction=0.18,
        elderly_population_fraction=0.11, outdoor_worker_fraction=0.30, historical_flood_frequency=10,
        historical_heatwave_days=14,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.510, 17.360], [78.530, 17.360], [78.530, 17.375], [78.510, 17.375], [78.510, 17.360]]]}, "properties": {}},
    ),
    WardBase(
        id="w-005", name="Hafiz Baba Nagar", name_local="హఫీజ్ బాబా నగర్", zone="Charminar",
        population=38000, area=2.5, avg_elevation=502.0, drainage_condition="poor",
        impervious_fraction=0.80, green_cover_fraction=0.06, informal_settlement_fraction=0.28,
        elderly_population_fraction=0.13, outdoor_worker_fraction=0.42, historical_flood_frequency=11,
        historical_heatwave_days=16,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.515, 17.355], [78.530, 17.355], [78.530, 17.365], [78.515, 17.365], [78.515, 17.355]]]}, "properties": {}},
    ),
    WardBase(
        id="w-006", name="Musheerabad", name_local="ముషీరాబాద్", zone="Musheerabad",
        population=55000, area=4.2, avg_elevation=530.0, drainage_condition="partial",
        impervious_fraction=0.72, green_cover_fraction=0.14, informal_settlement_fraction=0.15,
        elderly_population_fraction=0.10, outdoor_worker_fraction=0.28, historical_flood_frequency=5,
        historical_heatwave_days=12,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.485, 17.395], [78.505, 17.395], [78.505, 17.415], [78.485, 17.415], [78.485, 17.395]]]}, "properties": {}},
    ),
    WardBase(
        id="w-007", name="Charminar", name_local="చార్మినార్", zone="Charminar",
        population=62000, area=3.0, avg_elevation=518.0, drainage_condition="partial",
        impervious_fraction=0.85, green_cover_fraction=0.04, informal_settlement_fraction=0.20,
        elderly_population_fraction=0.16, outdoor_worker_fraction=0.32, historical_flood_frequency=7,
        historical_heatwave_days=22,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.470, 17.355], [78.490, 17.355], [78.490, 17.375], [78.470, 17.375], [78.470, 17.355]]]}, "properties": {}},
    ),
    WardBase(
        id="w-008", name="Begumpet", name_local="బేగంపేట్", zone="Secunderabad",
        population=45000, area=5.0, avg_elevation=545.0, drainage_condition="good",
        impervious_fraction=0.70, green_cover_fraction=0.18, informal_settlement_fraction=0.05,
        elderly_population_fraction=0.08, outdoor_worker_fraction=0.15, historical_flood_frequency=2,
        historical_heatwave_days=10,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.460, 17.435], [78.480, 17.435], [78.480, 17.450], [78.460, 17.450], [78.460, 17.435]]]}, "properties": {}},
    ),
    WardBase(
        id="w-009", name="Ameerpet", name_local="అమీర్‌పేట్", zone="Serilingampally",
        population=58000, area=4.0, avg_elevation=540.0, drainage_condition="partial",
        impervious_fraction=0.75, green_cover_fraction=0.12, informal_settlement_fraction=0.08,
        elderly_population_fraction=0.09, outdoor_worker_fraction=0.20, historical_flood_frequency=4,
        historical_heatwave_days=14,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.440, 17.430], [78.460, 17.430], [78.460, 17.445], [78.440, 17.445], [78.440, 17.430]]]}, "properties": {}},
    ),
    WardBase(
        id="w-010", name="Kukatpally", name_local="కూకట్‌పల్లి", zone="Kukatpally",
        population=72000, area=8.5, avg_elevation=555.0, drainage_condition="partial",
        impervious_fraction=0.68, green_cover_fraction=0.15, informal_settlement_fraction=0.10,
        elderly_population_fraction=0.07, outdoor_worker_fraction=0.22, historical_flood_frequency=5,
        historical_heatwave_days=16,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.380, 17.480], [78.410, 17.480], [78.410, 17.500], [78.380, 17.500], [78.380, 17.480]]]}, "properties": {}},
    ),
    WardBase(
        id="w-011", name="Secunderabad", name_local="సికింద్రాబాద్", zone="Secunderabad",
        population=68000, area=7.0, avg_elevation=550.0, drainage_condition="good",
        impervious_fraction=0.65, green_cover_fraction=0.20, informal_settlement_fraction=0.06,
        elderly_population_fraction=0.10, outdoor_worker_fraction=0.18, historical_flood_frequency=3,
        historical_heatwave_days=11,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.490, 17.430], [78.510, 17.430], [78.510, 17.450], [78.490, 17.450], [78.490, 17.430]]]}, "properties": {}},
    ),
    WardBase(
        id="w-012", name="Tolichowki", name_local="తోలిచౌకి", zone="Charminar",
        population=46000, area=4.8, avg_elevation=525.0, drainage_condition="partial",
        impervious_fraction=0.72, green_cover_fraction=0.10, informal_settlement_fraction=0.14,
        elderly_population_fraction=0.11, outdoor_worker_fraction=0.25, historical_flood_frequency=4,
        historical_heatwave_days=13,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.420, 17.380], [78.445, 17.380], [78.445, 17.400], [78.420, 17.400], [78.420, 17.380]]]}, "properties": {}},
    ),
    WardBase(
        id="w-013", name="Mehdipatnam", name_local="మెహదీపట్నం", zone="Charminar",
        population=51000, area=3.5, avg_elevation=530.0, drainage_condition="partial",
        impervious_fraction=0.74, green_cover_fraction=0.09, informal_settlement_fraction=0.12,
        elderly_population_fraction=0.10, outdoor_worker_fraction=0.28, historical_flood_frequency=5,
        historical_heatwave_days=15,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.435, 17.385], [78.455, 17.385], [78.455, 17.400], [78.435, 17.400], [78.435, 17.385]]]}, "properties": {}},
    ),
    WardBase(
        id="w-014", name="LB Nagar", name_local="ఎల్.బి. నగర్", zone="LB Nagar",
        population=65000, area=6.2, avg_elevation=520.0, drainage_condition="partial",
        impervious_fraction=0.70, green_cover_fraction=0.13, informal_settlement_fraction=0.15,
        elderly_population_fraction=0.09, outdoor_worker_fraction=0.30, historical_flood_frequency=6,
        historical_heatwave_days=17,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.540, 17.340], [78.565, 17.340], [78.565, 17.360], [78.540, 17.360], [78.540, 17.340]]]}, "properties": {}},
    ),
    WardBase(
        id="w-015", name="ECIL", name_local="ఈసీఐఎల్", zone="Malkajgiri",
        population=48000, area=5.5, avg_elevation=560.0, drainage_condition="good",
        impervious_fraction=0.60, green_cover_fraction=0.22, informal_settlement_fraction=0.08,
        elderly_population_fraction=0.08, outdoor_worker_fraction=0.18, historical_flood_frequency=2,
        historical_heatwave_days=18,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.535, 17.460], [78.560, 17.460], [78.560, 17.480], [78.535, 17.480], [78.535, 17.460]]]}, "properties": {}},
    ),
    WardBase(
        id="w-016", name="Malkajgiri", name_local="మల్కాజ్‌గిరి", zone="Malkajgiri",
        population=55000, area=5.8, avg_elevation=548.0, drainage_condition="partial",
        impervious_fraction=0.65, green_cover_fraction=0.18, informal_settlement_fraction=0.10,
        elderly_population_fraction=0.09, outdoor_worker_fraction=0.20, historical_flood_frequency=3,
        historical_heatwave_days=13,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.510, 17.450], [78.535, 17.450], [78.535, 17.470], [78.510, 17.470], [78.510, 17.450]]]}, "properties": {}},
    ),
    WardBase(
        id="w-017", name="Dilsukhnagar", name_local="దిల్‌సుఖ్‌నగర్", zone="LB Nagar",
        population=60000, area=3.5, avg_elevation=515.0, drainage_condition="partial",
        impervious_fraction=0.80, green_cover_fraction=0.07, informal_settlement_fraction=0.16,
        elderly_population_fraction=0.10, outdoor_worker_fraction=0.32, historical_flood_frequency=7,
        historical_heatwave_days=15,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.520, 17.355], [78.540, 17.355], [78.540, 17.370], [78.520, 17.370], [78.520, 17.355]]]}, "properties": {}},
    ),
    WardBase(
        id="w-018", name="Jubilee Hills", name_local="జూబ్లీ హిల్స్", zone="Serilingampally",
        population=35000, area=8.0, avg_elevation=575.0, drainage_condition="good",
        impervious_fraction=0.45, green_cover_fraction=0.35, informal_settlement_fraction=0.02,
        elderly_population_fraction=0.12, outdoor_worker_fraction=0.08, historical_flood_frequency=1,
        historical_heatwave_days=6,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.400, 17.420], [78.430, 17.420], [78.430, 17.440], [78.400, 17.440], [78.400, 17.420]]]}, "properties": {}},
    ),
    WardBase(
        id="w-019", name="Banjara Hills", name_local="బంజారా హిల్స్", zone="Serilingampally",
        population=32000, area=6.5, avg_elevation=570.0, drainage_condition="good",
        impervious_fraction=0.50, green_cover_fraction=0.30, informal_settlement_fraction=0.03,
        elderly_population_fraction=0.11, outdoor_worker_fraction=0.10, historical_flood_frequency=1,
        historical_heatwave_days=7,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.430, 17.410], [78.460, 17.410], [78.460, 17.430], [78.430, 17.430], [78.430, 17.410]]]}, "properties": {}},
    ),
    WardBase(
        id="w-020", name="Nampally", name_local="నాంపల్లి", zone="Charminar",
        population=44000, area=2.8, avg_elevation=535.0, drainage_condition="partial",
        impervious_fraction=0.78, green_cover_fraction=0.10, informal_settlement_fraction=0.12,
        elderly_population_fraction=0.13, outdoor_worker_fraction=0.25, historical_flood_frequency=4,
        historical_heatwave_days=14,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.465, 17.385], [78.485, 17.385], [78.485, 17.400], [78.465, 17.400], [78.465, 17.385]]]}, "properties": {}},
    ),
    WardBase(
        id="w-021", name="Hussain Sagar Area", name_local="హుస్సేన్ సాగర్ ప్రాంతం", zone="Secunderabad",
        population=28000, area=4.0, avg_elevation=515.0, drainage_condition="good",
        impervious_fraction=0.55, green_cover_fraction=0.28, informal_settlement_fraction=0.04,
        elderly_population_fraction=0.09, outdoor_worker_fraction=0.12, historical_flood_frequency=3,
        historical_heatwave_days=9,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.470, 17.415], [78.495, 17.415], [78.495, 17.435], [78.470, 17.435], [78.470, 17.415]]]}, "properties": {}},
    ),
    WardBase(
        id="w-022", name="Uppal", name_local="ఉప్పల్", zone="LB Nagar",
        population=56000, area=5.5, avg_elevation=530.0, drainage_condition="partial",
        impervious_fraction=0.68, green_cover_fraction=0.15, informal_settlement_fraction=0.14,
        elderly_population_fraction=0.08, outdoor_worker_fraction=0.28, historical_flood_frequency=5,
        historical_heatwave_days=16,
        geometry={"type": "Feature", "geometry": {"type": "Polygon", "coordinates": [[[78.555, 17.395], [78.580, 17.395], [78.580, 17.415], [78.555, 17.415], [78.555, 17.395]]]}, "properties": {}},
    ),
]


# ============================================================================
# SHELTERS — 10 Verified Facilities across Hyderabad Pilot
# ============================================================================
SHELTERS = [
    ShelterResponse(
        id="s-001", name="Govt. Boys High School, Malakpet", name_local="ప్రభుత్వ బాలుర ఉన్నత పాఠశాల",
        type="school", lat=17.370, lng=78.508, ward_id="w-001", ward_name="Malakpet",
        address="Malakpet Main Road, Hyderabad", contact_phone="040-24567890",
        capacity=300, current_occupancy=0,
        facilities=["water", "toilets", "power", "accessible", "women_safe"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Ward Officer", last_verified="2026-10-20T10:00:00Z",
        accessibility="full", operating_hours="During emergencies", elevation_m=520,
    ),
    ShelterResponse(
        id="s-002", name="Community Hall, Chaderghat", name_local="సామాజిక భవనం, చాదర్‌ఘాట్",
        type="community_hall", lat=17.375, lng=78.496, ward_id="w-002", ward_name="Chaderghat",
        address="Near Chaderghat Bridge, Hyderabad", contact_phone="040-24567891",
        capacity=200, current_occupancy=0,
        facilities=["water", "toilets", "power", "women_safe"],
        is_flood_safe=False, verification_status="verified_volunteer",
        verified_by="Volunteer Ravi K.", last_verified="2026-10-18T14:00:00Z",
        accessibility="partial", operating_hours="During emergencies", elevation_m=506,
    ),
    ShelterResponse(
        id="s-003", name="Cooling Centre, Falaknuma", name_local="శీతలీకరణ కేంద్రం, ఫలక్‌నుమా",
        type="cooling_centre", lat=17.350, lng=78.475, ward_id="w-003", ward_name="Falaknuma",
        address="Falaknuma Palace Road, Hyderabad", contact_phone="040-24567892",
        capacity=150, current_occupancy=45,
        facilities=["water", "toilets", "power", "medical", "accessible", "women_safe"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Health Dept.", last_verified="2026-10-22T09:00:00Z",
        accessibility="full", operating_hours="10:00 AM - 6:00 PM", elevation_m=540,
    ),
    ShelterResponse(
        id="s-004", name="Relief Camp, Musheerabad Stadium", name_local="సహాయ శిబిరం, ముషీరాబాద్",
        type="relief_camp", lat=17.405, lng=78.495, ward_id="w-006", ward_name="Musheerabad",
        address="Sports Complex, Musheerabad, Hyderabad", contact_phone="040-24567893",
        capacity=500, current_occupancy=0,
        facilities=["water", "toilets", "power", "medical", "accessible", "women_safe", "pet_friendly"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Disaster Cell", last_verified="2026-10-21T16:00:00Z",
        accessibility="full", operating_hours="24/7 during emergencies", elevation_m=535,
    ),
    ShelterResponse(
        id="s-005", name="Osmania General Hospital", name_local="ఉస్మానియా జనరల్ ఆసుపత్రి",
        type="hospital", lat=17.385, lng=78.480, ward_id="w-020", ward_name="Nampally",
        address="Afzal Gunj, Hyderabad", contact_phone="040-24600146",
        capacity=1000, current_occupancy=650,
        facilities=["water", "toilets", "power", "medical", "accessible", "women_safe"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="Health Dept.", last_verified="2026-10-24T08:00:00Z",
        accessibility="full", operating_hours="24/7", elevation_m=530,
    ),
    ShelterResponse(
        id="s-006", name="Masjid-e-Shahi, Charminar", name_local="మస్జిద్-ఎ-షాహీ",
        type="place_of_worship", lat=17.362, lng=78.474, ward_id="w-007", ward_name="Charminar",
        address="Near Charminar, Hyderabad", contact_phone="040-24567895",
        capacity=250, current_occupancy=0,
        facilities=["water", "toilets", "power", "women_safe"],
        is_flood_safe=True, verification_status="verified_volunteer",
        verified_by="Volunteer Ahmed S.", last_verified="2026-10-15T11:00:00Z",
        accessibility="partial", operating_hours="During emergencies", elevation_m=522,
    ),
    ShelterResponse(
        id="s-007", name="Govt. School, Dilsukhnagar", name_local="ప్రభుత్వ పాఠశాల, దిల్‌సుఖ్‌నగర్",
        type="school", lat=17.362, lng=78.530, ward_id="w-017", ward_name="Dilsukhnagar",
        address="Main Road, Dilsukhnagar, Hyderabad", contact_phone="040-24567896",
        capacity=350, current_occupancy=0,
        facilities=["water", "toilets", "power", "accessible", "women_safe"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Ward Officer", last_verified="2026-10-19T13:00:00Z",
        accessibility="full", operating_hours="During emergencies", elevation_m=525,
    ),
    ShelterResponse(
        id="s-008", name="Community Cooling Centre, Kukatpally", name_local="శీతలీకరణ కేంద్రం, కూకట్‌పల్లి",
        type="cooling_centre", lat=17.490, lng=78.395, ward_id="w-010", ward_name="Kukatpally",
        address="KPHB Colony, Kukatpally, Hyderabad", contact_phone="040-24567897",
        capacity=120, current_occupancy=30,
        facilities=["water", "toilets", "power", "accessible", "women_safe"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Health Dept.", last_verified="2026-10-23T10:00:00Z",
        accessibility="full", operating_hours="9:00 AM - 8:00 PM", elevation_m=558,
    ),
    ShelterResponse(
        id="s-009", name="Temple Hall, LB Nagar", name_local="ఆలయ మందిరం, ఎల్.బి. నగర్",
        type="place_of_worship", lat=17.348, lng=78.550, ward_id="w-014", ward_name="LB Nagar",
        address="LB Nagar Circle, Hyderabad", contact_phone="040-24567898",
        capacity=180, current_occupancy=0,
        facilities=["water", "toilets", "power", "women_safe"],
        is_flood_safe=True, verification_status="community_submitted",
        verified_by=None, last_verified=None,
        accessibility="partial", operating_hours="During emergencies", elevation_m=525,
    ),
    ShelterResponse(
        id="s-010", name="GHMC Relief Centre, Uppal", name_local="GHMC సహాయ కేంద్రం, ఉప్పల్",
        type="relief_camp", lat=17.405, lng=78.565, ward_id="w-022", ward_name="Uppal",
        address="Uppal Bus Depot Area, Hyderabad", contact_phone="040-24567899",
        capacity=400, current_occupancy=0,
        facilities=["water", "toilets", "power", "medical", "accessible", "women_safe", "pet_friendly"],
        is_flood_safe=True, verification_status="verified_municipality",
        verified_by="GHMC Disaster Cell", last_verified="2026-10-24T07:00:00Z",
        accessibility="full", operating_hours="24/7 during emergencies", elevation_m=535,
    ),
]


# ============================================================================
# ALERTS
# ============================================================================
_now = datetime.now(timezone.utc)
MOCK_ALERTS = [
    AlertResponse(
        id="a-001", hazard="flood", severity="warning",
        title="Heavy Rain Warning — Musi River Corridor",
        message="Heavy rainfall of 60-80mm expected in next 6 hours across Malakpet, Chaderghat, Hafiz Baba Nagar and Moosarambagh areas. Low-lying areas along Musi river may experience waterlogging of 10-30cm. Move valuables to higher ground. Avoid underpasses and flooded roads.",
        actions=["Move valuables above knee height", "Avoid underpasses and flooded roads", "Keep emergency numbers saved", "If water enters home, move to nearest shelter"],
        ward_ids=["w-001", "w-002", "w-004", "w-005"],
        ward_names=["Malakpet", "Chaderghat", "Moosarambagh", "Hafiz Baba Nagar"],
        issued_at=_now - timedelta(minutes=45),
        expires_at=_now + timedelta(hours=5),
        is_active=True, language="en",
        channels=["in_app", "push", "sms", "whatsapp"],
        sent_by="Operator Vijay K.", estimated_reach=163000,
        delivery_stats={"sent": 142000, "delivered": 128500, "read": 87200},
    ),
    AlertResponse(
        id="a-002", hazard="heat", severity="warning",
        title="Heat Wave Alert — Old City & Southern Zones",
        message="Maximum temperature expected to reach 43-44°C with heat index over 48°C. Outdoor workers and elderly residents should avoid direct sun exposure between 11 AM and 4 PM. Drink water frequently. Visit nearest cooling centre if feeling unwell.",
        actions=["Stay indoors 11 AM - 4 PM", "Drink water every 20 minutes if outdoors", "Visit nearest cooling centre if feeling dizzy or nauseous", "Check on elderly neighbours"],
        ward_ids=["w-003", "w-007", "w-010", "w-013", "w-014", "w-015", "w-022"],
        ward_names=["Falaknuma", "Charminar", "Kukatpally", "Mehdipatnam", "LB Nagar", "ECIL", "Uppal"],
        issued_at=_now - timedelta(hours=3),
        expires_at=_now + timedelta(hours=8),
        is_active=True, language="en",
        channels=["in_app", "push", "sms"],
        sent_by="Operator Ananya R.", estimated_reach=345000,
        delivery_stats={"sent": 298000, "delivered": 275000, "read": 195000},
    ),
    AlertResponse(
        id="a-003", hazard="flood", severity="advisory",
        title="Rain Watch — Western Hyderabad",
        message="Moderate rainfall of 20-30mm expected over next 24 hours in Tolichowki, Mehdipatnam, Banjara Hills areas. Monitor weather updates. No major flooding expected but some surface waterlogging possible in low spots.",
        actions=["Carry an umbrella if going out", "Avoid parking in low-lying areas", "Report any waterlogging to helpline"],
        ward_ids=["w-012", "w-013", "w-019"],
        ward_names=["Tolichowki", "Mehdipatnam", "Banjara Hills"],
        issued_at=_now - timedelta(hours=1),
        expires_at=_now + timedelta(hours=23),
        is_active=True, language="en",
        channels=["in_app"],
        sent_by="System (Auto)", estimated_reach=129000,
        delivery_stats={"sent": 110000, "delivered": 98000, "read": 52000},
    ),
]


# ============================================================================
# REPORTS
# ============================================================================
MOCK_REPORTS = [
    ReportResponse(
        id="r-001", type="waterlogging", severity="high",
        description="Knee-deep water on Malakpet main road near railway underpass. Vehicles stranded. Water not draining.",
        lat=17.368, lng=78.506, ward_id="w-001", ward_name="Malakpet",
        status="confirmed", confirmations=12,
        submitted_at=_now - timedelta(hours=2), language="en",
    ),
    ReportResponse(
        id="r-002", type="blocked_drain", severity="high",
        description="Main nala completely blocked with garbage near Chaderghat bridge. Water backing up toward settlements.",
        lat=17.373, lng=78.494, ward_id="w-002", ward_name="Chaderghat",
        status="under_review", confirmations=8,
        submitted_at=_now - timedelta(hours=4), language="en",
    ),
    ReportResponse(
        id="r-003", type="heat_stress", severity="medium",
        description="Construction workers showing signs of heat exhaustion. No shade provided near Falaknuma depot.",
        lat=17.353, lng=78.478, ward_id="w-003", ward_name="Falaknuma",
        status="confirmed", confirmations=5,
        submitted_at=_now - timedelta(hours=6), language="en",
    ),
]


# ============================================================================
# EMERGENCY CONTACTS
# ============================================================================
EMERGENCY_CONTACTS = [
    {"name": "National Emergency", "number": "112", "description": "Police, Fire, Ambulance"},
    {"name": "Ambulance", "number": "108", "description": "Medical emergency"},
    {"name": "Disaster Helpline", "number": "1070", "description": "NDMA disaster response"},
    {"name": "GHMC Helpline", "number": "040-21111111", "description": "Municipal emergency"},
    {"name": "Flood Control Room", "number": "040-23222370", "description": "TSDMA flood operations"},
    {"name": "Women Helpline", "number": "181", "description": "Women in distress"},
]
