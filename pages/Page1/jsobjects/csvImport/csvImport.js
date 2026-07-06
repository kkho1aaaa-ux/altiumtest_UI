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
		const allDbFields = [
			{ key: 'part_number', label: 'Part Number', required: true, type: 'mapping' },
			{ key: 'manufacturer_name', label: 'Manufacturer', required: true, type: 'mapping' },
			{ key: 'value_display', label: 'Value Display', required: false, type: 'mapping' },
			{ key: 'tolerance_percent', label: 'Tolerance %', required: false, type: 'mapping' },
			{ key: 'voltage_rating_v', label: 'Voltage Rating V', required: false, type: 'mapping' },
			{ key: 'temp_max_c', label: 'Temp Max °C', required: false, type: 'mapping' },
			{ key: 'temp_min_c', label: 'Temp Min °C', required: false, type: 'mapping' },
			{ key: 'package', label: 'Package', required: false, type: 'mapping' },
			{ key: 'datasheet_url', label: 'Datasheet URL', required: false, type: 'mapping' },
			{ key: 'spice_model_path', label: 'Spice Model Path', required: false, type: 'mapping' },
			{ key: 'category_name', label: 'Category Name', required: false, type: 'static', default: 'Capacitors' },
			{ key: 'altium_designator', label: 'Altium Designator', required: false, type: 'static', default: 'C' },
			{ key: 'altium_comment', label: 'Altium Comment', required: false, type: 'static', default: '' },
			{ key: 'kicad_keywords', label: 'KiCad Keywords', required: false, type: 'static', default: '' },
			{ key: 'kicad_fp_filter', label: 'KiCad FP Filter', required: false, type: 'static', default: '' }
		];

		csvImport.state.dbFields = allDbFields;
		csvImport.state.mapping = {};
		csvImport.state.staticValues = {};

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

		const firstRow = csvImport.state.rawData[0];
		console.log('=== RAW DATA KEYS ===', Object.keys(firstRow));
		console.log('=== RAW DATA FIRST ROW ===', firstRow);
		console.log('=== MAPPING ===', mapping);

		csvImport.state.previewData = csvImport.state.rawData.map((row, index) => {
			const getFieldValue = (fieldName) => {
				if (!fieldName) return '';
				let value = row[fieldName];

				if (value === undefined || value === null) {
					const normalizedFieldName = fieldName.trim();
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

		console.log('=== PREVIEW FIRST ROW ===', csvImport.state.previewData[0]);
		console.log('Part number from preview:', csvImport.state.previewData[0]?.part_number);

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
		const selectedRows = Table2.selectedRows || [];

		if (!field) {
			showAlert('Выберите поле для редактирования', 'warning');
			return;
		}

		if (selectedRows.length === 0) {
			showAlert('Выберите хотя бы одну строку в таблице (галочки слева)', 'warning');
			return;
		}

		const selectedIds = new Set(selectedRows.map(r => r._id));

		let updatedCount = 0;
		csvImport.state.previewData.forEach(row => {
			if (selectedIds.has(row._id)) {
				row[field] = value;

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

	// ✅ НОВЫЙ МЕТОД - обновление строки при изменении Select
	updateRow: (index, field, value) => {
		const row = csvImport.state.previewData[index];
		if (row) {
			row[field] = value;

			// Если изменили multiplier, unit или number - пересчитываем value_display
			if (field === 'value_multiplier' || field === 'value_unit' || field === 'value_number') {
				row.value_display = componentConstants.buildValueDisplay(
					row.value_number,
					row.value_multiplier,
					row.value_unit
				);
			}
		}
	},

	importAll: async () => {
		const data = csvImport.state.previewData;

		if (data.length === 0) {
			showAlert('Нет данных для импорта', 'warning');
			return;
		}

		// ===== ПРОВЕРКА ОБЯЗАТЕЛЬНЫХ ПОЛЕЙ =====
		const validationErrors = [];

		data.forEach((row, index) => {
			const rowErrors = [];
			const rowNum = index + 1;

			// Определяем микросхема ли это
			const categories = getCategories.data || [];
			const selectedCategory = categories.find(cat => cat.name === row.category_name);
			const isIC = selectedCategory && (
				selectedCategory.name.toLowerCase().includes('ic') ||
				selectedCategory.name.toLowerCase().includes('микросхема') ||
				selectedCategory.altium_designator === 'U' ||
				selectedCategory.altium_designator === 'IC'
			);

			// 1. Part Number (обязателен всегда)
			if (!row.part_number || String(row.part_number).trim() === '') {
				rowErrors.push('Part Number');
			}

			// 2. Category Name (обязателен всегда)
			if (!row.category_name || String(row.category_name).trim() === '') {
				rowErrors.push('Category Name');
			}

			// 3. Library Path (обязателен всегда)
			if (!row.library_path || String(row.library_path).trim() === '') {
				rowErrors.push('Library Path');
			}

			// 4. Library Ref (обязателен всегда)
			if (!row.library_ref || String(row.library_ref).trim() === '') {
				rowErrors.push('Library Ref');
			}

			// 5. Footprint Path (обязателен всегда)
			if (!row.footprint_path || String(row.footprint_path).trim() === '') {
				rowErrors.push('Footprint Path');
			}

			// 6. Footprint Ref (обязателен всегда)
			if (!row.footprint_ref || String(row.footprint_ref).trim() === '') {
				rowErrors.push('Footprint Ref');
			}

			// 7. Value (обязателен если НЕ микросхема)
			if (!isIC) {
				if (!row.value_number || row.value_number === 0 || row.value_number === '') {
					rowErrors.push('Value Number');
				}
				if (!row.value_multiplier && row.value_multiplier !== 0) {
					rowErrors.push('Value Multiplier');
				}
				if (!row.value_unit || String(row.value_unit).trim() === '') {
					rowErrors.push('Value Unit');
				}
			}

			// 8. Tolerance (обязателен если НЕ микросхема)
			if (!isIC) {
				if (row.tolerance_percent === null || row.tolerance_percent === undefined || row.tolerance_percent === '') {
					rowErrors.push('Tolerance');
				}
			}

			// 9. Package (обязателен всегда)
			if (!row.package || String(row.package).trim() === '') {
				rowErrors.push('Package');
			}

			// Если есть ошибки - добавляем в общий список
			if (rowErrors.length > 0) {
				validationErrors.push({
					row: rowNum,
					part_number: row.part_number || `(строка ${rowNum})`,
					fields: rowErrors
				});
			}
		});

		// Если есть ошибки валидации - показываем alert и прерываем
		if (validationErrors.length > 0) {
			const maxErrorsToShow = 10;
			const errorsToShow = validationErrors.slice(0, maxErrorsToShow);

			let errorMessage = `❌ Найдено ${validationErrors.length} строк с незаполненными обязательными полями:\n\n`;

			errorsToShow.forEach(err => {
				errorMessage += `📌 Строка ${err.row} (${err.part_number}):\n`;
				errorMessage += `   • ${err.fields.join(', ')}\n`;
			});

			if (validationErrors.length > maxErrorsToShow) {
				errorMessage += `\n... и ещё ${validationErrors.length - maxErrorsToShow} строк`;
			}

			errorMessage += `\n\n💡 Используйте массовое редактирование для заполнения полей.`;

			showAlert(errorMessage, 'error');
			return;
		}

		// ===== ИМПОРТ ДАННЫХ =====
		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
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