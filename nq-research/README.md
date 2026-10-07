# NQ Research Platform

A step-by-step project for researching NQ futures setups around the New York open.

## The roadmap

We build one stage at a time. Each stage gets finished before the next one starts.

| Stage | What you get | Status |
|---|---|---|
| 1. Data | Download NQ candles and save them to a file | **Done** (`get_data.py`) |
| 2. First study | Opening range stats for every day | **Done** (`opening_range.py`) |
| 3. Better data | Years of 1-minute NQ history instead of 60 days | Next |
| 4. Setup detection | Write your own setups as rules the computer can check | |
| 5. Backtesting | Simulate entries, stops, targets and costs on past days | |
| 6. Trade scoring | Grade each setup on win rate, expectancy and drawdown | |
| 7. Charts and dashboard | See setups and results visually | |
| 8. Paper trading | Run live on a simulated account | |
| 9. Automation (optional) | Send orders to a broker, with safety limits | |

---

## One-time setup (about 20 minutes)

You only do this once per computer.

### 1. Install Python

Python is the programming language. It runs our scripts.

**Windows**
1. Go to https://www.python.org/downloads/
2. Click the big yellow **Download Python 3.x** button.
3. Open the file you downloaded.
4. **Important:** on the first screen, tick the box **"Add python.exe to PATH"** at the bottom.
   If you skip this, nothing below will work.
5. Click **Install Now**, then **Close** when it's done.

**Mac**
1. Go to https://www.python.org/downloads/
2. Click **Download Python 3.x**, open the `.pkg` file, and click **Continue** through each screen.

### 2. Install VS Code

VS Code is the program you'll use to read and edit the code, and to run it.

1. Go to https://code.visualstudio.com/ and click **Download**.
2. Install it with the default options.
3. Open VS Code. Click the **Extensions** icon on the left side (four small squares).
4. Search for **Python**, then click **Install** on the one made by **Microsoft**.

### 3. Get this project onto your computer

1. Open https://github.com/clydesani76/shftd in your browser.
2. Click the branch dropdown (it says `main`) and pick `claude/gallant-hypatia-bxfvnk`.
   (Skip this once the work is merged into `main`.)
3. Click the green **Code** button, then **Download ZIP**.
4. Unzip it. Inside, find the `nq-research` folder.
   Move it somewhere easy, for example `Documents/nq-research`.

### 4. Open the project in VS Code

1. In VS Code, click **File → Open Folder...** and choose your `nq-research` folder.
2. If VS Code asks "Do you trust the authors?", click **Yes, I trust the authors**.
3. Open the **terminal**: click **Terminal → New Terminal** in the top menu.
   A panel opens at the bottom. This is where you type commands.
   Every command below gets typed there, followed by the **Enter** key.

### 5. Create a "virtual environment"

A virtual environment is a private box for this project's toolkits, so they
never clash with anything else on your computer.

**Windows**, type:
```
python -m venv .venv
.venv\Scripts\activate
```

**Mac**, type:
```
python3 -m venv .venv
source .venv/bin/activate
```

It worked if the start of the terminal line now shows `(.venv)`.

> If Windows shows a red error mentioning "running scripts is disabled", type
> `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`, press Enter, type `Y`,
> press Enter, then try `.venv\Scripts\activate` again.

> **Every time** you reopen VS Code, run the `activate` line again (just the second line).

### 6. Install the toolkits

```
pip install -r requirements.txt
```

You'll see a lot of text scroll by. Wait until the line with `(.venv)` comes back.

---

## Running the research

### Step 1: download data
```
python get_data.py
```
(On Mac, if `python` isn't found, use `python3` instead.)

You should see something like `Saved 13,450 candles to data/nq.csv`.
A new `data` folder appears in VS Code's file list on the left.

### Step 2: study the opening range
```
python opening_range.py
```

You get a table with one row per day, then a summary. The same table is saved
to `results/opening_range.csv`, which you can open in Excel.

What the columns mean:

| Column | Meaning |
|---|---|
| `range_high` / `range_low` | Highest and lowest price during the opening range |
| `range_size` | High minus low, in NQ points |
| `first_break` | Which side price broke first after the range: `up`, `down`, `none`, or `same candle` |
| `broke_up` / `broke_down` | Did price ever trade beyond that side before the watch window ended |
| `max_points_above` / `max_points_below` | Furthest price went past the range high / low |

### Changing the settings

Open `config.py`, change a value, save (**Ctrl+S** / **Cmd+S**), and run
`python opening_range.py` again. Try:

- `OPEN_TIME = "08:30"` to study the 8:30 economic-data release instead of the 9:30 cash open
- `OPENING_RANGE_MINUTES = 30` for a 30-minute opening range
- `WATCH_MINUTES = 60` to only watch the first hour

---

## Limits of the current data

- Yahoo's free data only goes back about **60 days** for 5-minute candles. That's
  fine for learning the tools, but too little to trust a strategy. Stage 3 fixes this.
- `NQ=F` always follows the front-month contract, so prices jump a little at each
  quarterly roll.
- These numbers describe what happened. They are **not** a backtest yet: no
  entries, stops, slippage or commissions. That's Stage 5.
