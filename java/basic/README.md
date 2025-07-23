# Java Basic Example

This is a basic example of using the Conductor Java SDK to create a simple workflow with a worker that says hello.

## Prerequisites

- Java 17 or later
- Gradle

## Setup

1. Create a `.env.local` file in the root directory with your Orkes Conductor credentials:

```env
ORKES_API_URL=https://play.orkes.io/api
ORKES_API_KEY_ID=your_key_id
ORKES_API_KEY_SECRET=your_key_secret
```

## Running the Example

1. Build the project:

```bash
./gradlew build
```

2. Run the worker:

```bash
./gradlew run
```

The worker will start and begin polling for tasks of type `sayHello`. You can now run the workflow from the Conductor UI or using the Conductor API.
