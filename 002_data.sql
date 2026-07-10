-- ===== МИГРАЦИЯ 002: НАЧАЛЬНЫЕ ДАННЫЕ =====
-- Заполняет справочные таблицы категориями, производителями, обозначениями, 
-- маппингами библиотек и стандартными корпусами

-- ===== 1. КОРНЕВЫЕ КАТЕГОРИИ =====
INSERT INTO categories (name, parent_id, description, designator_prefix, is_active_component, sort_order) VALUES
('Active Components', NULL, 'Активные компоненты', NULL, TRUE, 1),
('Passive Components', NULL, 'Пассивные компоненты', NULL, FALSE, 2)
ON CONFLICT (name) DO NOTHING;

-- ===== 2. АКТИВНЫЕ КОМПОНЕНТЫ =====
INSERT INTO categories (name, parent_id, description, designator_prefix, is_active_component, sort_order) VALUES
('Diodes', 1, 'Диоды', 'D', TRUE, 10),
('Transistors', 1, 'Транзисторы', 'Q', TRUE, 11),
('Thyristors', 1, 'Тиристоры и симисторы', 'TH', TRUE, 12),
('Generators', 1, 'Генераторы и осцилляторы', 'X', TRUE, 20),
('Crystals', 1, 'Кварцевые резонаторы', 'Y', TRUE, 21),
('LEDs', 1, 'Светодиоды', 'LED', TRUE, 30),
('Optocouplers', 1, 'Оптопары', 'U', TRUE, 31),
('Displays', 1, 'Дисплеи и индикаторы', 'DS', TRUE, 32),
('Logic', 1, 'Логические микросхемы', 'U', TRUE, 40),
('Memory', 1, 'Микросхемы памяти', 'U', TRUE, 41),
('Microcontrollers', 1, 'Микроконтроллеры', 'U', TRUE, 42),
('FPGA', 1, 'ПЛИС', 'U', TRUE, 43),
('Linear', 1, 'Линейные микросхемы', 'U', TRUE, 50),
('Power_Management', 1, 'Микросхемы управления питанием', 'U', TRUE, 51),
('Data_Converters', 1, 'АЦП/ЦАП', 'U', TRUE, 52),
('IC_General', 1, 'Прочие интегральные схемы', 'U', TRUE, 60)
ON CONFLICT (name) DO NOTHING;

-- ===== 3. ПАССИВНЫЕ КОМПОНЕНТЫ =====
INSERT INTO categories (name, parent_id, description, designator_prefix, is_active_component, sort_order) VALUES
('Resistors', 2, 'Резисторы', 'R', FALSE, 10),
('Capacitors', 2, 'Конденсаторы', 'C', FALSE, 11),
('Inductors', 2, 'Катушки индуктивности и дроссели', 'L', FALSE, 12),
('Transformers', 2, 'Трансформаторы', 'T', FALSE, 13),
('Ferrites', 2, 'Ферриты и фильтры', 'FB', FALSE, 14),
('Crystals_Passive', 2, 'Пассивные кварцевые резонаторы', 'Y', FALSE, 15)
ON CONFLICT (name) DO NOTHING;

-- ===== 4. МЕХАНИЧЕСКИЕ И ДРУГИЕ =====
INSERT INTO categories (name, parent_id, description, designator_prefix, is_active_component, sort_order) VALUES
('Connectors', NULL, 'Разъемы и соединители', 'J', FALSE, 100),
('Switches', NULL, 'Переключатели и кнопки', 'S', FALSE, 101),
('Relays', NULL, 'Реле', 'K', FALSE, 102),
('Fuses', NULL, 'Предохранители', 'F', FALSE, 103),
('Mechanical', NULL, 'Механические компоненты', 'MH', FALSE, 104)
ON CONFLICT (name) DO NOTHING;

-- ===== 5. ТАБЛИЦА DESIGNATORS =====
INSERT INTO component_designators (prefix, description, category_id, altium_lib_type, kicad_symbol_prefix, sort_order) VALUES
('R', 'Resistor', (SELECT id FROM categories WHERE designator_prefix = 'R' LIMIT 1), 'Resistors.SchLib', 'R', 1),
('C', 'Capacitor', (SELECT id FROM categories WHERE designator_prefix = 'C' LIMIT 1), 'Capacitors.SchLib', 'C', 2),
('L', 'Inductor', (SELECT id FROM categories WHERE designator_prefix = 'L' LIMIT 1), 'Inductors.SchLib', 'L', 3),
('D', 'Diode', (SELECT id FROM categories WHERE designator_prefix = 'D' LIMIT 1), 'Diodes.SchLib', 'D', 4),
('LED', 'Light Emitting Diode', (SELECT id FROM categories WHERE designator_prefix = 'LED' LIMIT 1), 'LED.SchLib', 'LED', 5),
('Q', 'Transistor', (SELECT id FROM categories WHERE designator_prefix = 'Q' LIMIT 1), 'Transistors.SchLib', 'Q', 6),
('U', 'Integrated Circuit', (SELECT id FROM categories WHERE designator_prefix = 'U' LIMIT 1), 'IC.SchLib', 'Device', 7),
('J', 'Connector', (SELECT id FROM categories WHERE designator_prefix = 'J' LIMIT 1), 'Connectors.SchLib', 'Connector', 8),
('K', 'Relay', (SELECT id FROM categories WHERE designator_prefix = 'K' LIMIT 1), 'Relays.SchLib', 'Relay', 9),
('S', 'Switch', (SELECT id FROM categories WHERE designator_prefix = 'S' LIMIT 1), 'Switches.SchLib', 'Switch', 10),
('F', 'Fuse', (SELECT id FROM categories WHERE designator_prefix = 'F' LIMIT 1), 'Fuses.SchLib', 'Device:Fuse', 11),
('T', 'Transformer', (SELECT id FROM categories WHERE designator_prefix = 'T' LIMIT 1), 'Transformers.SchLib', 'Transformer', 12),
('Y', 'Crystal/Resonator', (SELECT id FROM categories WHERE designator_prefix = 'Y' LIMIT 1), 'Generators.SchLib', 'Crystal', 13),
('X', 'Oscillator', (SELECT id FROM categories WHERE designator_prefix = 'X' LIMIT 1), 'Generators.SchLib', 'Oscillator', 14),
('FB', 'Ferrite Bead', (SELECT id FROM categories WHERE designator_prefix = 'FB' LIMIT 1), 'Inductors.SchLib', 'Device:FerriteBead', 15),
('TH', 'Thyristor', (SELECT id FROM categories WHERE designator_prefix = 'TH' LIMIT 1), 'Diodes.SchLib', 'Thyristor', 16),
('DS', 'Display', (SELECT id FROM categories WHERE designator_prefix = 'DS' LIMIT 1), 'Indicators.SchLib', 'Display', 17),
('MH', 'Mounting Hole', (SELECT id FROM categories WHERE designator_prefix = 'MH' LIMIT 1), NULL, 'Mechanical', 18)
ON CONFLICT (prefix) DO NOTHING;

-- ===== 6. МАППИНГ БИБЛИОТЕК (Altium) — SchLib =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Diodes', 'Thyristors') THEN 'Diodes.SchLib'
        WHEN name = 'Transistors' THEN 'Transistors.SchLib'
        WHEN name IN ('Generators', 'Crystals', 'Crystals_Passive') THEN 'Generators.SchLib'
        WHEN name = 'LEDs' THEN 'LED.SchLib'
        WHEN name = 'Optocouplers' THEN 'Optocoupler.SchLib'
        WHEN name = 'Displays' THEN 'Indicators.SchLib'
        WHEN name = 'Logic' THEN 'Logic.SchLib'
        WHEN name = 'Linear' THEN 'Linear.SchLib'
        WHEN name IN ('Memory', 'Microcontrollers', 'FPGA', 'Power_Management', 'Data_Converters', 'IC_General') THEN 'IC.SchLib'
        WHEN name = 'Resistors' THEN 'Resistors.SchLib'
        WHEN name = 'Capacitors' THEN 'Capacitors.SchLib'
        WHEN name IN ('Inductors', 'Ferrites') THEN 'Inductors.SchLib'
        WHEN name = 'Transformers' THEN 'Transformers.SchLib'
        WHEN name = 'Connectors' THEN 'Connectors.SchLib'
        WHEN name = 'Switches' THEN 'Switches.SchLib'
        WHEN name = 'Relays' THEN 'Relays.SchLib'
        WHEN name = 'Fuses' THEN 'Fuses.SchLib'
        ELSE 'IC.SchLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL AND name != 'Mechanical'
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 7. МАППИНГ БИБЛИОТЕК (Altium) — PcbLib =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Diodes', 'Thyristors') THEN 'Diodes.PcbLib'
        WHEN name = 'Transistors' THEN 'Transistors.PcbLib'
        WHEN name IN ('Generators', 'Crystals', 'Crystals_Passive') THEN 'Generators.PcbLib'
        WHEN name = 'LEDs' THEN 'LED.PcbLib'
        WHEN name = 'Optocouplers' THEN 'Optocoupler.PcbLib'
        WHEN name = 'Displays' THEN 'Indicators.PcbLib'
        WHEN name = 'Logic' THEN 'Logic.PcbLib'
        WHEN name = 'Linear' THEN 'Linear.PcbLib'
        WHEN name IN ('Memory', 'Microcontrollers', 'FPGA', 'Power_Management', 'Data_Converters', 'IC_General') THEN 'IC.PcbLib'
        WHEN name = 'Resistors' THEN 'Resistors.PcbLib'
        WHEN name = 'Capacitors' THEN 'Capacitors.PcbLib'
        WHEN name IN ('Inductors', 'Ferrites') THEN 'Inductors.PcbLib'
        WHEN name = 'Transformers' THEN 'Transformers.PcbLib'
        WHEN name = 'Connectors' THEN 'Connectors.PcbLib'
        WHEN name = 'Switches' THEN 'Switches.PcbLib'
        WHEN name = 'Relays' THEN 'Relays.PcbLib'
        WHEN name = 'Fuses' THEN 'Fuses.PcbLib'
        ELSE 'IC.PcbLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL AND name != 'Mechanical'
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 8. МАППИНГ БИБЛИОТЕК (KiCad) =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'kicad',
    CASE 
        WHEN name IN ('Resistors', 'Capacitors', 'Inductors', 'Ferrites') THEN 'Device'
        WHEN name IN ('Diodes', 'Thyristors') THEN 'Diode'
        WHEN name = 'Transistors' THEN 'Transistor_FET'
        WHEN name = 'LEDs' THEN 'LED'
        WHEN name = 'Connectors' THEN 'Connector'
        WHEN name IN ('Generators', 'Crystals', 'Crystals_Passive') THEN 'Oscillator'
        WHEN name = 'Optocouplers' THEN 'Isolator'
        WHEN name = 'Fuses' THEN 'Device'
        WHEN name = 'Switches' THEN 'Switch'
        WHEN name = 'Relays' THEN 'Relay'
        WHEN name = 'Transformers' THEN 'Transformer'
        ELSE 'Device'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 9. СТАНДАРТНЫЕ КОРПУСЫ =====
INSERT INTO packages (name, standard) VALUES
-- SMD резисторы/конденсаторы (EIA)
('0201', 'EIA'), ('0402', 'EIA'), ('0603', 'EIA'), ('0805', 'EIA'), ('1206', 'EIA'),
('1210', 'EIA'), ('1812', 'EIA'), ('2010', 'EIA'), ('2512', 'EIA'),
-- SMD транзисторы/диоды
('SOT-23', 'JEDEC'), ('SOT-223', 'JEDEC'), ('SOT-25', 'JEDEC'), ('SOT-363', 'JEDEC'),
('SOT-89', 'JEDEC'), ('SOT-323', 'JEDEC'),
-- SOIC и подобные
('SOIC-8', 'JEDEC'), ('SOIC-14', 'JEDEC'), ('SOIC-16', 'JEDEC'), ('SOIC-20', 'JEDEC'),
('SOIC-24', 'JEDEC'), ('SOIC-28', 'JEDEC'),
-- SSOP/TSSOP
('SSOP-8', 'JEDEC'), ('SSOP-14', 'JEDEC'), ('SSOP-16', 'JEDEC'), ('SSOP-20', 'JEDEC'),
('TSSOP-8', 'JEDEC'), ('TSSOP-14', 'JEDEC'), ('TSSOP-16', 'JEDEC'), ('TSSOP-20', 'JEDEC'),
('TSSOP-24', 'JEDEC'), ('TSSOP-28', 'JEDEC'),
-- QFP
('QFP-32', 'JEDEC'), ('QFP-44', 'JEDEC'), ('QFP-48', 'JEDEC'), ('QFP-64', 'JEDEC'),
('QFP-80', 'JEDEC'), ('QFP-100', 'JEDEC'), ('QFP-128', 'JEDEC'),
('LQFP-32', 'JEDEC'), ('LQFP-48', 'JEDEC'), ('LQFP-64', 'JEDEC'), ('LQFP-100', 'JEDEC'),
-- BGA
('BGA-64', 'JEDEC'), ('BGA-100', 'JEDEC'), ('BGA-144', 'JEDEC'), ('BGA-256', 'JEDEC'),
('BGA-484', 'JEDEC'), ('WLCSP-4', 'JEDEC'), ('WLCSP-9', 'JEDEC'), ('WLCSP-16', 'JEDEC'),
-- QFN/DFN
('QFN-8', 'JEDEC'), ('QFN-16', 'JEDEC'), ('QFN-20', 'JEDEC'), ('QFN-24', 'JEDEC'),
('QFN-28', 'JEDEC'), ('QFN-32', 'JEDEC'), ('QFN-40', 'JEDEC'), ('QFN-48', 'JEDEC'),
('DFN-6', 'JEDEC'), ('DFN-8', 'JEDEC'),
-- DIP/THT
('DIP-8', 'JEDEC'), ('DIP-14', 'JEDEC'), ('DIP-16', 'JEDEC'), ('DIP-20', 'JEDEC'),
('DIP-28', 'JEDEC'), ('DIP-40', 'JEDEC'),
-- TO (транзисторные)
('TO-92', 'JEDEC'), ('TO-126', 'JEDEC'), ('TO-220', 'JEDEC'), ('TO-247', 'JEDEC'),
('TO-263', 'JEDEC'), ('TO-252', 'JEDEC'),
-- Общие
('THT', 'Custom'), ('SMD', 'Custom'),
-- Метрические
('0402_M', 'Metric'), ('0603_M', 'Metric'), ('0805_M', 'Metric'), ('1206_M', 'Metric')
ON CONFLICT (name) DO NOTHING;