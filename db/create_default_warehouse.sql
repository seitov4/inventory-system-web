-- Create default warehouse if it doesn't exist
INSERT INTO warehouses (name, type, address)
VALUES ('Основной склад', 'warehouse', 'Адрес по умолчанию')
ON CONFLICT DO NOTHING;

-- Get the created warehouse ID
SELECT id, name FROM warehouses WHERE name = 'Основной склад' LIMIT 1;

