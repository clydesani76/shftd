# ---------------------------------------------------------------
# import_tradingview.py  -  LOAD DATA EXPORTED FROM TRADINGVIEW
#
# What it does:
#   1. Reads a CSV file you exported from a TradingView chart.
#   2. Converts the times to New York time.
#   3. Saves it to data/nq.csv - the same file get_data.py makes -
#      so opening_range.py (and later scripts) use it automatically.
#
# How to run it:   python import_tradingview.py "path/to/your/export.csv"
#
# Tip: on a Mac you can drag the CSV file from Finder into the
# VS Code terminal and it types the path for you.
# ---------------------------------------------------------------

import sys
from pathlib import Path

import pandas as pd

import config

if len(sys.argv) != 2:
    raise SystemExit('Tell me which file to import, like this:\n  python import_tradingview.py "export.csv"')

export_file = Path(sys.argv[1])
if not export_file.exists():
    raise SystemExit(f"Can't find the file: {export_file}")

raw = pd.read_csv(export_file)

# TradingView names the columns time, open, high, low, close, Volume
# (plus a column for every indicator on the chart). Make the names
# lowercase so we don't care how they're capitalised.
raw.columns = [column.strip().lower() for column in raw.columns]

missing = [column for column in ["time", "open", "high", "low", "close"] if column not in raw.columns]
if missing:
    raise SystemExit(f"This doesn't look like a TradingView export. Missing columns: {missing}")

# TradingView can export time two ways:
#   "UNIX timestamp" - a big number of seconds, e.g. 1704205800
#   "ISO time"       - readable text, e.g. 2024-01-02T09:30:00-05:00
if pd.api.types.is_numeric_dtype(raw["time"]):
    times = pd.to_datetime(raw["time"], unit="s", utc=True)
else:
    times = pd.to_datetime(raw["time"], utc=True)

candles = pd.DataFrame({
    "Open": raw["open"].values,
    "High": raw["high"].values,
    "Low": raw["low"].values,
    "Close": raw["close"].values,
    "Volume": raw["volume"].values if "volume" in raw.columns else 0,
}, index=times.dt.tz_convert(config.TIMEZONE))
candles.index.name = "Time"
candles = candles.sort_index()

Path("data").mkdir(exist_ok=True)
candles.to_csv("data/nq.csv")

minutes = candles.index.to_series().diff().dropna().dt.total_seconds().median() / 60
print(f"Imported {len(candles):,} candles from {export_file.name}")
print(f"Candle size:  about {minutes:g} minutes")
print(f"First candle: {candles.index[0]}")
print(f"Last candle:  {candles.index[-1]}")
print(f"Trading days: {len(set(candles.index.date))}")
print()
print("Saved to data/nq.csv. Now run:  python opening_range.py")
