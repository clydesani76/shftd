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
| 3️⃣ Backtest | Simulates the opening range breakout trade on every day, with your entry, stop, target, exit time and costs |
| 4️⃣ Score card | Win rate, profit factor, average result per trade, total profit, worst drawdown, losing streak, plus an account growth chart |
| 5️⃣ Chart one day | A candlestick chart of one day with the opening range, entry, exit, stop and target drawn on it |
| 💾 Download | Saves the study and the trade list as CSV files for Excel, Numbers or Google Sheets |

### Backtest rules

The backtest waits for the opening range to finish, then trades the **first side that breaks**. One trade per day.
Every choice is a setting in box 3️⃣:

| Setting | Options |
|---|---|
| Entry | **On the break** (stop order 1 tick past the range) or **On a candle close** outside the range |
| Direction | Both, long only, short only |
| Stop | Other side of the range, middle of the range, or a fixed number of points |
| Target | A multiple of your risk (2 = 2R), or 0 for no target |
| Exit time | Any open trade is closed at this time (default 11:30) |
| Range filter | Skip days when the opening range is bigger than X points |
| Costs | NQ or MNQ, number of contracts, commission, slippage in ticks |

To stay honest, the backtest is deliberately cautious:
- Stop-order entries and exits, and time exits, lose the slippage you set. Target fills don't.
- If price gaps past your entry or stop, you get the worse price.
- If the stop and target are both hit inside one 5-minute candle, it counts as a **loss**.
- Days where one candle breaks both sides of the range are skipped.

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
| 4. Setup detection | Opening range breakout as rules | **Done** |
| 5. Backtesting | Simulate entries, stops, targets and costs on past days | **Done** |
| 6. Trade scoring | Win rate, profit factor, expectancy, drawdown | **Done** (basic) |
| 6b. Filters | Test what separates good days from bad (range size, gaps, news days, trend) | **Next** |
| 7. Dashboard | See setups and results visually | |
| 8. Paper trading | Run live on a simulated account | |
| 9. Automation (optional) | Send orders to a broker, with safety limits | |

## Limits right now

- History starts at about **60 days** and grows from there. That's enough to build and
  try out tools, but trust results more as the history grows. Years of older data need a paid source.
- Continuous contracts (`NQ=F`, `NQ1!`) jump a little at each quarterly roll.
- 5-minute candles can't show what happened *inside* a candle, which is why the backtest makes cautious assumptions.
- A good backtest is not a promise. Results only start to mean something after 100+ trades.
