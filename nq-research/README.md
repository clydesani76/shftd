# NQ Research Platform

A step-by-step project for researching NQ futures setups around the 9:30 AM New York open.
These instructions are written for a **Mac**.

## The roadmap

We build one stage at a time. Each stage gets finished before the next one starts.

| Stage | What you get | Status |
|---|---|---|
| 1. Data | Download NQ candles and save them to a file | **Done** (`get_data.py`) |
| 2. First study | Opening range stats for every day | **Done** (`opening_range.py`) |
| 3. Better data | Import longer history from TradingView (and later a paid source) | **In progress** (`import_tradingview.py`) |
| 4. Setup detection | Write your own setups as rules the computer can check | Next |
| 5. Backtesting | Simulate entries, stops, targets and costs on past days | |
| 6. Trade scoring | Grade each setup on win rate, expectancy and drawdown | |
| 7. Charts and dashboard | See setups and results visually | |
| 8. Paper trading | Run live on a simulated account | |
| 9. Automation (optional) | Send orders to a broker, with safety limits | |

---

## One-time setup (about 20 minutes)

You only do this once.

### 1. Install Python

Python is the programming language. It runs our scripts.

1. Go to https://www.python.org/downloads/
2. Click the big yellow **Download Python 3.x** button.
3. Open the `.pkg` file you downloaded and click **Continue** / **Agree** / **Install** through each screen.
   Enter your Mac password when asked.
4. When it finishes, a Finder window opens showing a **Python 3.x** folder.
   **Double-click `Install Certificates.command`** in that folder. A Terminal window
   opens, prints some text, and says `[Process completed]`. Close it.
   *(This lets Python make secure internet connections. Without it, `get_data.py`
   fails with an error mentioning `SSL` or `CERTIFICATE_VERIFY_FAILED`.)*
   If you closed the window already: open **Finder → Applications → Python 3.x**.

### 2. Install VS Code

VS Code is the program you'll use to read and edit the code, and to run it.

1. Go to https://code.visualstudio.com/ and click **Download for macOS**.
2. Open the downloaded `.zip`. Drag **Visual Studio Code** into your **Applications** folder.
3. Open VS Code from Applications. If the Mac asks "Are you sure you want to open it?", click **Open**.
4. Click the **Extensions** icon on the left side (four small squares).
5. Search for **Python**, then click **Install** on the one made by **Microsoft**.

### 3. Get this project onto your Mac

1. Open https://github.com/clydesani76/shftd in your browser.
2. Click the branch dropdown (it says `main`) and pick `claude/gallant-hypatia-bxfvnk`.
   (Skip this once the work is merged into `main`.)
3. Click the green **Code** button, then **Download ZIP**.
4. Open the ZIP from your Downloads folder. Inside, find the `nq-research` folder
   and drag it into your **Documents** folder.

### 4. Open the project in VS Code

1. In VS Code, click **File → Open Folder...**, choose **Documents → nq-research**, and click **Open**.
2. If VS Code asks "Do you trust the authors?", click **Yes, I trust the authors**.
3. Open the **terminal**: click **Terminal → New Terminal** in the top menu.
   A panel opens at the bottom. This is where you type commands.
   Every command below gets typed there, followed by the **Return** key.

### 5. Create a "virtual environment"

A virtual environment is a private box for this project's toolkits, so they
never clash with anything else on your Mac. Type:

```
python3 -m venv .venv
source .venv/bin/activate
```

It worked if the start of the terminal line now shows `(.venv)`.

> **Every time** you reopen VS Code, run `source .venv/bin/activate` again before anything else.

### 6. Install the toolkits

```
pip install -r requirements.txt
```

You'll see a lot of text scroll by. Wait until the line with `(.venv)` comes back.

---

## Running the research

> Once `(.venv)` is showing, `python` and `python3` mean the same thing. This guide uses `python`.

### Step 1: download data
```
python get_data.py
```

You should see something like `Saved 13,450 candles to data/nq.csv`.
A new `data` folder appears in VS Code's file list on the left.

### Step 2: study the opening range
```
python opening_range.py
```

You get a table with one row per day, then a summary. The same table is saved
to `results/opening_range.csv`. Double-click it in Finder to open it in Numbers or Excel.

What the columns mean:

| Column | Meaning |
|---|---|
| `range_high` / `range_low` | Highest and lowest price during the opening range |
| `range_size` | High minus low, in NQ points |
| `first_break` | Which side price broke first after the range: `up`, `down`, `none`, or `same candle` |
| `broke_up` / `broke_down` | Did price ever trade beyond that side before the watch window ended |
| `max_points_above` / `max_points_below` | Furthest price went past the range high / low |

### Changing the settings

Open `config.py`, change a value, save (**Cmd+S**), and run
`python opening_range.py` again. Try:

- `OPENING_RANGE_MINUTES = 30` for a 30-minute opening range
- `WATCH_MINUTES = 60` to only watch the first hour

---

## Using data from TradingView

TradingView often has more history than Yahoo's free 60 days. How much you can
export depends on your TradingView plan. Exporting may need a paid plan.

### Export from TradingView

1. Open a chart in TradingView (the website or the desktop app).
2. In the symbol box (top left), type **`NQ1!`** and pick **NASDAQ 100 E-mini Futures** (CME).
   `NQ1!` always follows the front-month contract.
3. Set the timeframe to **5m** (top toolbar). 5-minute candles match what we use now.
4. Scroll the chart left (or press the left arrow key for a while) to load as much history as it lets you.
   The export only includes candles the chart has loaded.
5. Click the small **down arrow next to your layout name** at the top right of the chart
   (next to the cloud/save icon), then click **Export chart data…**.
6. Leave **Time format** as **ISO time** (UNIX timestamp works too). Click **Export**.
   A `.csv` file lands in your **Downloads** folder.

If you can't find **Export chart data…**, your plan probably doesn't include it. Tell me which plan you have.

### Import it

In the VS Code terminal, type `python import_tradingview.py ` (with a space at the end),
then **drag the CSV file from Finder into the terminal**. It fills in the file's location for you.
Press Return. Then:

```
python opening_range.py
```

> Both `get_data.py` and `import_tradingview.py` save to the same file, `data/nq.csv`.
> Whichever one you ran **last** is the data the research uses.

---

## Limits of the current data

- Yahoo's free data only goes back about **60 days** for 5-minute candles. That's
  fine for learning the tools, but too little to trust a strategy.
- TradingView exports are capped by your plan's bar limit. For several **years**
  of clean 1-minute history, we'll eventually want a dedicated data source.
- Continuous contracts (`NQ=F`, `NQ1!`) jump a little at each quarterly roll.
- These numbers describe what happened. They are **not** a backtest yet: no
  entries, stops, slippage or commissions. That's Stage 5.
