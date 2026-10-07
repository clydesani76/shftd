# ---------------------------------------------------------------
# opening_range.py  -  STEP 2: STUDY THE OPENING RANGE
#
# For every trading day in data/nq.csv, this script answers:
#   - What was the high and low of the first few minutes after the open?
#   - Did price later break ABOVE that range, BELOW it, or both?
#   - Which side broke first?
#   - How far did price travel above and below the range afterwards?
#
# Run get_data.py first, then:   python opening_range.py
# ---------------------------------------------------------------

from datetime import timedelta
from pathlib import Path

import pandas as pd

import config

candles = pd.read_csv("data/nq.csv", index_col="Time")
candles.index = pd.to_datetime(candles.index, utc=True).tz_convert(config.TIMEZONE)

open_hour, open_minute = map(int, config.OPEN_TIME.split(":"))

results = []

# Go through the data one trading day at a time.
for day, day_candles in candles.groupby(candles.index.date):
    open_time = pd.Timestamp(day, tz=config.TIMEZONE).replace(hour=open_hour, minute=open_minute)
    range_end = open_time + timedelta(minutes=config.OPENING_RANGE_MINUTES)
    watch_end = open_time + timedelta(minutes=config.WATCH_MINUTES)

    # The candles that make up the opening range...
    range_candles = day_candles[(day_candles.index >= open_time) & (day_candles.index < range_end)]
    # ...and the candles we watch afterwards.
    after_candles = day_candles[(day_candles.index >= range_end) & (day_candles.index < watch_end)]

    # Skip weekends, holidays, and days with missing data.
    if range_candles.empty or after_candles.empty:
        continue

    range_high = range_candles["High"].max()
    range_low = range_candles["Low"].min()

    broke_up = after_candles[after_candles["High"] > range_high]
    broke_down = after_candles[after_candles["Low"] < range_low]

    if broke_up.empty and broke_down.empty:
        first_break = "none"
    elif broke_down.empty or (not broke_up.empty and broke_up.index[0] < broke_down.index[0]):
        first_break = "up"
    elif broke_up.empty or broke_down.index[0] < broke_up.index[0]:
        first_break = "down"
    else:
        # Both sides broke inside the same candle - we can't tell which came first.
        first_break = "same candle"

    results.append({
        "date": day,
        "range_high": range_high,
        "range_low": range_low,
        "range_size": range_high - range_low,
        "first_break": first_break,
        "broke_up": not broke_up.empty,
        "broke_down": not broke_down.empty,
        "max_points_above": max(after_candles["High"].max() - range_high, 0),
        "max_points_below": max(range_low - after_candles["Low"].min(), 0),
    })

if not results:
    raise SystemExit(f"No days found with data at {config.OPEN_TIME}. Did you run get_data.py first?")

table = pd.DataFrame(results)

Path("results").mkdir(exist_ok=True)
table.to_csv("results/opening_range.csv", index=False)

pd.set_option("display.width", 200)
print(f"Opening range: first {config.OPENING_RANGE_MINUTES} minutes after {config.OPEN_TIME} New York")
print(f"Watching price for {config.WATCH_MINUTES} minutes after the open")
print()
print(table.round(2).to_string(index=False))
print()
print("=========== SUMMARY ===========")
print(f"Days studied:                  {len(table)}")
print(f"Average range size:            {table['range_size'].mean():.1f} points")
print(f"Days that broke up first:      {(table['first_break'] == 'up').sum()}")
print(f"Days that broke down first:    {(table['first_break'] == 'down').sum()}")
print(f"Days that broke BOTH sides:    {(table['broke_up'] & table['broke_down']).sum()}")
print(f"Days that never broke out:     {(table['first_break'] == 'none').sum()}")
print(f"Average move above the range:  {table['max_points_above'].mean():.1f} points")
print(f"Average move below the range:  {table['max_points_below'].mean():.1f} points")
print()
print("Full table saved to results/opening_range.csv (open it in Excel).")
