# Library of AWEsome Conductor sample applications
This repository showcases sample applications built using Orkes Conductor, a powerful orchestration engine designed for microservices orchestration. These examples serve as practical guides for developers looking to implement complex workflows. 

## Sample applications
* [Payment processing SAGA with Conductor and Go](https://github.com/conductor-oss/conductor-apps/tree/main/go/saga)
* [How to rate limit workflow executions with Conductor](https://github.com/conductor-oss/conductor-apps/java/rate_limit_application)
* [Workflow example showing various timeout scenarios with Conductor](https://github.com/conductor-oss/conductor-apps/java/timeouts_application)
* [Agentic stock trading app with Conductor and Python](https://github.com/conductor-oss/conductor-apps/python/agentic_trader_app)
* [Agentic security workflow](examples/agentic_security_workflow)
* [Software engineer interview agentic workflow](python/interview_agentic_app)
* [Fraud detection management](javascript/fraud_detection_management)

## Language-specific Worker and Workflow sample projects
* [Clojure](https://github.com/conductor-oss/conductor-apps/clojure)
* [Csharp](https://github.com/conductor-oss/conductor-apps/csharp)
* [Go](https://github.com/conductor-oss/conductor-apps/go) 
* [Java](https://github.com/conductor-oss/conductor-apps/java)
* [JavaScript](https://github.com/conductor-oss/conductor-apps/javascript)
* [Python](https://github.com/conductor-oss/conductor-apps/python)


## Getting started
### Using Orkes Conductor Developer Edition

1. Browse to https://developer.orkescloud.com/
2. On the left menu select **Access Control** > [**Applications**](https://developer.orkescloud.com/applicationManagement/applications)
3. Select `Create a New Application`
4. Give your application a unique name and hit `Save`
5. Set appropriate permissions for the application
  * _Note_: In Orkes Conductor Developer Edition new applications are pre-set with the following permissions:
    * **Unrestricted roles:** Admin
    * **Application roles:** Worker
6. Select `Create access key` button

> :bulb: **IMPORTANT:** Make sure to copy and save your `Key ID` and `Key Secret` somewhere safe. You will not be able to recover these after closing the window

7. Add Orkes Conductor Developer Edition URL and Application access key to your environmental variables.

#### MacOS/Linux
```shell
export CONDUCTOR_SERVER_URL=https://developer.orkescloud.com/api/
export CONDUCTOR_AUTH_KEY=<your api key from step 4 above >
export CONDUCTOR_AUTH_SECRET=<your api secret from step 5 above>
```

#### Windows
```powershell
$env:CONDUCTOR_SERVER_URL = "https://developer.orkescloud.com/api/" 
$env:CONDUCTOR_AUTH_KEY = "<your api key from step 4 above>" 
$env:CONDUCTOR_AUTH_SECRET = "<your api secret from step 5 above>"
```
