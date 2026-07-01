# JavaScript Worker Sample

This project contains a sample `myTask` worker for Orkes Conductor.

## Prerequisites

- Node.js 18 or above
- An Orkes Conductor cluster with a `myTask` task definition created

## Setup

1. Set your environment variables:

```shell
export CONDUCTOR_SERVER_URL=https://your-cluster.orkesconductor.io/api
export CONDUCTOR_AUTH_KEY=<YOUR-KEY-ID>
export CONDUCTOR_AUTH_SECRET=<YOUR-KEY-SECRET>
```

1. Install dependencies and start the worker:

```shell
npm install
node worker.js
```

The worker will start polling for `myTask` tasks.
