export default {
	state: {
		rawData: [],
		headers: [],
		selectedFields: [],
		mapping: {},
		previewData: [],
		staticValues: {},
		dbFields: [],
		staticFields: []
	},

	parseCSV: (fileContent) => {
		try {
			let headers = [];
			let rows = [];

			if (Array.isArray(fileContent)) {
				rows = fileContent;
				if (rows.length > 0) {
					headers = Object.keys(rows[0]);
				}
			} 
			else if (typeof fileContent === 'string') {
				const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
				if (lines.length === 0) {
					showAlert('Файл пуст', 'warning');
					return { success: false, error: 'Empty file' };
				}
				headers = csvImport.parseCSVLine(lines[0]);
				for (let i = 1; i < lines.length; i++) {
					const values = csvImport.parseCSVLine(lines[i]);
					if (values.length === headers.length) {
						const row = {};
						headers.forEach((header, idx) => {
							row[header] = values[idx] || '';
						});
						rows.push(row);
					}
				}
			}
			else {
				showAlert('Неподдерживаемый формат файла', 'error');
				return { success: false, error: 'Unsupported format' };
			}

			if (rows.length === 0) {
				showAlert('Файл не содержит данных', 'warning');
				return { success: false, error: 'No data' };
			}

			csvImport.state.rawData = rows;
			csvImport.state.headers = headers;
			csvImport.state.selectedFields = headers;
			csvImport.state.mapping = {};
			csvImport.state.previewData = [];

			const options = headers
			.map(h => ({ label: String(h), value: String(h) }))
			.sort((a, b) => a.label.localeCompare(b.label));

			storeValue('csvFieldOptions', options);
			storeValue('csvFieldSelectedValues', headers);

			showAlert(`Загружено: ${rows.length} строк, ${headers.length} полей`, 'success');
			return { success: true, rows: rows.length, headers: headers.length };
		} catch (error) {
			showAlert('Ошибка парсинга: ' + error.message, 'error');
			return { success: false, error: error.message };
		}
	},

	parseCSVLine: (line) => {
		if (!line) return [];
		const result = [];
		let current = '';
		let inQuotes = false;
		for (let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];
			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					current += '"';
					i++;
				} else {
					inQuotes = !inQuotes;
				}
			} else if (char === ',' && !inQuotes) {
				result.push(current.trim());
				current = '';
			} else {
				current += char;
			}
		}
		result.push(current.trim());
		return result;
	},

	confirmFieldSelection: () => {
		const selected = appsmith.store.csvFieldSelectedValues || 
					csvFieldsCheckbox.selectedOptionValues || [];

		if (selected.length === 0) {
			showAlert('Выберите хотя бы одно поле', 'warning');
			return false;
		}

		csvImport.state.selectedFields = selected;
		csvImport.buildMappingUI();

		storeValue('currentImportTab', 'Маппинг');
		return true;
	},

	buildMappingUI: () => {
		// ВСЕ поля БД (и маппируемые, и статические)
		const allDbFields = [
			// Обязательные маппируемые
			{ key: 'part_number', label: 'Part Number', required: true, type: 'mapping' },
			{ key: 'manufacturer_name', label: 'Manufacturer', required: true, type: 'mapping' },

			// Опциональные маппируемые
			{ key: 'value_display', label: 'Value Display', required: false, type: 'mapping' },
			{ key: 'tolerance_percent', label: 'Tolerance %', required: false, type: 'mapping' },
			{ key: 'voltage_rating_v', label: 'Voltage Rating V', required: false, type: 'mapping' },
			{ key: 'temp_max_c', label: 'Temp Max °C', required: false, type: 'mapping' },
			{ key: 'temp_min_c', label: 'Temp Min °C', required: false, type: 'mapping' },
			{ key: 'package', label: 'Package', required: false, type: 'mapping' },
			{ key: 'datasheet_url', label: 'Datasheet URL', required: false, type: 'mapping' },
			{ key: 'spice_model_path', label: 'Spice Model Path', required: false, type: 'mapping' },

			// Статические поля (можно не маппить, оставить "-")
			{ key: 'category_name', label: 'Category Name', required: false, type: 'static', default: 'Capacitors' },
			{ key: 'altium_designator', label: 'Altium Designator', required: false, type: 'static', default: 'C' },
			{ key: 'altium_comment', label: 'Altium Comment', required: false, type: 'static', default: '' },
			{ key: 'kicad_keywords', label: 'KiCad Keywords', required: false, type: 'static', default: '' },
			{ key: 'kicad_fp_filter', label: 'KiCad FP Filter', required: false, type: 'static', default: '' }
		];

		csvImport.state.dbFields = allDbFields;
		csvImport.state.mapping = {};
		csvImport.state.staticValues = {};

		// Инициализация статических значений
		allDbFields.forEach(field => {
			if (field.type === 'static') {
				csvImport.state.staticValues[field.key] = field.default || '';
			}
		});

		storeValue('mappingCsvOptions', 
							 csvImport.state.selectedFields.map(f => ({ label: f, value: f }))
							);
		storeValue('mappingAllDbFields', allDbFields);
	},

	autoMap: () => {
		const mapping = {};
		const selectedFields = csvImport.state.selectedFields;
		const dbFields = csvImport.state.dbFields;

		const rules = {
			'part_number': ['Display PN', 'Base Pn', 'Part Number', 'PN'],
			'manufacturer_name': ['Manufacturer', 'Mfg', 'Brand'],
			'value_display': ['Capacitance', 'Resistance', 'Inductance', 'Value'],
			'tolerance_percent': ['Tolerance', 'Tol'],
			'voltage_rating_v': ['Voltage DC', 'Voltage', 'VDC'],
			'temp_max_c': ['Temp. Max.', 'Max Temp', 'Temperature Max'],
			'temp_min_c': ['Temp. Min.', 'Min Temp', 'Temperature Min'],
			'package': ['Mounting', 'Package', 'Case'],
			'datasheet_url': ['Datasheet URL', 'Datasheet'],
			'spice_model_path': ['Spice URL', 'Spice']
		};

		dbFields.forEach(dbField => {
			if (dbField.type !== 'mapping') return;

			const keywords = rules[dbField.key] || [];
			const matched = selectedFields.find(csvField => 
																					keywords.some(keyword => 
																												csvField.toLowerCase().includes(keyword.toLowerCase())
																											 )
																				 );
			if (matched) {
				mapping[dbField.key] = matched;
			}
		});

		csvImport.state.mapping = mapping;
		showAlert('Авто-маппинг выполнен!', 'success');
	},

	saveMapping: (dbKey, csvField) => {
		if (csvField && csvField !== '') {
			csvImport.state.mapping[dbKey] = csvField;
		} else {
			delete csvImport.state.mapping[dbKey];
		}
		console.log(`Mapping saved: ${dbKey} -> ${csvField}`, csvImport.state.mapping);
	},

	saveStaticValue: (key, value) => {
		csvImport.state.staticValues[key] = value;
	},

	applyMapping: () => {
		const mapping = csvImport.state.mapping;
		const staticValues = csvImport.state.staticValues;

		const requiredFields = ['part_number', 'manufacturer_name'];
		const missingRequired = requiredFields.filter(f => !mapping[f]);

		if (missingRequired.length > 0) {
			showAlert(`Не замапплены обязательные поля: ${missingRequired.join(', ')}`, 'warning');
			return false;
		}

		// 🔍 Отладка - показываем реальные ключи первого объекта
		const firstRow = csvImport.state.rawData[0];
		console.log('=== RAW DATA KEYS ===', Object.keys(firstRow));
		console.log('=== RAW DATA FIRST ROW ===', firstRow);
		console.log('=== MAPPING ===', mapping);

		csvImport.state.previewData = csvImport.state.rawData.map((row, index) => {
			// Улучшенная функция получения значения
			const getFieldValue = (fieldName) => {
				if (!fieldName) return '';

				// 1. Пробуем получить напрямую
				let value = row[fieldName];

				// 2. Если не найдено, пробуем варианты с пробелами/кавычками
				if (value === undefined || value === null) {
					const normalizedFieldName = fieldName.trim();

					// Ищем совпадение игнорируя регистр и пробелы
					const matchingKey = Object.keys(row).find(key => 
																										key.trim().toLowerCase() === normalizedFieldName.toLowerCase()
																									 );

					if (matchingKey) {
						value = row[matchingKey];
						console.log(`Found match: "${fieldName}" -> "${matchingKey}"`);
					}
				}

				return value !== undefined && value !== null ? String(value).trim() : '';
			};

			const partNumber = getFieldValue(mapping.part_number);
			const manufacturerName = getFieldValue(mapping.manufacturer_name);
			const valueDisplayRaw = getFieldValue(mapping.value_display);

			const valueData = csvParser.parseValue(valueDisplayRaw);

			return {
				_id: index,
				part_number: partNumber,
				manufacturer_name: manufacturerName,

				value_display: valueDisplayRaw,
				value_number: valueData.number,
				value_multiplier: valueData.multiplier,
				value_unit: valueData.unit,

				tolerance_percent: mapping.tolerance_percent ? csvParser.parseTolerance(getFieldValue(mapping.tolerance_percent)) : null,
				voltage_rating_v: mapping.voltage_rating_v ? csvParser.parseVoltage(getFieldValue(mapping.voltage_rating_v)) : null,
				temp_max_c: mapping.temp_max_c ? csvParser.parseTemperature(getFieldValue(mapping.temp_max_c)) : null,
				temp_min_c: mapping.temp_min_c ? csvParser.parseTemperature(getFieldValue(mapping.temp_min_c)) : null,

				package: getFieldValue(mapping.package),
				datasheet_url: getFieldValue(mapping.datasheet_url),
				spice_model_path: getFieldValue(mapping.spice_model_path),

				library_path: '',
				library_ref: '',
				footprint_path: '',
				footprint_ref: '',

				category_name: mapping.category_name ? (getFieldValue(mapping.category_name) || staticValues.category_name || 'Capacitors') : (staticValues.category_name || 'Capacitors'),
				altium_designator: mapping.altium_designator ? (getFieldValue(mapping.altium_designator) || staticValues.altium_designator || 'C') : (staticValues.altium_designator || 'C'),
				altium_comment: mapping.altium_comment ? (getFieldValue(mapping.altium_comment) || staticValues.altium_comment || '') : (staticValues.altium_comment || ''),
				kicad_keywords: mapping.kicad_keywords ? (getFieldValue(mapping.kicad_keywords) || staticValues.kicad_keywords || '') : (staticValues.kicad_keywords || ''),
				kicad_fp_filter: mapping.kicad_fp_filter ? (getFieldValue(mapping.kicad_fp_filter) || staticValues.kicad_fp_filter || '') : (staticValues.kicad_fp_filter || ''),

				_selected: false
			};
		});

		// 🔍 Проверка результата
		console.log('=== PREVIEW FIRST ROW ===', csvImport.state.previewData[0]);
		console.log('Part number from preview:', csvImport.state.previewData[0]?.part_number);

		// Проверка что part_number не пустой
		const invalidRows = csvImport.state.previewData.filter(r => !r.part_number);
		if (invalidRows.length > 0) {
			showAlert(`Warning: ${invalidRows.length} строк без part_number!`, 'warning');
		}

		storeValue('currentImportTab', 'Предпросмотр');
		return true;
	},

	applyBulkEdit: () => {
		const field = Select1.selectedOptionValue;
		const value = Input1.text;

		// Получаем выбранные строки ТОЛЬКО через Table2.selectedRows
		const selectedRows = Table2.selectedRows || [];

		if (!field) {
			showAlert('Выберите поле для редактирования', 'warning');
			return;
		}

		if (selectedRows.length === 0) {
			showAlert('Выберите хотя бы одну строку в таблице (галочки слева)', 'warning');
			console.log('Table2.selectedRows:', Table2.selectedRows);
			console.log('Preview data length:', csvImport.state.previewData.length);
			return;
		}

		// Собираем ID выбранных строк
		const selectedIds = new Set(selectedRows.map(r => r._id));

		console.log('Selected IDs:', Array.from(selectedIds));
		console.log('Field:', field, 'Value:', value);

		let updatedCount = 0;
		csvImport.state.previewData.forEach(row => {
			if (selectedIds.has(row._id)) {
				row[field] = value;

				// Пересчёт value при изменении value_display
				if (field === 'value_display') {
					const valueData = csvParser.parseValue(value);
					row.value_number = valueData.number;
					row.value_multiplier = valueData.multiplier;
					row.value_unit = valueData.unit;
				}
				updatedCount++;
			}
		});

		showAlert(`Применено "${value}" к ${updatedCount} строкам в поле "${field}"`, 'success');
	},


	importAll: async () => {
		const data = csvImport.state.previewData;

		if (data.length === 0) {
			showAlert('Нет данных для импорта', 'warning');
			return;
		}

		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];

			// Сохраняем в store для использования в SQL
			storeValue('importItem', item);

			try {
				await importComponent.run();
				successCount++;
			} catch (error) {
				errorCount++;
				errors.push(`${item.part_number}: ${error.message}`);
				console.error(`Error:`, { item: item, error: error.message });
			}
		}

		const message = `Импортировано: ${successCount} успешно, ${errorCount} ошибок`;
		showAlert(message, errorCount > 0 ? 'warning' : 'success');

		if (errors.length > 0) {
			console.error('Ошибки:', errors.slice(0, 3));
		}

		closeModal('modalCSVImport');
		await getAllComponents.run();
	},

	reset: () => {
		csvImport.state.rawData = [];
		csvImport.state.headers = [];
		csvImport.state.selectedFields = [];
		csvImport.state.mapping = {};
		csvImport.state.previewData = [];
		csvImport.state.staticValues = {};
		storeValue('currentImportTab', 'Выбор полей');
	}
}