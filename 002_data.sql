-- ===== МИГРАЦИЯ 002: НАЧАЛЬНЫЕ ДАННЫЕ =====
-- Заполняет справочные таблицы категориями, производителями, обозначениями, 
-- маппингами библиотек и стандартными корпусами

-- ===== 1. КАТЕГОРИИ =====
INSERT INTO categories (name, description, designator_prefix, is_active_component, sort_order) VALUES
-- Пассивные
('Resistors', 'Резисторы', 'R', TRUE, 10),
('Capacitors', 'Конденсаторы', 'C', TRUE, 11),
('Inductors', 'Индуктивности', 'L', TRUE, 12),
-- Активные
('Diodes', 'Диоды', 'D', TRUE, 20),
('LEDs', 'Светодиоды', 'LED', TRUE, 21),
('Transistors', 'Транзисторы', 'Q', TRUE, 22),
('ICs', 'Микросхемы', 'U', TRUE, 23),
('Connectors', 'Разъёмы', 'J', TRUE, 24)
ON CONFLICT (name) DO NOTHING;

-- ===== 2. ТАБЛИЦА DESIGNATORS =====
INSERT INTO component_designators (prefix, description, category_id, altium_lib_type, kicad_symbol_prefix, sort_order) VALUES
('R', 'Resistor', (SELECT id FROM categories WHERE designator_prefix = 'R' LIMIT 1), 'Resistors.SchLib', 'R', 1),
('C', 'Capacitor', (SELECT id FROM categories WHERE designator_prefix = 'C' LIMIT 1), 'Capacitors.SchLib', 'C', 2),
('L', 'Inductor', (SELECT id FROM categories WHERE designator_prefix = 'L' LIMIT 1), 'Inductors.SchLib', 'L', 3),
('D', 'Diode', (SELECT id FROM categories WHERE designator_prefix = 'D' LIMIT 1), 'Diodes.SchLib', 'D', 4),
('LED', 'Light Emitting Diode', (SELECT id FROM categories WHERE designator_prefix = 'LED' LIMIT 1), 'LED.SchLib', 'LED', 5),
('Q', 'Transistor', (SELECT id FROM categories WHERE designator_prefix = 'Q' LIMIT 1), 'Transistors.SchLib', 'Q', 6),
('U', 'Integrated Circuit', (SELECT id FROM categories WHERE designator_prefix = 'U' LIMIT 1), 'IC.SchLib', 'Device', 7),
('J', 'Connector', (SELECT id FROM categories WHERE designator_prefix = 'J' LIMIT 1), 'Connectors.SchLib', 'Connector', 8)
ON CONFLICT (prefix) DO NOTHING;

-- ===== 3. МАППИНГ БИБЛИОТЕК (Altium) — SchLib =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Diodes', 'LEDs') THEN 'Diodes.SchLib'
        WHEN name = 'Transistors' THEN 'Transistors.SchLib'
        WHEN name IN ('ICs') THEN 'IC.SchLib'
        WHEN name = 'Resistors' THEN 'Resistors.SchLib'
        WHEN name = 'Capacitors' THEN 'Capacitors.SchLib'
        WHEN name = 'Inductors' THEN 'Inductors.SchLib'
        WHEN name = 'Connectors' THEN 'Connectors.SchLib'
        ELSE 'IC.SchLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 4. МАППИНГ БИБЛИОТЕК (Altium) — PcbLib =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Diodes', 'LEDs') THEN 'Diodes.PcbLib'
        WHEN name = 'Transistors' THEN 'Transistors.PcbLib'
        WHEN name IN ('ICs') THEN 'IC.PcbLib'
        WHEN name = 'Resistors' THEN 'Resistors.PcbLib'
        WHEN name = 'Capacitors' THEN 'Capacitors.PcbLib'
        WHEN name = 'Inductors' THEN 'Inductors.PcbLib'
        WHEN name = 'Connectors' THEN 'Connectors.PcbLib'
        ELSE 'IC.PcbLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 5. МАППИНГ БИБЛИОТЕК (KiCad) =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'kicad',
    CASE 
        WHEN name IN ('Diodes', 'LEDs') THEN 'Diodes'
        WHEN name = 'Transistors' THEN 'Transistors'
        WHEN name IN ('ICs') THEN 'IC'
        WHEN name = 'Resistors' THEN 'Resistors'
        WHEN name = 'Capacitors' THEN 'Capacitors'
        WHEN name = 'Inductors' THEN 'Inductors'
        WHEN name = 'Connectors' THEN 'Connectors'
        ELSE 'Device'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 6. СТАНДАРТНЫЕ КОРПУСЫ =====
-- Резисторы
INSERT INTO packages (name, standard) VALUES
('0201', 'EIA'),
('0402', 'EIA'),
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Конденсаторы
INSERT INTO packages (name, standard) VALUES
('0402', 'EIA'),
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA'),
('1210', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Индуктивности
INSERT INTO packages (name, standard) VALUES
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Диоды/LED
INSERT INTO packages (name, standard) VALUES
('SOD-123', 'JEDEC'),
('SOD-323', 'JEDEC'),
('SOT-23', 'JEDEC'),
('SOT-223', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Транзисторы
INSERT INTO packages (name, standard) VALUES
('SOT-23', 'JEDEC'),
('SOT-89', 'JEDEC'),
('SOT-223', 'JEDEC'),
('TO-92', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Микросхемы
INSERT INTO packages (name, standard) VALUES
('SOIC-8', 'JEDEC'),
('SOIC-14', 'JEDEC'),
('SOIC-16', 'JEDEC'),
('QFN-16', 'JEDEC'),
('QFN-20', 'JEDEC'),
('QFN-24', 'JEDEC'),
('TSSOP-8', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Разъёмы
INSERT INTO packages (name, standard) VALUES
('2.54mm', 'Metric'),
('2.00mm', 'Metric'),
('1.27mm', 'Metric')
ON CONFLICT (name) DO NOTHING;