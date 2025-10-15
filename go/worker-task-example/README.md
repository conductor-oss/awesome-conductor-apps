# Basic Conductor Template in Go

This is a minimal example of a Conductor workflow using Go. It demonstrates a simple workflow with a single task that says hello to a user.

## Structure

```
.
├── worker/         # Worker implementation
├── workflow/       # Workflow definition
└── app/           # Main application
```

## Prerequisites

- Go 1.16 or later
- Access to a Conductor server

## Setup

1. Set your Conductor server URL and credentials as environment variables:

```bash
export CONDUCTOR_SERVER_URL=http://localhost:8080/api
export CONDUCTOR_AUTH_KEY=your_key
export CONDUCTOR_AUTH_SECRET=your_secret
```

2. Install dependencies:

```bash
go mod download
```

3. Run the worker:

```bash
go run app/main.go
```

## Workflow Description

The workflow consists of a single task that takes a person's first and last name as input and returns a greeting message.

### Input Parameters

- `firstName`: First name of the person
- `lastName`: Last name of the person

### Output

- A greeting message in the format: "Hello, {firstName} {lastName}"
