# Insurance Claims Workflow

This repository contains a business process automation workflow designed to handle the insurance claims process. It leverages Netflix Conductor to automate and manage the steps in processing a claim, including finding customer policy details, performing policy validations, collecting claims information, and determining the eligibility for coverage.

## Overview

The insurance claims workflow is designed to streamline the claims process by automating decision-making tasks and incorporating human intervention where necessary. The workflow includes tasks that process customer information, validate policies, estimate damage costs, and assign human tasks for claims assessment and investigation.

## Workflow Description

- **Find Customer Policy**: The workflow begins by retrieving a customer's insurance policy based on their first and last name.
- **Map Policies to Menu Items**: Prepares a list of policies to display in a menu for human task processing.
- **Human Tasks**:
  - **Take Claims Information**: A human task where the claimant provides information about the incident.
  - **Assessor Findings**: Another human task where an assessor provides findings from the location of the event.
  - **Investigation Task**: If the damage exceeds certain costs, further human intervention is required for on-site investigation.
- **Policy Validation**: The workflow checks if the policy is valid for the claim, and whether the incident is covered.
- **Damage Estimation**: If the claim is valid, the damage estimation is calculated based on predefined costs for various types of damage.
- **Final Decision**:
  - If the policy covers the damage, the claim progresses to completion.
  - If not, the workflow is terminated, indicating that the policy does not cover the incident.
  - If the damage exceeds a threshold, an investigation is triggered to assess further details.

## Key Tasks and Descriptions

1. **findPolicyForCustomer**: Finds the customer's policy based on their first and last name.
   - **Description**: Retrieves customer policy details for further processing.

2. **map_policies_to_menu_items**: Prepares data for human tasks by mapping policies to menu items.
   - **Description**: Maps available policies into a format suitable for human task assignments.

3. **take_claim_ref**: A human task for the claimant to provide information about the incident.
   - **Description**: This task allows the claimant to fill out a form with the details of their claim.

4. **policy_valid_ref**: Determines if the policy is valid for the claim.
   - **Description**: Checks the validity of the customer's policy based on the provided claim details.

5. **assesor_findings_ref**: An assessor provides findings from the place of the event.
   - **Description**: The assessor fills out a report about the damages and their severity.

6. **determine_price_of_damage_ref**: Calculates the cost of the damage based on assessor findings.
   - **Description**: Estimates the total damage cost based on the assessor’s report and predefined cost mappings.

7. **investigation_human_ref**: A human task for an additional investigation if the damage cost exceeds a threshold.
   - **Description**: Triggered when the estimated damage exceeds a predefined amount, requiring an investigation.

8. **terminate_ref_1 & terminate_ref_2**: Terminate the workflow if the policy does not cover the incident or if it’s been fully processed.
   - **Description**: Marks the end of the workflow either when the claim is denied or when it’s fully processed and the payment is sent.

## Test Data (Pre-filled)

To assist in testing the workflow, you can use the following customer names to simulate different claim scenarios. These names can be used as input parameters in the workflow:

- **John Doe**
- **Jane Smith**
- **Robert Johnson**

### Usage of Test Data
- **Scenario 1**: For **John Doe**, simulate a claim with a basic incident description.
- **Scenario 2**: For **Jane Smith**, test a claim with an incident that may require investigation.
- **Scenario 3**: For **Robert Johnson**, explore a case where the policy might not cover the incident.

By using these names, you can simulate various workflows and test how the system processes different inputs. You can modify the details or parameters as needed to simulate additional scenarios.

## Workflow Logic

1. **Policy Validation**: The workflow first validates the customer's policy based on the provided claim details.
2. **Damage Calculation**: If the policy is valid, the damage is estimated, and the costs are calculated.
3. **Investigation Requirement**: If the damage exceeds a certain cost threshold, an investigation is triggered.
4. **Claim Completion**: If everything is in order, the claim is finalized, and the payment is processed.
5. **Termination**: If the policy is invalid or the incident is not covered, the workflow terminates and the claim is not processed.

## Human Tasks Integration

The workflow integrates human tasks where manual intervention is required, such as:
- Claimant filling out claim forms.
- Assessor reviewing damage reports.
- Investigation triggered for claims that exceed certain damage thresholds.

## Inputs

- **firstName**: The first name of the claimant.
- **lastName**: The last name of the claimant.

## Output

- The workflow does not output data directly, but it transitions between states depending on the claim process, including termination or completion.

## Workflow Failure Handling

- If the claim is determined to be invalid or the incident is not covered by the policy, the workflow will terminate with a failure reason.
- Alerts are set up for timeout conditions.

## Running the Workflow

To run the insurance claims workflow in your Conductor instance, execute the following installation script:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/conductor-oss/awesome-conductor-apps/refs/heads/claims-workflow/typescript/claims-workflow/workers/run.sh"
