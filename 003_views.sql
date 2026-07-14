-- ===== МИГРАЦИЯ 003: VIEW'Ы ДЛЯ ЭКСПОРТА И ОТОБРАЖЕНИЯ =====
-- Создает представления (VIEW) для экспорта в KiCad и Altium
-- Используем только symbol_name для всех библиотек
-- Формируем чистые имена библиотек для Altium (без пути и расширения)

-- ===== 1. ПОЛНЫЙ VIEW ДЛЯ ГЛАВНОЙ ТАБЛИЦЫ =====
DROP VIEW IF EXISTS v_components_full CASCADE;
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
    c.value_multiplier,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    c.package,
    c.package_standard,
    c.dielectric_type,
    c.is_polarized,
    c.q_factor,
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

-- ===== 2. VIEW ДЛЯ KiCad/Altium - РЕЗИСТОРЫ =====
DROP VIEW IF EXISTS resistors CASCADE;
CREATE OR REPLACE VIEW resistors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT(COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    cat.designator_prefix,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.value_multiplier,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'R';

-- ===== 3. VIEW ДЛЯ KiCad/Altium - КОНДЕНСАТОРЫ =====
DROP VIEW IF EXISTS capacitors CASCADE;
CREATE OR REPLACE VIEW capacitors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT(COALESCE(c.dielectric_type, 'Unknown'), '/', 
           COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    cat.designator_prefix,
    c.dielectric_type,
    c.is_polarized,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.value_multiplier,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'C';

-- ===== 4. VIEW ДЛЯ KiCad/Altium - ИНДУКТИВНОСТИ =====
DROP VIEW IF EXISTS inductors CASCADE;
CREATE OR REPLACE VIEW inductors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT(COALESCE(c.package, 'Unknown'), '/', c.part_number) AS symbol_name,
    cat.designator_prefix,
    c.package,
    c.value_display,
    c.value_numeric,
    c.value_unit,
    c.value_multiplier,
    c.q_factor,
    c.tolerance_percent,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'L';

-- ===== 5. VIEW ДЛЯ KiCad/Altium - ДИОДЫ И СВЕТОДИОДЫ =====
DROP VIEW IF EXISTS diodes CASCADE;
CREATE OR REPLACE VIEW diodes AS
SELECT 
    c.id,
    c.part_number,
    c.part_number AS symbol_name,
    cat.designator_prefix,
    c.package,
    c.forward_voltage_v,
    c.reverse_voltage_v,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix IN ('D', 'LED');

-- ===== 6. VIEW ДЛЯ KiCad/Altium - ТРАНЗИСТОРЫ =====
DROP VIEW IF EXISTS transistors CASCADE;
CREATE OR REPLACE VIEW transistors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT(COALESCE(c.transistor_type, 'Unknown'), '/', c.part_number) AS symbol_name,
    cat.designator_prefix,
    c.transistor_type,
    c.channel_type,
    c.package,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'Q';

-- ===== 7. VIEW ДЛЯ KiCad/Altium - МИКРОСХЕМЫ =====
DROP VIEW IF EXISTS ic CASCADE;
CREATE OR REPLACE VIEW ic AS
SELECT 
    c.id,
    c.part_number,
    c.part_number AS symbol_name,
    cat.designator_prefix,
    c.package,
    c.output_voltage_v,
    c.dropout_voltage_v,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'U';

-- ===== 8. VIEW ДЛЯ KiCad/Altium - РАЗЪЁМЫ =====
DROP VIEW IF EXISTS connectors CASCADE;
CREATE OR REPLACE VIEW connectors AS
SELECT 
    c.id,
    c.part_number,
    CONCAT(COALESCE(CAST(c.pitch_mm AS VARCHAR), 'Unknown'), 'mm/',
           COALESCE(CAST(c.pin_count AS VARCHAR), '?'), 'pin/',
           c.part_number) AS symbol_name,
    cat.designator_prefix,
    c.pitch_mm,
    c.pin_count,
    c.package,
    c.temp_min_c,
    c.temp_max_c,
    m.name AS manufacturer_name,
    c.library_path,
    c.library_ref,
    c.footprint_path,
    c.footprint_ref,
    CONCAT(
        regexp_replace(regexp_replace(c.library_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.library_ref
    ) AS altium_symbol_path,
    CONCAT(
        regexp_replace(regexp_replace(c.footprint_path, '.*[\\/]', ''), '\.[^.]+$', ''), 
        ':', c.footprint_ref
    ) AS altium_footprint_path,
    c.datasheet_url,
    c.kicad_keywords,
    c.kicad_fp_filter,
    c.altium_comment
FROM components c
LEFT JOIN categories cat ON c.category_id = cat.id
LEFT JOIN manufacturers m ON c.manufacturer_id = m.id
WHERE cat.designator_prefix = 'J';