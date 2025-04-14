import { ConductorWorker, Task, TaskResult } from "@io-orkes/conductor-javascript";
import { findPolicyByCustomerName, createClaim } from '../services/policyService';

export const findPolicyForCustomer: ConductorWorker = {
    taskDefName: "findPolicyForCustomer",
    execute: async (task: Task): Promise<Omit<TaskResult, "workflowInstanceId" | "taskId">> => {
        const taskId = task.taskId || '';

        if (!task.inputData?.firstName || !task.inputData?.lastName) {
            return {
                status: 'FAILED',
                outputData: { error: 'First name and last name are required' },
                logs: [{
                    log: 'Missing required first name and last name in input',
                    createdTime: Date.now(),
                    taskId
                }],
            };
        }

        const firstName = task.inputData.firstName as string;
        const lastName = task.inputData.lastName as string;
        const policies = findPolicyByCustomerName(firstName, lastName);

        if (policies.length === 0) {
            return {
                status: 'FAILED',
                outputData: { error: 'Policy not found' },
                logs: [{
                    log: `No policy found for customer ${firstName} ${lastName}`,
                    createdTime: Date.now(),
                    taskId
                }],
            };
        }

        return {
            status: 'COMPLETED',
            outputData: {
                policies
            },
            logs: [{
                log: `Found ${policies.length} policies for customer ${firstName} ${lastName}`,
                createdTime: Date.now(),
                taskId
            }],
        };
    }
};

export const createClaimForPolicy: ConductorWorker = {
    taskDefName: "createClaimForPolicy",
    execute: async (task: Task): Promise<Omit<TaskResult, "workflowInstanceId" | "taskId">> => {
        const taskId = task.taskId || '';

        if (!task.inputData?.policyId || !task.inputData?.description) {
            return {
                status: 'FAILED',
                outputData: { error: 'Policy ID and description are required' },
                logs: [{
                    log: 'Missing required policy ID and description in input',
                    createdTime: Date.now(),
                    taskId
                }],
            };
        }

        const policyId = task.inputData.policyId as string;
        const description = task.inputData.description as string;

        const claim = createClaim(policyId, description);

        return {
            status: 'COMPLETED',
            outputData: { claim },
            logs: [{
                log: `Claim created for policy ${policyId}`,
                createdTime: Date.now(),
                taskId
            }],
        };
    }
};
