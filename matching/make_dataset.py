import csv
import math
import random
from datetime import datetime, timedelta

SEED = 42
N_SCENARIOS = 200
TEST_FRACTION = 0.30
random.seed(SEED)

CATEGORIES = ["Odor", "Smoke/Haze", "Runoff/Water", "Dust/Particles", "Noise"]

ANCHORS = [
    (32.9546, -97.0150),  # Coppell
    (32.8140, -96.9489),  # Irving
    (33.0198, -96.6989),  # Plano
    (32.7767, -96.7970),  # Dallas
    (32.9126, -96.6389),  # Richardson
    (32.9343, -97.0780),  # Grapevine
]
PHRASES = {
    "Odor": [
        ("burning", ["strong burning plastic smell", "smells like burning plastic outside",
                     "acrid burning smell near the street", "chemical burning odor, hard to breathe"]),
        ("egg", ["rotten egg smell in the air", "sulfur smell, like rotten eggs",
                 "strong sulfur odor near the creek", "smells like rotten eggs again"]),
        ("gas", ["natural gas smell on my block", "smells like gas near the park",
                 "gas odor outside the school", "strong gas smell by the road"]),
        ("sewage", ["sewage smell coming from the drain", "smells like sewage near the field",
                    "foul sewage odor outside", "bad sewer smell on the trail"]),
    ],
    "Smoke/Haze": [
        ("grey", ["grey smoke drifting over the neighborhood", "thick grey haze near the highway",
                  "smoke drifting across the road", "hazy grey smoke over the park"]),
        ("black", ["black smoke rising from the west", "dark black smoke over the lot",
                   "thick black smoke visible from school", "black plume of smoke nearby"]),
        ("campfire", ["smells like woodsmoke and visible haze", "woodsmoke haze hanging low",
                      "smoky haze, like a brush fire", "visible haze with a wood smoke smell"]),
    ],
    "Runoff/Water": [
        ("foam", ["white foam in the creek", "foamy water running into the drain",
                  "soapy foam on the creek surface", "foam building up in the stream"]),
        ("oily", ["oily sheen on the runoff", "rainbow oil sheen on the puddle",
                  "oily water flowing down the street", "oil slick in the drainage ditch"]),
        ("brown", ["brown muddy water in the creek", "cloudy brown runoff from the site",
                   "muddy brown water in the ditch", "discolored brown runoff in the street"]),
    ],
    "Dust/Particles": [
        ("construction", ["thick dust from construction nearby", "dust cloud from the building site",
                          "gritty construction dust on my car", "heavy dust blowing from the site"]),
        ("ash", ["fine grey ash falling on cars", "ash particles on the windowsill",
                 "falling ash covering the patio", "light ash dust on everything outside"]),
    ],
    "Noise": [
        ("rumble", ["low constant rumbling noise", "loud rumbling sound that will not stop",
                    "deep rumble from the industrial area", "constant low rumbling noise outside"]),
        ("alarm", ["loud alarm sounding repeatedly", "piercing alarm going off for a while",
                   "repeating siren-like alarm sound", "alarm blaring near the warehouse"]),
        ("banging", ["loud banging and clanging", "repeated banging from the plant",
                     "heavy clanging noise at night", "loud metal banging sounds"]),
    ],
}

# which other categories can plausibly describe the same occurrence
CROSS_CATEGORY = {"Odor": "Smoke/Haze", "Smoke/Haze": "Odor"}


def offset_latlng(lat, lng, meters, bearing_deg):
    """Move a point by `meters` along a bearing."""
    d = meters / 6371000.0
    b = math.radians(bearing_deg)
    la1, lo1 = math.radians(lat), math.radians(lng)
    la2 = math.asin(math.sin(la1) * math.cos(d) + math.cos(la1) * math.sin(d) * math.cos(b))
    lo2 = lo1 + math.atan2(math.sin(b) * math.sin(d) * math.cos(la1),
                           math.cos(d) - math.sin(la1) * math.sin(la2))
    return math.degrees(la2), math.degrees(lo2)


def pick_text(category, theme=None, missing_p=0.10):
    if random.random() < missing_p:
        return "", theme
    themes = PHRASES[category]
    if theme is None:
        theme = random.choice(themes)[0]
    for t, variants in themes:
        if t == theme:
            return random.choice(variants), theme
    return random.choice(themes[0][1]), themes[0][0]


class Counter:
    obs = 0
    users = 0


def new_obs(category, lat, lng, t, text, user=None):
    Counter.obs += 1
    if user is None:
        Counter.users += 1
        user = f"u{Counter.users:03d}"
    return {
        "id": f"o{Counter.obs:04d}", "user": user, "category": category,
        "text": text, "lat": round(lat, 6), "lng": round(lng, 6),
        "time": t.strftime("%Y-%m-%d %H:%M"),
    }


def random_base():
    lat, lng = random.choice(ANCHORS)
    lat, lng = offset_latlng(lat, lng, random.uniform(0, 3000), random.uniform(0, 360))
    day = datetime(2026, 9, 1) + timedelta(days=random.randint(0, 40))
    t = day + timedelta(hours=random.randint(0, 23), minutes=random.randint(0, 59))
    return lat, lng, t


def make_event_reports(category, n, spread_m, span_min, theme=None, user_repeat=False,
                       missing_p=0.10, cross_category=False):
    """n reports that all come from ONE simulated event."""
    lat, lng, t0 = random_base()
    _, theme = pick_text(category, theme, 0)
    reports = []
    first_user = None
    for i in range(n):
        la, lo = offset_latlng(lat, lng, random.uniform(0, spread_m), random.uniform(0, 360))
        t = t0 + timedelta(minutes=random.uniform(0, span_min))
        cat = category
        th = theme
        if cross_category and i == n - 1:
            cat = CROSS_CATEGORY.get(category, category)
            th = None  # different category, different phrase bank
        text, _ = pick_text(cat, th, missing_p)
        user = first_user if (user_repeat and i == 1) else None
        o = new_obs(cat, la, lo, t, text, user)
        if i == 0:
            first_user = o["user"]
        reports.append(o)
    return reports


def pair_rows(scenario_id, stype, reports_by_event):
    """reports_by_event: list of (event_id, report). Emit all pairs with labels."""
    rows = []
    for i in range(len(reports_by_event)):
        for j in range(i + 1, len(reports_by_event)):
            (ea, a), (eb, b) = reports_by_event[i], reports_by_event[j]
            rows.append((scenario_id, stype, a, b, int(ea == eb)))
    return rows


# ---------------- scenario builders ----------------
def sc_same_tight():
    cat = random.choice(CATEGORIES)
    r = make_event_reports(cat, random.choice([2, 3]), random.uniform(30, 300), random.uniform(3, 20))
    return [("E1", x) for x in r]


def sc_same_loose():
    # genuine same event, but spread out / long lasting (hard positive)
    cat = random.choice(CATEGORIES)
    r = make_event_reports(cat, 2, random.uniform(300, 900), random.uniform(25, 60))
    return [("E1", x) for x in r]


def sc_same_cross_category():
    cat = random.choice(["Odor", "Smoke/Haze"])
    r = make_event_reports(cat, 2, random.uniform(50, 500), random.uniform(3, 30), cross_category=True)
    return [("E1", x) for x in r]


def sc_same_missing_text():
    cat = random.choice(CATEGORIES)
    r = make_event_reports(cat, 2, random.uniform(30, 400), random.uniform(3, 30), missing_p=0.7)
    return [("E1", x) for x in r]


def sc_same_repeat_account():
    cat = random.choice(CATEGORIES)
    r = make_event_reports(cat, 3, random.uniform(20, 250), random.uniform(10, 45), user_repeat=True)
    return [("E1", x) for x in r]


def _two_events(cat_a, cat_b, dist_m, gap_min, same_theme=False):
    lat, lng, t0 = random_base()
    ta, tha = pick_text(cat_a, None, 0.05)
    la2, lo2 = offset_latlng(lat, lng, dist_m, random.uniform(0, 360))
    tb, _ = pick_text(cat_b, tha if (same_theme and cat_a == cat_b) else None, 0.05)
    a = new_obs(cat_a, lat, lng, t0, ta)
    b = new_obs(cat_b, la2, lo2, t0 + timedelta(minutes=gap_min), tb)
    return [("E1", a), ("E2", b)]


def sc_neg_far():
    cat = random.choice(CATEGORIES)
    return _two_events(cat, cat, random.uniform(3000, 15000), random.uniform(0, 30), same_theme=True)


def sc_neg_same_place_hours_apart():
    cat = random.choice(CATEGORIES)
    return _two_events(cat, cat, random.uniform(0, 250), random.uniform(180, 600), same_theme=True)


def sc_neg_diff_category():
    a, b = random.sample(CATEGORIES, 2)
    while {a, b} == {"Odor", "Smoke/Haze"}:
        a, b = random.sample(CATEGORIES, 2)
    return _two_events(a, b, random.uniform(0, 300), random.uniform(0, 15))


def sc_neg_close_diff_theme():
    # hard negative: nearby, similar time, same category, but a DIFFERENT condition
    cat = random.choice([c for c in CATEGORIES if len(PHRASES[c]) > 1])
    lat, lng, t0 = random_base()
    (t1, v1), (t2, v2) = random.sample(PHRASES[cat], 2)
    la2, lo2 = offset_latlng(lat, lng, random.uniform(150, 700), random.uniform(0, 360))
    a = new_obs(cat, lat, lng, t0, random.choice(v1))
    b = new_obs(cat, la2, lo2, t0 + timedelta(minutes=random.uniform(5, 40)), random.choice(v2))
    return [("E1", a), ("E2", b)]


def sc_neg_close_same_theme_gap():
    # hard negative: same wording/category, nearby, but a long time gap (recurrence, not one event)
    cat = random.choice(CATEGORIES)
    return _two_events(cat, cat, random.uniform(50, 600), random.uniform(90, 240), same_theme=True)


def sc_neg_overnight():
    # evening vs next-morning: different events, same place
    cat = random.choice(CATEGORIES)
    lat, lng, t0 = random_base()
    t0 = t0.replace(hour=22, minute=random.randint(0, 59))
    ta, th = pick_text(cat, None, 0.05)
    tb, _ = pick_text(cat, th, 0.05)
    la2, lo2 = offset_latlng(lat, lng, random.uniform(0, 200), random.uniform(0, 360))
    a = new_obs(cat, lat, lng, t0, ta)
    b = new_obs(cat, la2, lo2, t0 + timedelta(hours=random.uniform(6, 9)), tb)
    return [("E1", a), ("E2", b)]


BUILDERS = [
    (sc_same_tight, 22), (sc_same_loose, 14), (sc_same_cross_category, 8),
    (sc_same_missing_text, 8), (sc_same_repeat_account, 6),
    (sc_neg_far, 12), (sc_neg_same_place_hours_apart, 12), (sc_neg_diff_category, 12),
    (sc_neg_close_diff_theme, 12), (sc_neg_close_same_theme_gap, 8), (sc_neg_overnight, 6),
]


def main():
    plan = []
    for fn, count in BUILDERS:
        plan += [fn] * count
    scale = N_SCENARIOS / len(plan)
    plan = [fn for fn, c in BUILDERS for _ in range(max(1, round(c * scale)))]
    random.shuffle(plan)

    scen_ids = [f"S{i + 1:03d}" for i in range(len(plan))]
    test_ids = set(random.sample(scen_ids, int(len(scen_ids) * TEST_FRACTION)))

    rows = []
    for sid, fn in zip(scen_ids, plan):
        stype = fn.__name__.replace("sc_", "")
        for r in pair_rows(sid, stype, fn()):
            rows.append(r)

    cols = ["pair_id", "scenario_id", "scenario_type", "split"]
    for side in ("a", "b"):
        cols += [f"{side}_id", f"{side}_user", f"{side}_category", f"{side}_text",
                 f"{side}_lat", f"{side}_lng", f"{side}_time"]
    cols += ["label"]

    with open("scenarios.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for k, (sid, stype, a, b, label) in enumerate(rows, 1):
            split = "test" if sid in test_ids else "train"
            w.writerow([f"P{k:04d}", sid, stype, split]
                       + [a[c] for c in ("id", "user", "category", "text", "lat", "lng", "time")]
                       + [b[c] for c in ("id", "user", "category", "text", "lat", "lng", "time")]
                       + [label])

    pos = sum(r[4] for r in rows)
    print(f"scenarios={len(plan)} pairs={len(rows)} positives={pos} negatives={len(rows) - pos}")
    print(f"test scenarios={len(test_ids)} (split by scenario)")


if __name__ == "__main__":
    main()
