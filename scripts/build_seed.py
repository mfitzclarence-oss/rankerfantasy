#!/usr/bin/env python3
"""
Transforms data/raw_adp_ppr.txt (a 2026 12-team PPR ADP export, see
README's "Data Refresh" section for the source and methodology) into:
  - data/players_seed.json   (structured player rows the app/seed script consumes)
  - supabase/seed/seed_players.sql  (a plain-SQL fallback that can be pasted
    into the Supabase SQL editor without running any Node code)

Re-run this whenever data/raw_adp_ppr.txt is refreshed with a new export.
This script does NOT talk to Supabase — scripts/seed.ts does that, reading
players_seed.json and upserting via the service-role client so re-running
is idempotent (matched by `slug`).
"""
import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RAW = ROOT / "data" / "raw_adp_ppr.txt"
OUT_JSON = ROOT / "data" / "players_seed.json"
OUT_SQL = ROOT / "supabase" / "seed" / "seed_players.sql"

TEAM_NAMES = {
    "ARI": "Arizona Cardinals", "ATL": "Atlanta Falcons", "BAL": "Baltimore Ravens",
    "BUF": "Buffalo Bills", "CAR": "Carolina Panthers", "CHI": "Chicago Bears",
    "CIN": "Cincinnati Bengals", "CLE": "Cleveland Browns", "DAL": "Dallas Cowboys",
    "DEN": "Denver Broncos", "DET": "Detroit Lions", "GB": "Green Bay Packers",
    "HOU": "Houston Texans", "IND": "Indianapolis Colts", "JAX": "Jacksonville Jaguars",
    "KC": "Kansas City Chiefs", "LAC": "Los Angeles Chargers", "LAR": "Los Angeles Rams",
    "LV": "Las Vegas Raiders", "MIA": "Miami Dolphins", "MIN": "Minnesota Vikings",
    "NE": "New England Patriots", "NO": "New Orleans Saints", "NYG": "New York Giants",
    "NYJ": "New York Jets", "PHI": "Philadelphia Eagles", "PIT": "Pittsburgh Steelers",
    "SEA": "Seattle Seahawks", "SF": "San Francisco 49ers", "TB": "Tampa Bay Buccaneers",
    "TEN": "Tennessee Titans", "WAS": "Washington Commanders",
}

# Illustrative 2026 bye-week slotting (weeks 5-14, ~2 teams/week). Marked as
# a placeholder to refresh from the league's official schedule release —
# see README Data Refresh section. Not used for anything ranking-critical.
BYE_WEEKS = {
    "ARI": 8, "ATL": 5, "BAL": 7, "BUF": 7, "CAR": 14, "CHI": 5, "CIN": 10,
    "CLE": 9, "DAL": 10, "DEN": 12, "DET": 8, "GB": 5, "HOU": 6, "IND": 11,
    "JAX": 8, "KC": 10, "LAC": 12, "LAR": 8, "LV": 8, "MIA": 12, "MIN": 6,
    "NE": 14, "NO": 11, "NYG": 14, "NYJ": 9, "PHI": 9, "PIT": 5, "SEA": 8,
    "SF": 14, "TB": 9, "TEN": 10, "WAS": 12,
}

MISSING_DST = ["ARI", "CAR", "IND", "KC", "LV", "MIA", "NYJ"]

LINE_RE = re.compile(r"^\d+\.\s+(.+?)\s+-\s+([A-Z]+)\s+-\s+([A-Z]+)$")


def slugify(name: str) -> str:
    s = name.lower()
    s = re.sub(r"[.']", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def main():
    lines = [l.strip() for l in RAW.read_text().splitlines() if l.strip()]
    entries = []
    for line in lines:
        m = LINE_RE.match(line)
        if not m:
            raise ValueError(f"unparsable line: {line!r}")
        name, pos, team = m.groups()
        entries.append({"rank": len(entries) + 1, "name": name, "pos": pos, "team": team})

    # Append the 7 NFL defenses missing from the ADP export (kickers/DST are
    # drafted late and mock-draft samples don't always include every team).
    next_rank = len(entries) + 1
    for team in MISSING_DST:
        entries.append({"rank": next_rank, "name": f"{TEAM_NAMES[team]} Defense", "pos": "DST", "team": team})
        next_rank += 1

    draft_relevant_positions = {"QB", "RB", "WR", "TE"}
    overall_rank = 0
    position_ranks = {}
    players = []

    for e in entries:
        pos = "DST" if e["pos"] == "DST" else e["pos"]
        team = e["team"]
        position_ranks.setdefault(pos, 0)
        position_ranks[pos] += 1

        if pos in draft_relevant_positions:
            overall_rank += 1
            seed_rank_overall = overall_rank
        else:
            seed_rank_overall = None

        if pos == "DST":
            full_name = e["name"]
            first_name = TEAM_NAMES[team].split(" ")[0]
            last_name = "Defense"
        else:
            full_name = e["name"]
            parts = full_name.split(" ")
            first_name = parts[0]
            last_name = " ".join(parts[1:]) if len(parts) > 1 else ""

        players.append({
            "full_name": full_name,
            "first_name": first_name,
            "last_name": last_name,
            "position": pos,
            "nfl_team": TEAM_NAMES[team],
            "team_abbreviation": team,
            "bye_week": BYE_WEEKS[team],
            "headshot_url": None,
            "active": True,
            "fantasy_relevant": True,
            "slug": slugify(full_name if pos != "DST" else f"{team}-defense"),
            "external_ref": f"adp-2026-ppr-{e['rank']}",
            "seed_rank_overall": seed_rank_overall,
            "seed_rank_position": position_ranks[pos],
        })

    # De-dupe slugs defensively (two players sharing a slugified name).
    seen = {}
    for p in players:
        base = p["slug"]
        if base in seen:
            seen[base] += 1
            p["slug"] = f"{base}-{p['team_abbreviation'].lower()}"
        else:
            seen[base] = 1

    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(players, indent=2))

    OUT_SQL.parent.mkdir(parents=True, exist_ok=True)
    with OUT_SQL.open("w") as f:
        f.write("-- Auto-generated by scripts/build_seed.py — do not hand-edit.\n")
        f.write("-- Paste into the Supabase SQL editor as a one-time seed, or prefer\n")
        f.write("-- `npm run seed` (scripts/seed.ts) which is idempotent and also seeds ratings.\n\n")
        for p in players:
            def esc(v):
                if v is None:
                    return "null"
                if isinstance(v, bool):
                    return "true" if v else "false"
                if isinstance(v, int):
                    return str(v)
                return "'" + str(v).replace("'", "''") + "'"

            cols = ["full_name","first_name","last_name","position","nfl_team","team_abbreviation",
                    "bye_week","headshot_url","active","fantasy_relevant","slug","external_ref",
                    "seed_rank_overall","seed_rank_position"]
            vals = ", ".join(esc(p[c]) for c in cols)
            f.write(f"insert into players ({', '.join(cols)}) values ({vals}) on conflict (slug) do nothing;\n")

    by_pos = {}
    for p in players:
        by_pos[p["position"]] = by_pos.get(p["position"], 0) + 1

    print(f"Wrote {len(players)} players to {OUT_JSON}")
    print("By position:", by_pos)


if __name__ == "__main__":
    main()
