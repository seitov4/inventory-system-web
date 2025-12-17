import pool from '../src/utils/db.js';
import 'dotenv/config';

async function createDefaultWarehouse() {
    try {
        const result = await pool.query(
            `INSERT INTO warehouses (name, type, address)
             VALUES ($1, $2, $3)
             ON CONFLICT DO NOTHING
             RETURNING id, name`,
            ['Основной склад', 'warehouse', 'Адрес по умолчанию']
        );
        
        if (result.rows.length > 0) {
            console.log('✅ Склад создан:', result.rows[0]);
            console.log(`   ID: ${result.rows[0].id}, Название: ${result.rows[0].name}`);
        } else {
            // Check if warehouse already exists
            const existing = await pool.query(
                `SELECT id, name FROM warehouses WHERE name = $1 LIMIT 1`,
                ['Основной склад']
            );
            if (existing.rows.length > 0) {
                console.log('ℹ️  Склад уже существует:', existing.rows[0]);
            } else {
                console.log('⚠️  Не удалось создать склад');
            }
        }
    } catch (error) {
        console.error('❌ Ошибка при создании склада:', error.message);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

createDefaultWarehouse();

