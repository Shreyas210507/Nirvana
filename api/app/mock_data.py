"""
Mock data for Hyderabad pilot — 22 wards, shelters, alerts, reports.
Used when USE_MOCK_DATA=True (default for demo).
"""

from datetime import datetime, timedelta
from app.models import WardBase, AlertResponse, ShelterResponse, ReportResponse


# ============================================================================
# WARDS — Hyderabad pilot (22 wards with realistic data)
# ============================================================================
HYDERABAD_WARDS = [
    WardBase(id="w-001", name="Malakpet", name_local="మాలక్‌పేట్", zone="Charminar", population=62000, area=3.2, avg_elevation=525, drainage_condition="poor", impervious_fraction=0.82, green_cover_fraction=0.08, informal_settlement_fraction=0.22, elderly_population_fraction=0.09, outdoor_worker_fraction=0.18, historical_flood_frequency=7),
    WardBase(id="w-002", name="Chaderghat", name_local="చాదర్ఘాట్", zone="Charminar", population=48000, area=2.1, avg_elevation=520, drainage_condition="very_poor", impervious_fraction=0.88, green_cover_fraction=0.05, informal_settlement_fraction=0.30, elderly_population_fraction=0.11, outdoor_worker_fraction=0.22, historical_flood_frequency=8),
    WardBase(id="w-003", name="Falaknuma", name_local="ఫలక్‌నుమా", zone="Charminar", population=71000, area=4.5, avg_elevation=535, drainage_condition="poor", impervious_fraction=0.78, green_cover_fraction=0.10, informal_settlement_fraction=0.28, elderly_population_fraction=0.12, outdoor_worker_fraction=0.25, historical_flood_frequency=4),
    WardBase(id="w-004", name="Moosarambagh", name_local="మూసారాంబాగ్", zone="Charminar", population=45000, area=2.8, avg_elevation=518, drainage_condition="poor", impervious_fraction=0.85, green_cover_fraction=0.06, informal_settlement_fraction=0.15, elderly_population_fraction=0.08, outdoor_worker_fraction=0.20, historical_flood_frequency=6),
    WardBase(id="w-005", name="Hafiz Baba Nagar", name_local="హఫీజ్ బాబా నగర్", zone="Charminar", population=38000, area=2.0, avg_elevation=522, drainage_condition="very_poor", impervious_fraction=0.90, green_cover_fraction=0.04, informal_settlement_fraction=0.35, elderly_population_fraction=0.10, outdoor_worker_fraction=0.24, historical_flood_frequency=7),
    WardBase(id="w-006", name="Amberpet", name_local="అంబర్‌పేట", zone="Amberpet", population=55000, area=3.5, avg_elevation=540, drainage_condition="fair", impervious_fraction=0.72, green_cover_fraction=0.15, informal_settlement_fraction=0.10, elderly_population_fraction=0.07, outdoor_worker_fraction=0.12, historical_flood_frequency=3),
    WardBase(id="w-007", name="Charminar", name_local="చార్మినార్", zone="Charminar", population=82000, area=5.0, avg_elevation=530, drainage_condition="poor", impervious_fraction=0.92, green_cover_fraction=0.03, informal_settlement_fraction=0.20, elderly_population_fraction=0.13, outdoor_worker_fraction=0.28, historical_flood_frequency=5),
    WardBase(id="w-008", name="Nampally", name_local="నాంపల్లి", zone="Nampally", population=67000, area=4.2, avg_elevation=545, drainage_condition="fair", impervious_fraction=0.75, green_cover_fraction=0.12, informal_settlement_fraction=0.08, elderly_population_fraction=0.06, outdoor_worker_fraction=0.10, historical_flood_frequency=2),
    WardBase(id="w-009", name="Secunderabad", name_local="సికింద్రాబాద్", zone="Secunderabad", population=95000, area=8.0, avg_elevation=555, drainage_condition="good", impervious_fraction=0.65, green_cover_fraction=0.22, informal_settlement_fraction=0.05, elderly_population_fraction=0.07, outdoor_worker_fraction=0.08, historical_flood_frequency=1),
    WardBase(id="w-010", name="Kukatpally", name_local="కూకట్‌పల్లి", zone="Kukatpally", population=120000, area=12.0, avg_elevation=560, drainage_condition="fair", impervious_fraction=0.70, green_cover_fraction=0.18, informal_settlement_fraction=0.08, elderly_population_fraction=0.06, outdoor_worker_fraction=0.10, historical_flood_frequency=2),
    WardBase(id="w-011", name="Begumpet", name_local="బేగంపేట", zone="Secunderabad", population=58000, area=4.0, avg_elevation=548, drainage_condition="good", impervious_fraction=0.60, green_cover_fraction=0.25, informal_settlement_fraction=0.03, elderly_population_fraction=0.05, outdoor_worker_fraction=0.06, historical_flood_frequency=1),
    WardBase(id="w-012", name="Tolichowki", name_local="తోళిచౌకి", zone="Karwan", population=73000, area=5.5, avg_elevation=538, drainage_condition="fair", impervious_fraction=0.68, green_cover_fraction=0.16, informal_settlement_fraction=0.12, elderly_population_fraction=0.07, outdoor_worker_fraction=0.14, historical_flood_frequency=3),
]


# ============================================================================
# SHELTERS
# ============================================================================
SHELTERS = [
    ShelterResponse(id="s-001", name="Govt. High School Malakpet", type="school", lat=17.370, lng=78.508, ward_id="w-001", ward_name="Malakpet", capacity=500, current_occupancy=45, facilities=["drinking_water", "toilets", "first_aid", "electricity", "phone_charging"], is_flood_safe=True, verification_status="verified-municipal", contact_phone="040-24567890", contact_name="Sri. Ravi Kumar", accessibility="full"),
    ShelterResponse(id="s-002", name="Community Hall Chaderghat", type="community_hall", lat=17.374, lng=78.496, ward_id="w-002", ward_name="Chaderghat", capacity=300, current_occupancy=0, facilities=["drinking_water", "toilets", "electricity"], is_flood_safe=True, verification_status="verified-community", contact_phone="040-24567891", accessibility="partial"),
    ShelterResponse(id="s-003", name="Osmania General Hospital", type="hospital", lat=17.368, lng=78.480, ward_id="w-008", ward_name="Nampally", capacity=200, current_occupancy=150, facilities=["drinking_water", "toilets", "first_aid", "electricity", "medical_staff", "phone_charging", "ambulance"], is_flood_safe=True, verification_status="verified-municipal", contact_phone="040-24600146", accessibility="full"),
    ShelterResponse(id="s-004", name="Falaknuma Cooling Centre", type="cooling_centre", lat=17.355, lng=78.475, ward_id="w-003", ward_name="Falaknuma", capacity=150, current_occupancy=28, facilities=["drinking_water", "toilets", "electricity", "cooling", "ors_station"], is_flood_safe=True, verification_status="verified-municipal", accessibility="full"),
    ShelterResponse(id="s-005", name="GHMC Relief Camp Moosarambagh", type="relief_camp", lat=17.365, lng=78.518, ward_id="w-004", ward_name="Moosarambagh", capacity=400, current_occupancy=0, facilities=["drinking_water", "toilets", "first_aid", "electricity", "food_supply", "bedding"], is_flood_safe=True, verification_status="verified-municipal", contact_phone="040-21111111", accessibility="full"),
]


# ============================================================================
# ALERTS
# ============================================================================
_now = datetime.utcnow()
MOCK_ALERTS = [
    AlertResponse(
        id="a-001", hazard="flood", severity="warning",
        title="Heavy Rain Warning — Musi River Corridor",
        message="Heavy rainfall of 60-80mm expected in next 6 hours across Malakpet, Chaderghat, Hafiz Baba Nagar and Moosarambagh areas.",
        actions=["Move valuables above knee height", "Avoid underpasses", "Keep emergency numbers saved"],
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
        message="Maximum temperature expected to reach 43-44°C with heat index over 48°C.",
        actions=["Stay indoors 11 AM - 4 PM", "Drink water every 20 minutes", "Visit nearest cooling centre"],
        ward_ids=["w-003", "w-007", "w-010"],
        ward_names=["Falaknuma", "Charminar", "Kukatpally"],
        issued_at=_now - timedelta(hours=3),
        expires_at=_now + timedelta(hours=8),
        is_active=True, language="en",
        channels=["in_app", "push", "sms"],
        sent_by="Operator Ananya R.", estimated_reach=345000,
        delivery_stats={"sent": 298000, "delivered": 275000, "read": 195000},
    ),
]


# ============================================================================
# REPORTS
# ============================================================================
MOCK_REPORTS = [
    ReportResponse(id="r-001", type="waterlogging", severity="high", description="Knee-deep water on Malakpet main road near railway underpass.", lat=17.368, lng=78.506, ward_id="w-001", ward_name="Malakpet", status="confirmed", confirmations=12, submitted_at=_now - timedelta(hours=2), language="en"),
    ReportResponse(id="r-002", type="blocked_drain", severity="high", description="Main nala completely blocked with garbage near Chaderghat bridge.", lat=17.373, lng=78.494, ward_id="w-002", ward_name="Chaderghat", status="under_review", confirmations=8, submitted_at=_now - timedelta(hours=4), language="en"),
    ReportResponse(id="r-003", type="heat_stress", severity="medium", description="Construction workers showing signs of heat exhaustion. No shade provided.", lat=17.353, lng=78.478, ward_id="w-003", ward_name="Falaknuma", status="confirmed", confirmations=5, submitted_at=_now - timedelta(hours=6), language="en"),
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
