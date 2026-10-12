# Autonomous Stock Trading Agent with Conductor

An LLM agent that trades stocks in a simulated account, built with [Conductor](https://github.com/conductor-oss/conductor)'s built-in LLM tasks. The market and account are simulated: no real trades are made.

## How it works

The `agentic_stock_trader_autonomous` workflow ([resources/workflow.json](resources/workflow.json)) runs a `DO_WHILE` loop. In each iteration:

1. `choose_trade` (`LLM_CHAT_COMPLETE`) turns the current instruction into a trade, as JSON.
2. A `SWITCH` runs the trade: `get_stock_price` looks up the price, then `buy_stock` or `sell_stock` executes it.
3. `decide_next_step` (`LLM_CHAT_COMPLETE`) reviews the account and gives the next instruction, or `STOP`.

The account balance and portfolio are kept in workflow variables, so the workers are stateless and every step of the agent's reasoning and trading is visible in the Conductor UI. The loop ends when the agent says `STOP` or after 20 iterations.

Workers ([worker/workers.py](worker/workers.py)):

* `get_stock_price` returns a simulated price between 100 and 105.
* `buy_stock` and `sell_stock` take the current balance and portfolio and return their updated values.

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

3. Run the agent. This registers the workflow, starts the workers and prints each trade as it happens:

   ```shell
   export CONDUCTOR_SERVER_URL=http://localhost:8080/api
   python3 main.py
   ```

   The agent starts from the instruction `purchase 1 share of google`. To give it another one, pass it as an argument, for example `python3 main.py "buy 5 shares of nvidia"`. The model defaults to `gpt-5-nano`. Set `OPENAI_DEFAULT_MODEL` to use another one.

4. When you're done, stop the server:

   ```shell
   conductor server stop
   ```

   If something fails, open the execution link printed by `main.py` or check `conductor server logs`.
