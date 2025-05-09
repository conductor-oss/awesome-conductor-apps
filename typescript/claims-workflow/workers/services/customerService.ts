import db from '../database/db';

export interface Customer {
    id: number;
    customer_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone?: string;
    created_at: string;
    updated_at: string;
}

export const findCustomerById = (customerId: string): Customer | null => {
    const stmt = db.prepare('SELECT * FROM customers WHERE customer_id = ? LIMIT 1');
    return stmt.get(customerId) as Customer | null;
};

export const createCustomer = (customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer => {
    const stmt = db.prepare(`
        INSERT INTO customers (customer_id, first_name, last_name, email, phone)
        VALUES (@customer_id, @first_name, @last_name, @email, @phone)
    `);
    
    const result = stmt.run(customer);
    return findCustomerById(customer.customer_id)!;
}; 