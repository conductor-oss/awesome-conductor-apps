# Autonomous Stock Trading Agent with Conductor

An LLM agent that trades stocks in a simulated account, built with [Conductor](https://github.com/conductor-oss/conductor)'s built-in LLM tasks. The market and account are simulated: no real trades are made.

## How it works

The `agentic_stock_trader_autonomous` workflow ([resources/workflow.json](resources/workflow.json)) runs a `DO_WHILE` loop. In each iteration:

1. `update_market` moves the simulated market prices and works out the account's total value, its change since the start, and how it's split between cash and stocks.
2. `decide_trade` (`LLM_CHAT_COMPLETE`) looks at the prices, cash and holdings, and decides to buy, sell or hold, with a one-sentence reason.
3. A `SWITCH` carries out the decision: `buy_stock` or `sell_stock` makes the trade.

The market prices, cash and portfolio are kept in workflow variables, so the workers are stateless and every decision and trade is visible in the Conductor UI. Inside the loop, Conductor also passes the agent's earlier decisions to the LLM as conversation history, so the agent remembers what it has done. The loop ends when the total value is up or down 20%, or after 20 iterations. These limits are enforced by the workflow rather than left to the LLM.

Workers ([worker/workers.py](worker/workers.py)):

* `update_market` moves each stock's price by up to 5% per turn, and returns the account's total value, percentage change and allocation.
* `buy_stock` and `sell_stock` take the current prices, cash and portfolio, and return the updated cash and portfolio. `buy_stock` enforces the trading rules: it rejects any buy that would leave less than 10% of the total value in cash, or put more than 40% of it in one stock. Rejections are reported back to the agent on its next turn.

## Run it locally

Requires Python 3.10+, the [Conductor CLI](https://github.com/conductor-oss/conductor-cli) (which needs Java 21+) and an OpenAI API key. Run every step in the same terminal, from this directory.

1. Start a local Conductor server with OpenAI configured. The server runs in the background. It is started from your home directory because it creates its database files in the current directory:

   ```shell
   export OPENAI_API_KEY=<<YOUR_OPENAI_API_KEY>>
   (cd ~ && conductor server start)
   conductor server status
   ```

2. Install the requirements:

   ```shell
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. Run the agent. This registers the workflow, starts the workers and prints each decision as it happens:

   ```shell
   export CONDUCTOR_SERVER_URL=http://localhost:8080/api
   python3 main.py
   ```

   The agent starts with $5,000 and the instruction `Trade actively to grow the account`. To give it different instructions, pass them as an argument, for example `python3 main.py "Only trade NVDA and TSLA"`. The model defaults to `gpt-5-nano`. Set `OPENAI_DEFAULT_MODEL` to use another one.

   To stop the agent early, press Ctrl+C. This terminates the workflow and stops the workers.

4. When you're done, stop the server:

   ```shell
   conductor server stop
   ```

   If something fails, open the execution link printed by `main.py` or check `conductor server logs`.
