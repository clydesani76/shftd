# ---------------------------------------------------------------
# get_data.py  -  STEP 1: DOWNLOAD NQ PRICE DATA
#
# What it does:
#   1. Asks Yahoo Finance for recent NQ candles.
#   2. Converts the times to New York time.
#   3. Saves them to data/nq.csv (you can open that file in Excel).
#
# How to run it:   python get_data.py
# ---------------------------------------------------------------

from pathlib import Path

import yfinance as yf

import config

print(f"Downloading {config.HISTORY} of {config.CANDLE_SIZE} candles for {config.SYMBOL}...")

candles = yf.download(
    config.SYMBOL,
    period=config.HISTORY,
    interval=config.CANDLE_SIZE,
    progress=False,
    auto_adjust=False,
)

if candles.empty:
    raise SystemExit("No data came back. Check your internet connection and try again.")

# Yahoo returns column names in two levels (e.g. "Close" / "NQ=F").
# We only want the first level: Open, High, Low, Close, Volume.
candles.columns = candles.columns.get_level_values(0)
candles = candles[["Open", "High", "Low", "Close", "Volume"]]

candles.index = candles.index.tz_convert(config.TIMEZONE)
candles.index.name = "Time"

Path("data").mkdir(exist_ok=True)
candles.to_csv("data/nq.csv")

print(f"Saved {len(candles):,} candles to data/nq.csv")
print(f"First candle: {candles.index[0]}")
print(f"Last candle:  {candles.index[-1]}")
print()
print("The last 5 candles look like this:")
print(candles.tail())
