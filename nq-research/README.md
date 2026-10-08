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
6. When Google asks **"Permit this notebook to access your Google Drive files?"**, click
   **Connect to Google Drive**, pick your account, and click **Continue** / **Allow**.
7. Wait about 30 seconds. Results appear under each box.

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

## Your growing price history

Yahoo's free data only covers the **last 60 days**. To get around that, the notebook saves
every download to **My Drive → NQ Research → nq_5m_history.csv** and adds new days to it
each time you run it. The study then uses the whole saved history.

**Run the notebook at least once a month** (once a week is safer) so no days are missed.
Your history grows from about 60 days today to a full year by next October, for free.

Don't want this? Untick **SAVE_HISTORY_TO_DRIVE** in the Settings box.

## Using TradingView data (optional)

TradingView's free plan has a small history limit, so its exports are usually *shorter*
than Yahoo's 60 days. This option is mainly for if you upgrade later.

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
| 3. Better data | History that grows in Google Drive with every run | **Done** |
| 3b. Years of data (optional, paid) | Buy older 1-minute history | Later |
| 4. Setup detection | Your own setups as rules the computer can check | **Next** |
| 5. Backtesting | Simulate entries, stops, targets and costs on past days | |
| 6. Trade scoring | Grade each setup on win rate, expectancy and drawdown | |
| 7. Dashboard | See setups and results visually | |
| 8. Paper trading | Run live on a simulated account | |
| 9. Automation (optional) | Send orders to a broker, with safety limits | |

## Limits right now

- History starts at about **60 days** and grows from there. That's enough to build and
  try out tools, but trust results more as the history grows. Years of older data need a paid source.
- Continuous contracts (`NQ=F`, `NQ1!`) jump a little at each quarterly roll.
- These numbers describe what happened. They are **not** a backtest yet: no entries,
  stops, slippage or commissions. That's Stage 5.
