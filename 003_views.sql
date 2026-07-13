-- ===== МИГРАЦИЯ 003: VIEW'Ы ДЛЯ ЭКСПОРТА И ОТОБРАЖЕНИЯ =====
-- Создает представления (VIEW) для главной таблицы и для экспорта в различные САПР
-- Иерархия в KiCad:
--   Резисторы: Resistors/{package}/{part_number}
--   Конденсаторы: Capacitors/{dielectric_type}/{package}/{part_number}
--   Индуктивности: Inductors/{package}/{part_number}
--   Диоды: Diodes/{part_number}
--   Светодиоды: Diodes/{part_number}
--   Транзисторы: Transistors/{transistor_type}/{part_number}
--   Микросхемы: ICs/{part_number}
--   Разъёмы: Connectors/{pitch_mm}mm/{pin_count}pin/{part_number}

-- ===== 1. ПОЛНЫЙ VIEW ДЛЯ ГЛАВНОЙ ТАБЛИЦЫ =====
CREATE OR REPLACE VIEW v_components_full AS
SELECT 
    c.id,
    c.part_number,
    c.category_id,
    cat.name AS category_name,
    CASE cat.name
        WHEN 'Resistors' THEN 'Резисторы'
        WHEN 'Capacitors' THEN 'Конденсаторы'
        WHEN 'Inductors' THEN 'Индуктивности'
        WHEN 'Diodes' THEN 'Диоды'
        WHEN 'LEDs' THEN 'Светодиоды'
        WHEN 'Transistors' THEN 'Транзисторы'
        WHEN 'ICs' THEN 'Микросхемы'
        WHEN 'Connectors' THEN 'Разъёмы'
        ELSE cat.name
    END AS category_name_ru,
    cat.designator_prefix,
    c.manufacturer_id,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.spice_model_path,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.resistance_ohm,
    c.capacitance_pf,
    c.inductance_uh,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    c.package,
    c.package_standard,
    c.dielectric_type,
    c.is_polarized,
    c.q_factor,
    c.diode_type,
    c.forward_voltage_v,
    c.reverse_voltage_v,
    c.transistor_type,
    c.channel_type,
    c.output_voltage_v,
    c.dropout_voltage_v,
    c.pin_count,
    c.pitch_mm,
    c.altium_comment,
    c.altium_designator,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.created_at,
    c.updated_at
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id;

-- ===== 2. VIEW ДЛЯ KiCad - РЕЗИСТОРЫ =====
-- Иерархия: Resistors/{package}/{part_number}
CREATE OR REPLACE VIEW resistors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Resistors/', COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.resistance_ohm,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'R';

-- ===== 3. VIEW ДЛЯ KiCad - КОНДЕНСАТОРЫ =====
-- Иерархия: Capacitors/{dielectric_type}/{package}/{part_number}
CREATE OR REPLACE VIEW capacitors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Capacitors/', COALESCE(c.dielectric_type, 'Unknown'), '/', 
           COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    c.dielectric_type,
    c.is_polarized,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.capacitance_pf,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'C';

-- ===== 4. VIEW ДЛЯ KiCad - ИНДУКТИВНОСТИ =====
-- Иерархия: Inductors/{package}/{part_number}
CREATE OR REPLACE VIEW inductors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Inductors/', COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.inductance_uh,
    c.q_factor,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'L';

-- ===== 5. VIEW ДЛЯ KiCad - ДИОДЫ И СВЕТОДИОДЫ =====
-- Иерархия: Diodes/{part_number}
CREATE OR REPLACE VIEW diodes AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Diodes/', c.part_number) AS symbol_name,
    c.diode_type,
    c.forward_voltage_v,
    c.reverse_voltage_v,
    c.package,
    c.value_display,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix IN ('D', 'LED');

-- ===== 6. VIEW ДЛЯ KiCad - ТРАНЗИСТОРЫ =====
-- Иерархия: Transistors/{transistor_type}/{part_number}
CREATE OR REPLACE VIEW transistors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Transistors/', COALESCE(c.transistor_type, 'Unknown'), '/', c.part_number) AS symbol_name,
    c.transistor_type,
    c.channel_type,
    c.package,
    c.value_display,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'Q';

-- ===== 7. VIEW ДЛЯ KiCad - МИКРОСХЕМЫ =====
-- Иерархия: ICs/{part_number}
CREATE OR REPLACE VIEW ic AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('ICs/', c.part_number) AS symbol_name,
    c.package,
    c.output_voltage_v,
    c.dropout_voltage_v,
    c.value_display,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'U';

-- ===== 8. VIEW ДЛЯ KiCad - РАЗЪЁМЫ =====
-- Иерархия: Connectors/{pitch_mm}mm/{pin_count}pin/{part_number}
CREATE OR REPLACE VIEW connectors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT('Connectors/', 
           COALESCE(CAST(c.pitch_mm AS VARCHAR), 'Unknown'), 'mm/',
           COALESCE(CAST(c.pin_count AS VARCHAR), '?'), 'pin/',
           c.part_number) AS symbol_name,
    c.pitch_mm,
    c.pin_count,
    c.package,
    c.value_display,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'J';