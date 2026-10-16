import random

from conductor.client.worker.worker_task import worker_task

# The workers are stateless: market prices, the account balance and the
# portfolio live in the workflow's variables, and each task returns their
# updated values.

STARTING_PRICES = {'AAPL': 230.0, 'AMZN': 190.0, 'GOOGL': 170.0, 'MSFT': 420.0, 'NVDA': 120.0, 'TSLA': 250.0}

# Trading rules, as fractions of the account's total value
MIN_CASH = 0.10
MAX_POSITION = 0.40


@worker_task(task_definition_name='update_market')
def update_market(prices: dict, portfolio: dict, balance: float, starting_balance: float) -> dict:
    # Simulated market: each price moves by up to 5% per turn
    prices = {ticker: round(price * random.uniform(0.95, 1.05), 2)
              for ticker, price in (prices or STARTING_PRICES).items()}
    total_value = round(balance + sum(quantity * prices[ticker] for ticker, quantity in portfolio.items()), 2)
    change_percent = round((total_value / starting_balance - 1) * 100, 1)
    allocation = {ticker: round(quantity * prices[ticker] / total_value * 100, 1) for ticker, quantity in portfolio.items()}
    allocation['cash'] = round(balance / total_value * 100, 1)
    return {'prices': prices, 'total_value': total_value, 'change_percent': change_percent, 'allocation': allocation}


@worker_task(task_definition_name='buy_stock')
def buy_stock(ticker: str, quantity: int, prices: dict, balance: float, portfolio: dict) -> dict:
    ticker, quantity = (ticker or '').upper(), int(quantity or 0)
    if ticker not in prices or quantity < 1:
        return {'balance': balance, 'portfolio': portfolio, 'message': f'Could not buy {quantity} {ticker}'}
    price = prices[ticker]
    cost = round(price * quantity, 2)
    total_value = balance + sum(held * prices[held_ticker] for held_ticker, held in portfolio.items())
    if balance - cost < MIN_CASH * total_value:
        return {'balance': balance, 'portfolio': portfolio,
                'message': f'Could not buy {quantity} {ticker} for {cost}: it would leave less than '
                           f'{MIN_CASH:.0%} of the total value in cash'}
    if (portfolio.get(ticker, 0) + quantity) * price > MAX_POSITION * total_value:
        return {'balance': balance, 'portfolio': portfolio,
                'message': f'Could not buy {quantity} {ticker}: it would put more than '
                           f'{MAX_POSITION:.0%} of the total value in {ticker}'}
    portfolio = {**portfolio, ticker: portfolio.get(ticker, 0) + quantity}
    return {'balance': round(balance - cost, 2), 'portfolio': portfolio,
            'message': f'Bought {quantity} {ticker} at {price}'}


@worker_task(task_definition_name='sell_stock')
def sell_stock(ticker: str, quantity: int, prices: dict, balance: float, portfolio: dict) -> dict:
    ticker, quantity = (ticker or '').upper(), int(quantity or 0)
    held = portfolio.get(ticker, 0)
    if ticker not in prices or quantity < 1 or quantity > held:
        return {'balance': balance, 'portfolio': portfolio,
                'message': f'Could not sell {quantity} {ticker}, holding {held}'}
    price = prices[ticker]
    portfolio = {**portfolio, ticker: held - quantity}
    if not portfolio[ticker]:
        del portfolio[ticker]
    return {'balance': round(balance + price * quantity, 2), 'portfolio': portfolio,
            'message': f'Sold {quantity} {ticker} at {price}'}
