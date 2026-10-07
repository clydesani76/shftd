# NQ Research Platform

Research NQ futures setups around the **9:30 AM New York open**.
Everything runs **in your web browser**. Nothing to install.

## ▶ Open it

**[Click here to open the research notebook in Google Colab](https://colab.research.google.com/github/clydesani76/shftd/blob/claude/gallant-hypatia-bxfvnk/nq-research/NQ_Research.ipynb)**

Google Colab is a free Google service that runs Python on Google's computers.
You only need a Google account (the one you use for Gmail works).

### First time

1. Click the link above. Colab opens in a new tab.
2. Click **Sign in** (top right) if you aren't signed in to Google.
3. Click **File → Save a copy in Drive**. A new tab opens with **your own copy**.
   Work in that copy from now on. Your setting changes are saved there, and it
   lives in your Google Drive in a folder called **Colab Notebooks**.
4. In your copy, click **Runtime → Run all**.
5. If a box says **"Warning: This notebook was not authored by Google"**, click **Run anyway**.
6. Wait about 30 seconds. Results appear under each box.

### Every time after that

Go to https://drive.google.com, open **Colab Notebooks**, double-click
**Copy of NQ_Research.ipynb**, then click **Runtime → Run all**.

## What the notebook does

| Box | What it does |
|---|---|
| ⚙️ Settings | Choose the data source, open time, opening-range length, watch window, and which day to chart |
| 1️⃣ Load price data | Downloads 60 days of free 5-minute NQ candles from Yahoo, **or** lets you upload a TradingView export |
| 2️⃣ Opening range study | For every day: the range high/low, which side broke first, and how far price went past it. Plus a summary |
| 3️⃣ Chart one day | A candlestick chart of one day with the opening range drawn on it |
| 💾 Download | Saves the results table as a CSV file for Excel, Numbers or Google Sheets |

Results table columns:

| Column | Meaning |
|---|---|
| `range_high` / `range_low` | Highest and lowest price during the opening range |
| `range_size` | High minus low, in NQ points |
| `first_break` | Which side price broke first after the range: `up`, `down`, `none`, or `same candle` |
| `broke_up` / `broke_down` | Did price ever trade beyond that side before the watch window ended |
| `max_points_above` / `max_points_below` | Furthest price went past the range high / low |

## Using TradingView data

1. In TradingView, open a chart of **`NQ1!`** (NASDAQ 100 E-mini Futures) on the **5m** timeframe.
2. Scroll the chart left to load as much history as it allows. The export only includes loaded candles.
3. Click the small **down arrow next to your layout name** (top right of the chart) → **Export chart data…** → **Export**.
   A `.csv` file lands in your Downloads folder. (Exporting may need a paid TradingView plan.)
4. In the notebook's **Settings** box, change **DATA_SOURCE** to **Upload a TradingView export**.
5. Click **Runtime → Run all**. When box 1️⃣ shows a **Choose Files** button, click it and pick the CSV.

## The roadmap

| Stage | What you get | Status |
|---|---|---|
| 1. Data | Load NQ candles (Yahoo or TradingView) | **Done** |
| 2. First study | Opening range stats and charts for every day | **Done** |
| 3. Better data | Years of 1-minute history | Next |
| 4. Setup detection | Your own setups as rules the computer can check | |
| 5. Backtesting | Simulate entries, stops, targets and costs on past days | |
| 6. Trade scoring | Grade each setup on win rate, expectancy and drawdown | |
| 7. Dashboard | See setups and results visually | |
| 8. Paper trading | Run live on a simulated account | |
| 9. Automation (optional) | Send orders to a broker, with safety limits | |

## Limits right now

- Yahoo's free data only goes back about **60 days**. That's fine for learning, but too little to trust a strategy.
- TradingView exports are capped by your plan's bar limit.
- Continuous contracts (`NQ=F`, `NQ1!`) jump a little at each quarterly roll.
- These numbers describe what happened. They are **not** a backtest yet: no entries,
  stops, slippage or commissions. That's Stage 5.
