# Basic C# Conductor Example

This is a basic example demonstrating how to create a simple Conductor workflow and worker using C#.

## Prerequisites

- .NET 8.0 SDK or later
- An Orkes Conductor account (you can sign up for a free Developer Edition account at https://developer.orkescloud.com)

## Project Structure

- `worker/Worker.cs`: Contains the worker implementation for the `sayHello` task
- `workflow/basic.workflow.json`: Contains the workflow definition
- `basic.csproj`: The C# project file with required dependencies
- `basic.sln`: The solution file for Visual Studio

## Setup

1. Open the `worker/Worker.cs` file and update the configuration with your Orkes Conductor credentials:

   ```csharp
   var conf = new Configuration
   {
       BasePath = "https://developer.orkescloud.com/api",
       AuthenticationSettings = new OrkesAuthenticationSettings("YOUR_KEY", "YOUR_SECRET")
   };
   ```

2. Build the project:

   ```bash
   dotnet build
   ```

3. Run the worker:
   ```bash
   dotnet run
   ```

## Workflow Details

The workflow consists of a single task called `sayHello` that takes two input parameters:

- `firstName`: The first name of the person to greet
- `lastName`: The last name of the person to greet

The task returns a greeting message in the format: "Hello, {firstName} {lastName}"

## Testing the Workflow

1. First, ensure the worker is running by executing `dotnet run`
2. Use the Orkes Conductor UI or API to start a workflow execution with the following input:
   ```json
   {
     "firstName": "John",
     "lastName": "Doe"
   }
   ```
3. The workflow will execute the `sayHello` task and return the greeting message.
