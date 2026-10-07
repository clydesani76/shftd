# ---------------------------------------------------------------
# config.py  -  YOUR SETTINGS, ALL IN ONE PLACE
#
# Every other script reads its settings from this file.
# To change how the research works, change a value here,
# save the file, and run the script again.
# ---------------------------------------------------------------

# Which market to study. "NQ=F" is Yahoo Finance's name for
# the front-month Nasdaq-100 E-mini futures contract.
SYMBOL = "NQ=F"

# Size of each candle. "5m" = 5-minute candles.
# Yahoo only keeps about 60 days of 5-minute history (free limit).
CANDLE_SIZE = "5m"
HISTORY = "60d"

# All times below are New York time.
TIMEZONE = "America/New_York"

# The moment you treat as "the open".
#   "08:30" = 8:30 AM New York  (economic data releases: CPI, jobs report...)
#   "09:30" = 9:30 AM New York  (stock market cash open = 8:30 AM Chicago)
OPEN_TIME = "09:30"

# How many minutes after the open make up the "opening range".
OPENING_RANGE_MINUTES = 15

# How long after the open we keep watching price (in minutes).
WATCH_MINUTES = 120
