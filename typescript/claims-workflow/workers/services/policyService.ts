import db from '../database/db';
import { Customer } from './customerService';

export interface Policy {
    id: number;
    customer_id: string;
    policy_number: string;
    policy_type: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface PolicyWithCustomer extends Policy {
    customer: Customer;
}

interface PolicyCustomerQueryResult {
    id: number;
    customer_id: string;
    policy_number: string;
    policy_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    customer_created_at: string;
    customer_updated_at: string;
}

export const findPolicyByCustomerId = (customerId: string): Policy | null => {
    const stmt = db.prepare('SELECT * FROM policies WHERE customer_id = ? LIMIT 1');
    return stmt.get(customerId) as Policy | null;
};

export const findPolicyWithCustomer = (customerId: string): PolicyWithCustomer | null => {
    const stmt = db.prepare(`
        SELECT 
            p.*,
            c.id as customer_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            c.created_at as customer_created_at,
            c.updated_at as customer_updated_at
        FROM policies p
        JOIN customers c ON p.customer_id = c.customer_id
        WHERE p.customer_id = ?
        LIMIT 1
    `);
    
    const result = stmt.get(customerId) as PolicyCustomerQueryResult;
    if (!result) return null;

    const { 
        customer_id, first_name, last_name, email, phone,
        customer_created_at, customer_updated_at,
        ...policy
    } = result;

    return {
        ...policy,
        customer_id,
        customer: {
            id: parseInt(customer_id),
            customer_id,
            first_name,
            last_name,
            email,
            phone: phone || undefined,
            created_at: customer_created_at,
            updated_at: customer_updated_at
        }
    };
};

export const createPolicy = (policy: Omit<Policy, 'id' | 'created_at' | 'updated_at'>): Policy => {
    const stmt = db.prepare(`
        INSERT INTO policies (customer_id, policy_number, policy_type, status)
        VALUES (@customer_id, @policy_number, @policy_type, @status)
    `);
    
    stmt.run(policy);
    return findPolicyByCustomerId(policy.customer_id)!;
};

export const createCustomer = (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>) => {
    const stmt = db.prepare(`
        INSERT INTO customers (customer_id, first_name, last_name, email, phone)
        VALUES (@customer_id, @first_name, @last_name, @email, @phone)
    `);
    stmt.run(customer);
};

export const createFakeCustomerPolicies = () => {
    const fakeCustomers = [
        {
            customer_id: 'CUST001',
            first_name: 'John',
            last_name: 'Doe',
            email: 'john.doe@example.com',
            phone: '555-0101'
        },
        {
            customer_id: 'CUST002',
            first_name: 'Jane',
            last_name: 'Smith',
            email: 'jane.smith@example.com',
            phone: '555-0102'
        },
        {
            customer_id: 'CUST003',
            first_name: 'Robert',
            last_name: 'Johnson',
            email: 'robert.j@example.com',
            phone: '555-0103'
        }
    ];

    const fakePolicies = [
        {
            customer_id: 'CUST001',
            policy_number: 'POL-001-2024',
            policy_type: 'HOME',
            status: 'ACTIVE'
        },
        {
            customer_id: 'CUST001',
            policy_number: 'POL-002-2024',
            policy_type: 'AUTO',
            status: 'ACTIVE'
        },
        {
            customer_id: 'CUST002',
            policy_number: 'POL-003-2024',
            policy_type: 'LIFE',
            status: 'PENDING'
        },
        {
            customer_id: 'CUST003',
            policy_number: 'POL-004-2024',
            policy_type: 'HOME',
            status: 'ACTIVE'
        }
    ];

    const fakeClaims = [
        {
            claim_number: 'CLM-001-2024',
            policy_id: 1, // Will link to first policy
            customer_id: 'CUST001',
            description: 'Water damage from burst pipe',
            status: 'PENDING',
            amount: 5000.00,
            incident_date: '2024-03-15'
        },
        {
            claim_number: 'CLM-002-2024',
            policy_id: 2, // Will link to second policy
            customer_id: 'CUST001',
            description: 'Car accident - front bumper damage',
            status: 'APPROVED',
            amount: 2500.00,
            incident_date: '2024-03-10'
        },
        {
            claim_number: 'CLM-003-2024',
            policy_id: 4, // Will link to fourth policy
            customer_id: 'CUST003',
            description: 'Storm damage to roof',
            status: 'IN_REVIEW',
            amount: 7500.00,
            incident_date: '2024-03-01'
        }
    ];

    try {
        // Insert customers
        const customerStmt = db.prepare(`
            INSERT INTO customers (customer_id, first_name, last_name, email, phone)
            VALUES (@customer_id, @first_name, @last_name, @email, @phone)
        `);

        // Insert policies
        const policyStmt = db.prepare(`
            INSERT INTO policies (customer_id, policy_number, policy_type, status)
            VALUES (@customer_id, @policy_number, @policy_type, @status)
        `);

        // Insert claims
        const claimStmt = db.prepare(`
            INSERT INTO claims (claim_number, policy_id, customer_id, description, status, amount, incident_date)
            VALUES (@claim_number, @policy_id, @customer_id, @description, @status, @amount, @incident_date)
        `);

        // Use transaction to ensure all inserts succeed or none do
        const insertAll = db.transaction(() => {
            fakeCustomers.forEach(customer => customerStmt.run(customer));
            fakePolicies.forEach(policy => policyStmt.run(policy));
            fakeClaims.forEach(claim => claimStmt.run(claim));
        });

        insertAll();
        
        console.log('Successfully inserted fake data');
        return {
            customersInserted: fakeCustomers.length,
            policiesInserted: fakePolicies.length,
            claimsInserted: fakeClaims.length
        };
    } catch (error) {
        console.error('Error inserting fake data:', error);
        throw error;
    }
};

export const findPolicyByCustomerName = (firstName: string, lastName: string): PolicyWithCustomer[] => {
    const stmt = db.prepare(`
        SELECT 
            p.*,
            c.id as customer_id,
            c.first_name,
            c.last_name,
            c.email,
            c.phone,
            c.created_at as customer_created_at,
            c.updated_at as customer_updated_at
        FROM policies p
        JOIN customers c ON p.customer_id = c.customer_id
        WHERE c.first_name LIKE ? 
        AND c.last_name LIKE ?
    `);
    
    const results = stmt.all(firstName, lastName) as PolicyCustomerQueryResult[];
    
    return results.map(result => {
        const { 
            customer_id, first_name, last_name, email, phone,
            customer_created_at, customer_updated_at,
            ...policy
        } = result;

        return {
            ...policy,
            customer_id,
            customer: {
                id: parseInt(customer_id),
                customer_id,
                first_name,
                last_name,
                email,
                phone: phone || undefined,
                created_at: customer_created_at,
                updated_at: customer_updated_at
            }
        };
    });
};

export interface Claim {
    id: number;
    claim_number: string;
    policy_id: number;
    customer_id: string;
    description: string;
    status: string;
    amount: number | null;
    incident_date: string | null;
    created_at: string;
    updated_at: string;
}

export const createClaim = (policyId: string, description: string): Claim => {
    // First, verify the policy exists and get customer_id
    const policyStmt = db.prepare<string, { customer_id: string, id: number }>('SELECT customer_id,id FROM policies WHERE policy_number = ?');
    const policy = policyStmt.get(policyId);
    
    if (!policy) {
        throw new Error(`Policy with ID ${policyId} not found`);
    }

    // Generate a unique claim number (using timestamp for uniqueness)
    const claimNumber = `CLM-${Date.now()}-${policyId}`;

    const stmt = db.prepare(`
        INSERT INTO claims (
            claim_number,
            policy_id,
            customer_id,
            description,
            status
        ) VALUES (
            @claim_number,
            @policy_id,
            @customer_id,
            @description,
            @status
        )
    `);

    const result = stmt.run({
        claim_number: claimNumber,
        policy_id: policy.id,
        customer_id: policy.customer_id,
        description,
        status: 'PENDING'
    });

    // Fetch and return the created claim
    const claimStmt = db.prepare('SELECT * FROM claims WHERE id = ?');
    return claimStmt.get(result.lastInsertRowid) as Claim;
};

// Usage example:
try {
    const result = createFakeCustomerPolicies();
    console.log(`Inserted ${result.customersInserted} customers and ${result.policiesInserted} policies`);
} catch (error) {
    console.log('Failed to insert fake data:', error);
} 