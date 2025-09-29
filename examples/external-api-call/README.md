# External API Call

This example uses a free API with no credentials to showcase
the HTTP task type for retrieving data, a JSON_JQ task for filtering,
and a SWITCH task to handle successful requests. 

It obtains the ticker values for BTC<->USDT from Binance,
checks the statusCode of the HTTP task, and if it's successful,
returns CSS (hex) color values and a caption for a hypothetical web UI.
