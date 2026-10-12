import random

from conductor.client.worker.worker_task import worker_task

# The workers are stateless: the account balance and portfolio live in the
# workflow's variables, and each trade returns their updated values.


@worker_task(task_definition_name='get_stock_price')
def get_stock_price(ticker: str) -> float:
    # Simulated market price
    return round(random.uniform(100, 105), 2)


@worker_task(task_definition_name='buy_stock')
def buy_stock(ticker: str, quantity: int, price: float, balance: float, portfolio: dict) -> dict:
    ticker, quantity = ticker.upper(), int(quantity)
    cost = round(price * quantity, 2)
    if quantity < 1 or cost > balance:
        return {'balance': balance, 'portfolio': portfolio,
                'message': f'Could not buy {quantity} {ticker} for {cost} with a balance of {balance}'}
    portfolio = {**portfolio, ticker: portfolio.get(ticker, 0) + quantity}
    return {'balance': round(balance - cost, 2), 'portfolio': portfolio,
            'message': f'Bought {quantity} {ticker} at {price}'}


@worker_task(task_definition_name='sell_stock')
def sell_stock(ticker: str, quantity: int, price: float, balance: float, portfolio: dict) -> dict:
    ticker, quantity = ticker.upper(), int(quantity)
    held = portfolio.get(ticker, 0)
    if quantity < 1 or quantity > held:
        return {'balance': balance, 'portfolio': portfolio,
                'message': f'Could not sell {quantity} {ticker}, holding {held}'}
    portfolio = {**portfolio, ticker: held - quantity}
    if not portfolio[ticker]:
        del portfolio[ticker]
    return {'balance': round(balance + price * quantity, 2), 'portfolio': portfolio,
            'message': f'Sold {quantity} {ticker} at {price}'}
