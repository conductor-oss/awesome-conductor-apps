# Shipping Vendor Workflow

## Overview

This workflow automates the process of matching shipping vendors to customer orders based on origin, destination, container requirements, and priority. It calculates vendor eligibility, delivery time, price, and an optimality score to recommend the best options. The final output includes a booking confirmation and a generated PDF invoice.

## Goal

To create a reusable shipping vendor workflow template for the Orkes Launch Pad that demonstrates realistic vendor matching, optimality scoring, and PDF confirmation generation.


## Required Inputs

* **SKU** (string) – Product stock keeping unit identifier
* **Units** (number) – Quantity of items to ship
* **Origin Port** (string) – Starting port name
* **Destination Port** (string) – Destination port name
* **Total Volume** (number) – Cargo volume in cubic feet
* **Priority** (string) – Shipping priority scale of 1-3



## Workflow Outputs

* **Matched Vendors** – Array of vendors with container size, type, price, delivery time, and optimality score
* **Booking Summary** – Details of the booked shipment (vendor, container, route, timestamps)
* **PDF Invoice** – Generated PDF file containing order and booking details
* **Audit Log** – Step-by-step confirmation messages with UTC timestamps



## Optimality Formula

```
optimalScore = (0.7 * price) + (0.3 * deliveryTime)
```

* **Price** – Weighted at 70% of the score
* **Delivery Time** – Weighted at 30% of the score
* Lower scores indicate more optimal vendor options.


## Viable Input Values

### SKU Options

* BARBIE-DOLL-001
* HOT-WHEELS-TRACK-002
* LEGO-SET-003
* ACTION-FIGURE-004

### Origin Ports

* Shanghai
* Shenzhen
* Tokyo
* Busan
* Hong Kong
* Kaohsiung
* Manila
* Singapore
* Ningbo
* Qingdao
* Ho Chi Minh City
* Jakarta

### Destination Ports

* Los Angeles
* Long Beach
* Oakland
* Kaohsiung
* Ningbo


