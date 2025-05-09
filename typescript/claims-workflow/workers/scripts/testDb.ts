import db from '../database/db';

try {
    // Test query
    const result = db.prepare('SELECT 1 as test').get();
    console.log('Database connection test:', result);

    // Show all tables
    const tables = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table'
    `).all();
    console.log('Available tables:', tables);
} catch (error) {
    console.error('Database test failed:', error);
} 