import 'dotenv/config';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

let db: Database.Database;

try {
    const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/policies.db');
    
    // Create the directory if it doesn't exist
    const dbDir = path.dirname(DB_PATH);
    if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
        console.log(`Created database directory at ${dbDir}`);
    }
    
    db = new Database(DB_PATH);
    console.log(`Connected to database at ${DB_PATH}`);

    // Create tables if they don't exist
    db.exec(`
        CREATE TABLE IF NOT EXISTS customers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT UNIQUE NOT NULL,
            first_name TEXT NOT NULL,
            last_name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            phone TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS policies (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_id TEXT NOT NULL,
            policy_number TEXT NOT NULL,
            policy_type TEXT NOT NULL,
            status TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        );

        CREATE TABLE IF NOT EXISTS claims (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            claim_number TEXT UNIQUE NOT NULL,
            policy_id INTEGER NOT NULL,
            customer_id TEXT NOT NULL,
            description TEXT NOT NULL,
            status TEXT NOT NULL,
            amount DECIMAL(10,2),
            incident_date DATE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (policy_id) REFERENCES policies(id),
            FOREIGN KEY (customer_id) REFERENCES customers(customer_id)
        );
    `);
} catch (error) {
    console.error('Failed to connect to database:', error);
    throw error;
}

// Ensure the database connection is closed when the application exits
process.on('exit', () => {
    db.close();
});

export default db; 