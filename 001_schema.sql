-- ===== МИГРАЦИЯ 001: СТРУКТУРА БД =====
-- Создает таблицы, функции, триггеры и индексы

-- ===== 1. СПРАВОЧНИКИ =====

CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    parent_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    designator_prefix VARCHAR(10),
    is_active_component BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS manufacturers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    website VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS component_designators (
    id SERIAL PRIMARY KEY,
    prefix VARCHAR(10) NOT NULL UNIQUE,
    description VARCHAR(255) NOT NULL,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    altium_lib_type VARCHAR(50),
    kicad_symbol_prefix VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_prefix CHECK (prefix ~ '^[A-Z]{1,3}$')
);

CREATE TABLE IF NOT EXISTS category_library_mapping (
    id SERIAL PRIMARY KEY,
    category_id INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    platform VARCHAR(20) NOT NULL,
    library_name VARCHAR(255) NOT NULL,
    library_path VARCHAR(500),
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(category_id, platform, library_name)
);

CREATE TABLE IF NOT EXISTS packages (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL UNIQUE,
    standard VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ===== 2. ТРИГГЕР ДЛЯ ОБНОВЛЕНИЯ updated_at =====

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ===== 3. ГЛАВНАЯ ТАБЛИЦА КОМПОНЕНТОВ =====

CREATE TABLE IF NOT EXISTS components (
    id SERIAL PRIMARY KEY,
    
    -- ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
    part_number VARCHAR(255) NOT NULL UNIQUE,
    
    -- ===== КАТЕГОРИЗАЦИЯ =====
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    manufacturer_id INTEGER REFERENCES manufacturers(id) ON DELETE SET NULL,
    
    -- ===== ССЫЛКИ НА ФАЙЛЫ =====
    library_path VARCHAR(1000),
    library_ref VARCHAR(500),
    footprint_path VARCHAR(1000),
    footprint_ref VARCHAR(500),
    datasheet_url VARCHAR(1000),
    spice_model_path VARCHAR(1000),
    
    -- ===== УНИВЕРСАЛЬНЫЙ НОМИНАЛ =====
    value_display VARCHAR(100),
    value_numeric DECIMAL(15, 6),
    value_unit VARCHAR(100),
    
    -- ===== ОСНОВНЫЕ ПАРАМЕТРЫ (связаны с value_display) =====
    resistance_ohm DECIMAL(15, 6),
    capacitance_pf DECIMAL(15, 6),
    inductance_uh DECIMAL(15, 6),
    
    -- ===== УНИВЕРСАЛЬНЫЕ ПАРАМЕТРЫ =====
    tolerance_percent DECIMAL(5, 2),
    voltage_rating_v DECIMAL(10, 2),
    power_rating_w DECIMAL(10, 4),
    temp_min_c DECIMAL(5, 1),
    temp_max_c DECIMAL(5, 1),
    
    -- ===== КОРПУС =====
    package VARCHAR(200),
    package_standard VARCHAR(100),
    
    -- ===== СПЕЦИФИЧНЫЕ ПОЛЯ ПО ТИПАМ КОМПОНЕНТОВ =====
    -- Конденсаторы
    dielectric_type VARCHAR(50),
    is_polarized BOOLEAN DEFAULT FALSE,
    
    -- Индуктивности
    q_factor DECIMAL(10, 2),
    
    -- Диоды
    diode_type VARCHAR(50),
    forward_voltage_v DECIMAL(10, 3),
    reverse_voltage_v DECIMAL(10, 2),
    
    -- Транзисторы
    transistor_type VARCHAR(10),
    channel_type VARCHAR(10),
    
    -- Микросхемы
    operating_temp_min_c DECIMAL(5, 1),
    operating_temp_max_c DECIMAL(5, 1),
    output_voltage_v DECIMAL(10, 2),
    dropout_voltage_v DECIMAL(10, 3),
    
    -- Разъёмы
    pin_count INTEGER,
    pitch_mm DECIMAL(10, 3),
    
    -- ===== СПЕЦИФИЧНЫЕ ПОЛЯ ДЛЯ САПР =====
    altium_comment VARCHAR(500),
    altium_designator VARCHAR(100),
    kicad_keywords VARCHAR(1000),
    kicad_fp_filter VARCHAR(1000),
    
    -- ===== МЕТАДАННЫЕ =====
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- ===== ОГРАНИЧЕНИЯ =====
    CONSTRAINT valid_temp_range CHECK (temp_min_c <= temp_max_c),
    CONSTRAINT valid_tolerance CHECK (tolerance_percent >= 0),
    CONSTRAINT valid_voltage CHECK (voltage_rating_v >= 0),
    CONSTRAINT valid_power CHECK (power_rating_w >= 0)
);

-- ===== 4. ИНДЕКСЫ НА СПРАВОЧНИКИ =====

CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_designator ON categories(designator_prefix);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active_component);

CREATE INDEX IF NOT EXISTS idx_designators_prefix ON component_designators(prefix);
CREATE INDEX IF NOT EXISTS idx_designators_category ON component_designators(category_id);

CREATE INDEX IF NOT EXISTS idx_library_mapping_category ON category_library_mapping(category_id);
CREATE INDEX IF NOT EXISTS idx_library_mapping_platform ON category_library_mapping(platform);

CREATE INDEX IF NOT EXISTS idx_packages_name ON packages(name);
CREATE INDEX IF NOT EXISTS idx_packages_standard ON packages(standard);

-- ===== 5. ИНДЕКСЫ НА ТАБЛИЦУ КОМПОНЕНТОВ =====

CREATE INDEX IF NOT EXISTS idx_components_part_number ON components(part_number);
CREATE INDEX IF NOT EXISTS idx_components_category ON components(category_id);
CREATE INDEX IF NOT EXISTS idx_components_manufacturer ON components(manufacturer_id);
CREATE INDEX IF NOT EXISTS idx_components_value_numeric ON components(value_numeric);
CREATE INDEX IF NOT EXISTS idx_components_resistance ON components(resistance_ohm);
CREATE INDEX IF NOT EXISTS idx_components_capacitance ON components(capacitance_pf);
CREATE INDEX IF NOT EXISTS idx_components_inductance ON components(inductance_uh);
CREATE INDEX IF NOT EXISTS idx_components_tolerance ON components(tolerance_percent);
CREATE INDEX IF NOT EXISTS idx_components_voltage ON components(voltage_rating_v);
CREATE INDEX IF NOT EXISTS idx_components_power ON components(power_rating_w);
CREATE INDEX IF NOT EXISTS idx_components_temp_min ON components(temp_min_c);
CREATE INDEX IF NOT EXISTS idx_components_temp_max ON components(temp_max_c);
CREATE INDEX IF NOT EXISTS idx_components_package ON components(package);
CREATE INDEX IF NOT EXISTS idx_components_dielectric_type ON components(dielectric_type);
CREATE INDEX IF NOT EXISTS idx_components_is_polarized ON components(is_polarized);
CREATE INDEX IF NOT EXISTS idx_components_diode_type ON components(diode_type);
CREATE INDEX IF NOT EXISTS idx_components_transistor_type ON components(transistor_type);
CREATE INDEX IF NOT EXISTS idx_components_channel_type ON components(channel_type);
CREATE INDEX IF NOT EXISTS idx_components_pin_count ON components(pin_count);
CREATE INDEX IF NOT EXISTS idx_components_pitch_mm ON components(pitch_mm);
CREATE INDEX IF NOT EXISTS idx_components_forward_voltage_v ON components(forward_voltage_v);
CREATE INDEX IF NOT EXISTS idx_components_reverse_voltage_v ON components(reverse_voltage_v);
CREATE INDEX IF NOT EXISTS idx_components_operating_temp_min_c ON components(operating_temp_min_c);
CREATE INDEX IF NOT EXISTS idx_components_operating_temp_max_c ON components(operating_temp_max_c);
CREATE INDEX IF NOT EXISTS idx_components_output_voltage_v ON components(output_voltage_v);
CREATE INDEX IF NOT EXISTS idx_components_dropout_voltage_v ON components(dropout_voltage_v);
CREATE INDEX IF NOT EXISTS idx_components_q_factor ON components(q_factor);

-- ===== 6. ТРИГГЕРЫ =====

DROP TRIGGER IF EXISTS update_components_updated_at ON components;
CREATE TRIGGER update_components_updated_at 
    BEFORE UPDATE ON components 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
CREATE TRIGGER update_packages_updated_at 
    BEFORE UPDATE ON packages 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Триггер синхронизации value_display со специфичными полями по категориям
CREATE OR REPLACE FUNCTION sync_value_with_category_params()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.value_unit = 'Ω' THEN
        NEW.resistance_ohm := NEW.value_numeric;
    ELSIF NEW.value_unit = 'pF' THEN
        NEW.capacitance_pf := NEW.value_numeric;
    ELSIF NEW.value_unit = 'µH' OR NEW.value_unit = 'uH' THEN
        NEW.inductance_uh := NEW.value_numeric;
    END IF;
    
    IF NEW.resistance_ohm IS NOT NULL AND NEW.value_unit = 'Ω' THEN
        NEW.value_numeric := NEW.resistance_ohm;
    ELSIF NEW.capacitance_pf IS NOT NULL AND NEW.value_unit = 'pF' THEN
        NEW.value_numeric := NEW.capacitance_pf;
    ELSIF NEW.inductance_uh IS NOT NULL AND (NEW.value_unit = 'µH' OR NEW.value_unit = 'uH') THEN
        NEW.value_numeric := NEW.inductance_uh;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

DROP TRIGGER IF EXISTS trg_sync_value_with_category_params ON components;
CREATE TRIGGER trg_sync_value_with_category_params
    BEFORE INSERT OR UPDATE ON components
    FOR EACH ROW
    EXECUTE FUNCTION sync_value_with_category_params();
