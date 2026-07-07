export default {
	state: {
		rawData: [],
		headers: [],
		selectedFields: [],
		mapping: {},
		previewData: [],
		staticValues: {},
		dbFields: [],
		staticFields: [],
		userEdits: {}
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
			csvImport.state.userEdits = {};

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
		const selected = appsmith.store.csvFieldSelectedValues || [];

		if (!selected || selected.length === 0) {
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
			// Основная информация
			{ key: 'part_number', label: 'Part Number', required: false, type: 'mapping' },

			// Категоризация
			{ key: 'category_name', label: 'Category Name', required: false, type: 'mapping' },
			{ key: 'manufacturer_name', label: 'Manufacturer Name', required: false, type: 'mapping' },

			// Номинал
			{ key: 'value_display', label: 'Value Display', required: false, type: 'mapping' },
			{ key: 'tolerance_percent', label: 'Tolerance %', required: false, type: 'mapping' },
			{ key: 'voltage_rating_v', label: 'Voltage Rating (V)', required: false, type: 'mapping' },
			{ key: 'power_rating_w', label: 'Power Rating (W)', required: false, type: 'mapping' },
			{ key: 'temp_min_c', label: 'Temp Min (°C)', required: false, type: 'mapping' },
			{ key: 'temp_max_c', label: 'Temp Max (°C)', required: false, type: 'mapping' },

			// Корпус
			{ key: 'package', label: 'Package', required: false, type: 'mapping' },
			{ key: 'package_standard', label: 'Package Standard', required: false, type: 'mapping' },

			// ===== БИБЛИОТЕКИ (теперь редактируемые!) =====
			{ key: 'library_path', label: 'Library Path (SchLib)', required: false, type: 'mapping' },
			{ key: 'library_ref', label: 'Library Ref', required: false, type: 'mapping' },
			{ key: 'footprint_path', label: 'Footprint Path (PcbLib)', required: false, type: 'mapping' },
			{ key: 'footprint_ref', label: 'Footprint Ref', required: false, type: 'mapping' },

			// Ссылки
			{ key: 'datasheet_url', label: 'Datasheet URL', required: false, type: 'mapping' },
			{ key: 'spice_model_path', label: 'SPICE Model Path', required: false, type: 'mapping' },

			// Altium/KiCad специфичные
			{ key: 'altium_comment', label: 'Altium Comment', required: false, type: 'mapping' },
			{ key: 'altium_designator', label: 'Altium Designator', required: false, type: 'mapping' },
			{ key: 'kicad_keywords', label: 'KiCad Keywords', required: false, type: 'mapping' },
			{ key: 'kicad_fp_filter', label: 'KiCad FP Filter', required: false, type: 'mapping' },

			// Метаданные
			{ key: 'lifecycle', label: 'Lifecycle', required: false, type: 'mapping' },

			// ===== СТАТИЧЕСКИЕ ПОЛЯ =====
			{ key: 'name', label: 'Name', required: false, type: 'static', default: '' },
			{ key: 'status', label: 'Status', required: false, type: 'static', default: 'active' },
			{ key: 'rohs_compliant', label: 'RoHS Compliant', required: false, type: 'static', default: 'true' }
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

		console.log('buildMappingUI: Total fields:', allDbFields.length);
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

		if (!mapping.part_number) {
			showAlert('Не замаплено обязательное поле: Part Number', 'warning');
			return false;
		}

		// ===== ОПРЕДЕЛЯЕМ ЧТО ИЗМЕНИЛОСЬ В МАППИНГЕ =====
		const previousMapping = csvImport.state._lastAppliedMapping || {};
		const changedFields = [];

		const allKeys = new Set([
			...Object.keys(previousMapping),
			...Object.keys(mapping)
		]);

		allKeys.forEach(key => {
			if (previousMapping[key] !== mapping[key]) {
				changedFields.push(key);
			}
		});

		console.log('=== applyMapping ===');
		console.log('Changed fields:', changedFields);
		console.log('Previous mapping:', previousMapping);
		console.log('New mapping:', mapping);

		// ===== ЕСЛИ МАППИНГ НЕ МЕНЯЛСЬ И ДАННЫЕ ЕСТЬ — ПРОПУСКАЕМ =====
		if (changedFields.length === 0 && csvImport.state.previewData.length > 0) {
			console.log('Mapping unchanged, skipping');
			return true;
		}

		const categoriesData = getCategories.data || [];
		const manufacturersData = getManufacturers.data || [];
		const mappingsData = getCategoryLibraryMappings.data || [];

		// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
		const getFieldValue = (row, fieldName) => {
			if (!fieldName) return '';
			let value = row[fieldName];

			if (value === undefined || value === null) {
				const normalizedFieldName = fieldName.trim();
				const matchingKey = Object.keys(row).find(key => 
																									key.trim().toLowerCase() === normalizedFieldName.toLowerCase()
																								 );
				if (matchingKey) {
					value = row[matchingKey];
				}
			}

			return value !== undefined && value !== null ? String(value).trim() : '';
		};

		// ===== ПОЛЯ КОТОРЫЕ ЗАВИСЯТ ОТ ДРУГИХ =====
		// ВАЖНО: библиотеки НЕ зависят от category_name (они редактируемые)
		const dependentFields = {
			'category_name': ['category_id', 'altium_designator', 'resistance_ohm', 'capacitance_pf', 'inductance_uh', 'current_rating_a', 'voltage_breakdown_v'],
			'value_display': ['value_number', 'value_multiplier', 'value_unit', 'value_numeric', 'resistance_ohm', 'capacitance_pf', 'inductance_uh'],
			'part_number': ['name'],
			'manufacturer_name': ['manufacturer_id']
		};

		// Определяем какие поля нужно обновить (изменённые + зависимые)
		const fieldsToUpdate = new Set(changedFields);
		changedFields.forEach(field => {
			if (dependentFields[field]) {
				dependentFields[field].forEach(dep => fieldsToUpdate.add(dep));
			}
		});

		console.log('Fields to update:', Array.from(fieldsToUpdate));

		// ===== ЕСЛИ ЭТО ПЕРВЫЙ РАЗ — ГЕНЕРИРУЕМ ВСЁ =====
		if (csvImport.state.previewData.length === 0) {
			csvImport.state.previewData = csvImport.state.rawData.map((row, index) => {
				const partNumber = getFieldValue(row, mapping.part_number);
				const categoryName = getFieldValue(row, mapping.category_name) || '';
				const manufacturerName = getFieldValue(row, mapping.manufacturer_name) || '';
				const valueDisplayRaw = getFieldValue(row, mapping.value_display);

				const valueData = csvParser.parseValue(valueDisplayRaw);
				const valueNumeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);

				const category = categoriesData.find(cat => cat.name === categoryName);
				const categoryId = category ? category.id : null;
				const designator = category?.designator_prefix || 'X';

				const manufacturer = manufacturersData.find(m => m.name === manufacturerName);
				const manufacturerId = manufacturer ? manufacturer.id : null;

				// Авто-заполнение библиотек из category_library_mapping
				const schLibMapping = mappingsData.find(m => 
																								m.category_id === categoryId && m.platform === 'altium' && m.library_name?.endsWith('.SchLib')
																							 );
				const pcbLibMapping = mappingsData.find(m => 
																								m.category_id === categoryId && m.platform === 'altium' && m.library_name?.endsWith('.PcbLib')
																							 );

				// ===== БИБЛИОТЕКИ: если замапплены — берём из CSV, иначе авто =====
				let libraryPath, libraryRef, footprintPath, footprintRef;

				if (mapping.library_path) {
					libraryPath = getFieldValue(row, mapping.library_path);
				} else {
					libraryPath = schLibMapping?.library_name || '';
				}

				if (mapping.library_ref) {
					libraryRef = getFieldValue(row, mapping.library_ref);
				} else {
					libraryRef = designator;
				}

				if (mapping.footprint_path) {
					footprintPath = getFieldValue(row, mapping.footprint_path);
				} else {
					footprintPath = pcbLibMapping?.library_name || '';
				}

				if (mapping.footprint_ref) {
					footprintRef = getFieldValue(row, mapping.footprint_ref);
				} else {
					footprintRef = designator;
				}

				return {
					_id: index,
					part_number: partNumber,
					name: partNumber,
					description: '',
					category_id: categoryId,
					category_name: categoryName,
					manufacturer_id: manufacturerId,
					manufacturer_name: manufacturerName,
					value_display: valueDisplayRaw,
					value_number: valueData.number,
					value_multiplier: valueData.multiplier,
					value_unit: valueData.unit,
					value_numeric: valueNumeric,
					tolerance_percent: mapping.tolerance_percent ? csvParser.parseTolerance(getFieldValue(row, mapping.tolerance_percent)) : null,
					voltage_rating_v: mapping.voltage_rating_v ? csvParser.parseVoltage(getFieldValue(row, mapping.voltage_rating_v)) : null,
					power_rating_w: mapping.power_rating_w ? parseFloat(getFieldValue(row, mapping.power_rating_w)) || null : null,
					temp_min_c: mapping.temp_min_c ? csvParser.parseTemperature(getFieldValue(row, mapping.temp_min_c)) : null,
					temp_max_c: mapping.temp_max_c ? csvParser.parseTemperature(getFieldValue(row, mapping.temp_max_c)) : null,
					resistance_ohm: category?.name === 'Resistors' ? valueNumeric : null,
					capacitance_pf: category?.name === 'Capacitors' ? valueNumeric * 1e12 : null,
					inductance_uh: category?.name === 'Inductors' ? valueNumeric * 1e6 : null,
					current_rating_a: ['Diodes', 'Transistors', 'Thyristors'].includes(category?.name) ? valueNumeric : null,
					voltage_breakdown_v: ['Diodes', 'Transistors', 'Thyristors'].includes(category?.name) ? valueNumeric : null,
					pin_count: null,
					frequency_mhz: null,
					package: getFieldValue(row, mapping.package) || '',
					package_standard: getFieldValue(row, mapping.package_standard) || 'Custom',
					library_path: libraryPath,
					library_ref: libraryRef,
					footprint_path: footprintPath,
					footprint_ref: footprintRef,
					datasheet_url: getFieldValue(row, mapping.datasheet_url) || '',
					spice_model_path: getFieldValue(row, mapping.spice_model_path) || '',
					altium_comment: getFieldValue(row, mapping.altium_comment) || '',
					altium_designator: getFieldValue(row, mapping.altium_designator) || designator,
					kicad_keywords: getFieldValue(row, mapping.kicad_keywords) || '',
					kicad_fp_filter: getFieldValue(row, mapping.kicad_fp_filter) || '',
					status: staticValues.status || 'active',
					lifecycle: getFieldValue(row, mapping.lifecycle) || '',
					rohs_compliant: staticValues.rohs_compliant || 'true',
					_selected: false
				};
			});
		} 
		// ===== ВЫБОРОЧНАЯ РЕГЕНЕРАЦИЯ =====
		else {
			csvImport.state.previewData = csvImport.state.previewData.map((existingRow, index) => {
				const rawRow = csvImport.state.rawData[index];
				const updatedRow = { ...existingRow };
				const userEditsForRow = csvImport.state.userEdits[index] || {};

				// Обновляем только изменившиеся поля
				if (fieldsToUpdate.has('part_number')) {
					updatedRow.part_number = getFieldValue(rawRow, mapping.part_number);
					updatedRow.name = updatedRow.part_number;
				}

				if (fieldsToUpdate.has('manufacturer_name')) {
					updatedRow.manufacturer_name = getFieldValue(rawRow, mapping.manufacturer_name) || '';
					const manufacturer = manufacturersData.find(m => m.name === updatedRow.manufacturer_name);
					updatedRow.manufacturer_id = manufacturer ? manufacturer.id : null;
				}

				if (fieldsToUpdate.has('category_name')) {
					updatedRow.category_name = getFieldValue(rawRow, mapping.category_name) || '';
					const category = categoriesData.find(cat => cat.name === updatedRow.category_name);
					updatedRow.category_id = category ? category.id : null;
					const designator = category?.designator_prefix || 'X';

					// ===== БИБЛИОТЕКИ ПРИ СМЕНЕ КАТЕГОРИИ =====
					// Обновляем только если они НЕ были изменены вручную
					if (!userEditsForRow.library_path && !mapping.library_path) {
						const schLib = mappingsData.find(m => 
																						 m.category_id === updatedRow.category_id && m.platform === 'altium' && m.library_name?.endsWith('.SchLib')
																						);
						updatedRow.library_path = schLib?.library_name || '';
					}

					if (!userEditsForRow.library_ref && !mapping.library_ref) {
						updatedRow.library_ref = designator;
					}

					if (!userEditsForRow.footprint_path && !mapping.footprint_path) {
						const pcbLib = mappingsData.find(m => 
																						 m.category_id === updatedRow.category_id && m.platform === 'altium' && m.library_name?.endsWith('.PcbLib')
																						);
						updatedRow.footprint_path = pcbLib?.library_name || '';
					}

					if (!userEditsForRow.footprint_ref && !mapping.footprint_ref) {
						updatedRow.footprint_ref = designator;
					}

					// altium_designator — только если не изменён вручную
					if (!userEditsForRow.altium_designator) {
						updatedRow.altium_designator = getFieldValue(rawRow, mapping.altium_designator) || designator;
					}
				}

				if (fieldsToUpdate.has('value_display')) {
					updatedRow.value_display = getFieldValue(rawRow, mapping.value_display);
					const valueData = csvParser.parseValue(updatedRow.value_display);
					updatedRow.value_number = valueData.number;
					updatedRow.value_multiplier = valueData.multiplier;
					updatedRow.value_unit = valueData.unit;
					updatedRow.value_numeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);

					// Пересчитываем специфичные поля
					const category = categoriesData.find(cat => cat.id === updatedRow.category_id);
					if (category?.name === 'Resistors') updatedRow.resistance_ohm = updatedRow.value_numeric;
					if (category?.name === 'Capacitors') updatedRow.capacitance_pf = updatedRow.value_numeric * 1e12;
					if (category?.name === 'Inductors') updatedRow.inductance_uh = updatedRow.value_numeric * 1e6;
				}

				// ===== ОБНОВЛЕНИЕ ПОЛЕЙ БИБЛИОТЕК (если замапплены) =====
				const libraryFields = ['library_path', 'library_ref', 'footprint_path', 'footprint_ref'];
				libraryFields.forEach(field => {
					if (fieldsToUpdate.has(field) && mapping[field]) {
						updatedRow[field] = getFieldValue(rawRow, mapping[field]);
					}
				});

				// ===== ПРОСТЫЕ ПОЛЯ — ОБНОВЛЯЕМ НАПРЯМУЮ ИЗ CSV =====
				const simpleFields = [
					'tolerance_percent', 'voltage_rating_v', 'power_rating_w',
					'temp_min_c', 'temp_max_c', 'package', 'package_standard',
					'datasheet_url', 'spice_model_path', 'altium_comment',
					'altium_designator', 'kicad_keywords', 'kicad_fp_filter', 'lifecycle'
				];

				simpleFields.forEach(field => {
					if (fieldsToUpdate.has(field) && mapping[field]) {
						let parsedValue = getFieldValue(rawRow, mapping[field]);

						// Парсинг числовых значений
						if (field === 'tolerance_percent') parsedValue = csvParser.parseTolerance(parsedValue);
						else if (field === 'voltage_rating_v') parsedValue = csvParser.parseVoltage(parsedValue);
						else if (field === 'power_rating_w') parsedValue = parseFloat(parsedValue) || null;
						else if (field === 'temp_min_c' || field === 'temp_max_c') parsedValue = csvParser.parseTemperature(parsedValue);
						else if (field === 'package_standard') parsedValue = parsedValue || 'Custom';

						updatedRow[field] = parsedValue;
					}
				});

				return updatedRow;
			});
		}

		// ===== СОХРАНЯЕМ ТЕКУЩИЙ МАППИНГ =====
		csvImport.state._lastAppliedMapping = JSON.parse(JSON.stringify(mapping));

		const invalidRows = csvImport.state.previewData.filter(r => !r.part_number);
		if (invalidRows.length > 0) {
			showAlert(`Warning: ${invalidRows.length} строк без part_number!`, 'warning');
		}

		console.log('Preview data updated. Rows:', csvImport.state.previewData.length);
		return true;
	},

	autoMap: () => {
		const mapping = {};
		const selectedFields = csvImport.state.selectedFields;
		const dbFields = csvImport.state.dbFields;

		const rules = {
			// ===== ОСНОВНАЯ ИНФОРМАЦИЯ =====
			'part_number': [
				// ТОЧНЫЕ СОВПАДЕНИЯ (score 100)
				'part_number', 'partnumber', 'part number', 'part num', 'part num.',
				'part no', 'part no.', 'part#', 'part-number', 'p/n', 'pn',
				'base pn', 'base_pn', 'base part number', 'base_part_number',
				'display pn', 'display_pn', 'display/base pn', 'display base pn',
				'display base pn', 'display/base_pn',

				// Другие варианты
				'mpn', 'manufacturer pn', 'mfr pn',
				'supplier part', 'supplier part number', 'sku', 'article',
				'component', 'item', 'item number', 'item_number',
				'арт', 'артикул', 'номер детали', 'номер компонента',
				'обозначение', 'код', 'код детали'
			],

			'manufacturer_name': [
				// ТОЧНЫЕ СОВПАДЕНИЯ (score 100)
				'manufacturer', 'manufacturer_name', 'manufacturer name',
				'manufacturername', 'mfg', 'mfr', 'mfg_name', 'mfr_name',
				'vendor', 'producer', 'company', 'make', 'brand',
				'производитель', 'бренд', 'фирма', 'изготовитель', 'поставщик'
			],
			'category_name': [
				'category', 'category_name', 'categoryname', 'cat', 'type',
				'component type', 'component_type', 'class', 'family', 'group',
				'категория', 'тип', 'класс', 'семейство', 'группа'
			],
			'value_display': [
				'value', 'value_display', 'valuedisplay', 'nominal', 'rating',
				'capacitance', 'resistance', 'inductance', 'inductivity',
				'емкость', 'сопротивление', 'индуктивность', 'номинал', 'значение',
				'cap', 'res', 'ind'
			],
			'tolerance_percent': [
				'tolerance', 'tolerance_percent', 'tolerancepercent', 'tol',
				'accuracy', 'precision', 'deviation', 'error', 'допуск',
				'точность', 'погрешность', 'отклонение', 'tolerance %', 'tol %'
			],
			'voltage_rating_v': [
				'voltage', 'voltage_rating', 'voltage_rating_v', 'voltageratingv',
				'voltage rating', 'rated voltage', 'working voltage', 'max voltage',
				'vdc', 'vac', 'v max', 'v_min', 'v_max', 'напряжение', 'вольтаж',
				'voltage dc', 'voltage ac', 'u', 'u rating', 'u_max', 'u_min'
			],
			'power_rating_w': [
				'power', 'power_rating', 'power_rating_w', 'powerratingw',
				'power rating', 'rated power', 'wattage', 'dissipation', 'p rating',
				'p_max', 'мощность', 'ватт', 'рассеивание', 'power w', 'p rating w'
			],
			'temp_min_c': [
				'temp. min.', 'temp. min', 'temp min.', 'temp min',
				'min. temp.', 'min. temp', 'min temp.', 'min temp',
				'temp. min. c', 'temp. min. c.', 'min. temp. c', 'min. temp. c.',
				'temp_min', 'temp_min_c', 'tempminc', 'temperature min',
				'temperature_min', 'min temp', 'min_temp', 't_min', 'tmin',
				'low temp', 'lower temp', 'температура мин', 'мин температура',
				't min', 'temp min', 'min temperature',
				'temp min c', 'min temp c', 'minimum temp', 'minimum temperature'
			],
			'temp_max_c': [
				'temp. max.', 'temp. max', 'temp max.', 'temp max',
				'max. temp.', 'max. temp', 'max temp.', 'max temp',
				'temp. max. c', 'temp. max. c.', 'max. temp. c', 'max. temp. c.',
				'temp_max', 'temp_max_c', 'tempmaxc', 'temperature max',
				'temperature_max', 'max temp', 'max_temp', 't_max', 'tmax',
				'high temp', 'upper temp', 'температура макс', 'макс температура',
				't max', 'temp max', 'max temperature',
				'temp max c', 'max temp c', 'maximum temp', 'maximum temperature'
			],
			'package': [
				'package', 'pkg', 'case', 'housing', 'enclosure', 'footprint',
				'package_type', 'packagetype', 'case type', 'case_type', 'form factor',
				'form_factor', 'корпус', 'упаковка', 'тип корпуса', 'footprint name'
			],
			'package_standard': [
				'package_standard', 'packagestandard', 'standard', 'pkg standard',
				'pkg_standard', 'case standard', 'case_standard', 'norm', 'spec',
				'specification', 'стандарт', 'норма', 'стандарт корпуса'
			],
			'datasheet_url': [
				'datasheet', 'datasheet_url', 'datasheeturl', 'datasheet link',
				'datasheet_link', 'ds url', 'dsurl', 'doc url', 'docurl',
				'documentation', 'spec url', 'specurl', 'даташит', 'спецификация',
				'документация', 'datasheet link', 'doc link'
			],
			'spice_model_path': [
				'spice', 'spice_model', 'spice_model_path', 'spicemodelpath',
				'spice model', 'spicemodel', 'simulation model', 'simulation_model',
				'model path', 'modelpath', 'модель spice', 'spice модель',
				'симуляция', 'spice lib', 'model lib'
			],
			'altium_comment': [
				'altium_comment', 'altiumcomment', 'comment', 'altium desc',
				'altium_desc', 'altium description', 'altium_description',
				'комментарий altium', 'altium примечание', 'comment altium'
			],
			'altium_designator': [
				'altium_designator', 'altiumdesignator', 'designator', 'des',
				'design', 'ref des', 'refdes', 'reference designator',
				'reference_designator', 'обозначение', 'дизайнатор', 'ref designator'
			],
			'library_path': [
				'library_path', 'librarypath', 'schlib', 'sch_lib', 'sch lib',
				'schematic library', 'schematic_library', 'symbol library',
				'symbol_library', 'lib path', 'libpath', 'библиотека схем',
				'schlib path', 'symbol lib', 'library', 'schematic lib'
			],

			'library_ref': [
				'library_ref', 'libraryref', 'lib ref', 'libref', 'symbol ref',
				'symbolref', 'component ref', 'componentref', 'ref', 'reference',
				'ссылка библиотека', 'обозначение', 'lib reference', 'symbol reference'
			],

			'footprint_path': [
				'footprint_path', 'footprintpath', 'pcblib', 'pcb_lib', 'pcb lib',
				'pcb library', 'pcb_library', 'package library', 'package_library',
				'footprint lib', 'footprintlib', 'библиотека посадочных мест',
				'pcblib path', 'footprint lib path', 'footprint', 'pcb footprint'
			],

			'footprint_ref': [
				'footprint_ref', 'footprintref', 'fp ref', 'fpref', 'fp reference',
				'fp_reference', 'package ref', 'packageref', 'модель',
				'footprint reference', 'fp reference', 'footprint name', 'package reference'
			],
			'kicad_keywords': [
				'kicad_keywords', 'kicadkeywords', 'kicad keywords', 'kicad keyword',
				'keywords', 'keyword', 'tags', 'search terms', 'search_terms',
				'кикад ключи', 'кикад теги', 'kicad tags', 'kicad search'
			],
			'kicad_fp_filter': [
				'kicad_fp_filter', 'kicadfpfilter', 'kicad fp filter',
				'kicad footprint filter', 'kicad_footprint_filter', 'fp filter',
				'fpfilter', 'footprint filter', 'footprint_filter', 'фильтр footprint',
				'kicad filter', 'fp filter kicad'
			],
			'lifecycle': [
				'lifecycle', 'life_cycle', 'lifecycle_stage', 'lifecyclestage',
				'stage', 'phase', 'продукт', 'жизненный цикл',
				'production', 'obsolete', 'nrnd', 'active', 'preview'
			]
		};

		dbFields.forEach(dbField => {
			if (dbField.type !== 'mapping') return;

			const keywords = rules[dbField.key] || [];
			let bestMatch = null;
			let bestScore = 0;

			selectedFields.forEach(csvField => {
				const csvFieldLower = csvField.toLowerCase().trim();
				let score = 0;

				keywords.forEach(keyword => {
					const keywordLower = keyword.toLowerCase().trim();

					if (csvFieldLower === keywordLower) {
						score = Math.max(score, 100);
					}
					else if (csvFieldLower.includes(keywordLower) && keywordLower.length > 3) {
						score = Math.max(score, 90);
					}
					else if (keywordLower.includes(csvFieldLower) && csvFieldLower.length > 3) {
						score = Math.max(score, 80);
					}
					else {
						const csvWords = csvFieldLower.split(/[\s_\-\.]+/);
						const keywordWords = keywordLower.split(/[\s_\-\.]+/);

						const commonWords = csvWords.filter(word => 
																								keywordWords.includes(word) && word.length > 2
																							 );

						if (commonWords.length > 0) {
							if (commonWords.some(w => ['temp', 'min', 'max'].includes(w))) {
								score = Math.max(score, 85);
							} else {
								score = Math.max(score, 50 + (commonWords.length * 10));
							}
						}
					}
				});

				if (score > bestScore) {
					bestScore = score;
					bestMatch = csvField;
				}
			});

			if (bestMatch && bestScore >= 50) {
				mapping[dbField.key] = bestMatch;
				console.log(`Auto-mapped: ${dbField.key} -> ${bestMatch} (score: ${bestScore})`);
			}
		});

		csvImport.state.mapping = mapping;

		const mappedCount = Object.keys(mapping).length;
		const totalCount = dbFields.filter(f => f.type === 'mapping').length;

		showAlert(`Авто-маппинг выполнен! Замаплено ${mappedCount} из ${totalCount} полей.`, 'success');

		return mapping;
	},

	applyBulkEdit: () => {
		const field = Select1.selectedOptionValue;
		const value = Input1.text;

		// ===== СОХРАНЯЕМ ВЫДЕЛЕНИЕ =====
		const selectedRowsBefore = Table2.selectedRows || [];
		const selectedIds = new Set(selectedRowsBefore.map(r => r._id));

		console.log('=== applyBulkEdit ===');
		console.log('field:', field);
		console.log('value:', value);
		console.log('selectedRows before:', selectedRowsBefore.length);

		if (!field) {
			showAlert('Выберите поле для редактирования', 'warning');
			return;
		}

		if (selectedRowsBefore.length === 0) {
			showAlert('Выберите хотя бы одну строку в таблице (галочки слева)', 'warning');
			return;
		}

		// ===== ПРИМЕНЯЕМ ИЗМЕНЕНИЯ =====
		let updatedCount = 0;
		csvImport.state.previewData = csvImport.state.previewData.map(row => {
			if (selectedIds.has(row._id)) {
				row[field] = value;

				// Сохраняем правку в userEdits
				if (!csvImport.state.userEdits[row._id]) {
					csvImport.state.userEdits[row._id] = {};
				}
				csvImport.state.userEdits[row._id][field] = value;

				// Если изменили value_display, пересчитываем
				if (field === 'value_display') {
					const valueData = csvParser.parseValue(value);
					row.value_number = valueData.number;
					row.value_multiplier = valueData.multiplier;
					row.value_unit = valueData.unit;
					row.value_numeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);

					csvImport.state.userEdits[row._id].value_number = valueData.number;
					csvImport.state.userEdits[row._id].value_multiplier = valueData.multiplier;
					csvImport.state.userEdits[row._id].value_unit = valueData.unit;
					csvImport.state.userEdits[row._id].value_numeric = row.value_numeric;

					if (row.category_name === 'Resistors') {
						row.resistance_ohm = row.value_numeric;
						csvImport.state.userEdits[row._id].resistance_ohm = row.value_numeric;
					} else if (row.category_name === 'Capacitors') {
						row.capacitance_pf = row.value_numeric * 1e12;
						csvImport.state.userEdits[row._id].capacitance_pf = row.capacitance_pf;
					} else if (row.category_name === 'Inductors') {
						row.inductance_uh = row.value_numeric * 1e6;
						csvImport.state.userEdits[row._id].inductance_uh = row.inductance_uh;
					}
				}

				// Если изменили категорию — НЕ трогаем библиотеки (они теперь ручные!)
				// Только обновляем designator если поле не замапплено
				if (field === 'category_name') {
					const categoriesData = getCategories.data || [];
					const category = categoriesData.find(cat => cat.name === value);
					if (category) {
						const designator = category.designator_prefix || 'X';

						// Обновляем altium_designator только если он не был изменён вручную
						if (!csvImport.state.userEdits[row._id]?.altium_designator) {
							row.altium_designator = designator;
							csvImport.state.userEdits[row._id].altium_designator = designator;
						}
					}
				}

				updatedCount++;
			}
			return row;
		});

		console.log('Updated rows:', updatedCount);
		console.log('User edits saved:', csvImport.state.userEdits);

		// ===== ВОССТАНАВЛИВАЕМ ВЫДЕЛЕНИЕ =====
		csvImport.state.previewData = [...csvImport.state.previewData];

		setTimeout(() => {
			selectedRowsBefore.forEach(row => {
				Table2.setSelectedRowIndices(row._id);
			});
			console.log('Selection restored:', selectedRowsBefore.length, 'rows');
		}, 100);

		showAlert(`Применено "${value}" к ${updatedCount} строкам в поле "${field}"`, 'success');
	},

	importAll: async () => {
		const data = csvImport.state.previewData;

		if (data.length === 0) {
			showAlert('Нет данных для импорта', 'warning');
			return;
		}

		// ===== ВАЛИДАЦИЯ =====
		const validationErrors = [];

		data.forEach((row, index) => {
			const rowErrors = [];
			const rowNum = index + 1;

			const categories = getCategories.data || [];
			const selectedCategory = categories.find(cat => cat.name === row.category_name);

			if (!selectedCategory) {
				rowErrors.push('Category Name (не найдена в БД)');
			}

			const isIC = selectedCategory && (
				selectedCategory.name.toLowerCase().includes('ic') ||
				selectedCategory.designator_prefix === 'U'
			);

			if (!row.part_number || String(row.part_number).trim() === '') {
				rowErrors.push('Part Number');
			}

			if (!row.category_name || String(row.category_name).trim() === '') {
				rowErrors.push('Category Name');
			}

			if (!isIC) {
				if (!row.value_number || row.value_number === 0 || row.value_number === '') {
					rowErrors.push('Value');
				}
			}

			if (!row.package || String(row.package).trim() === '') {
				rowErrors.push('Package');
			}

			if (rowErrors.length > 0) {
				validationErrors.push({
					row: rowNum,
					part_number: row.part_number || `(строка ${rowNum})`,
					fields: rowErrors
				});
			}
		});

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

		// ===== ИМПОРТ С ОБРАБОТКОЙ ДУБЛИКАТОВ =====
		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			storeValue('importItem', item);

			try {
				const result = await importComponent.run();

				// Проверяем был ли UPDATE (если id уже существовал)
				if (result && result.length > 0) {
					successCount++;
				}
			} catch (error) {
				errorCount++;
				errors.push(`${item.part_number}: ${error.message}`);
				console.error(`Error:`, { item: item, error: error.message });
			}
		}

		const message = `Импортировано: ${successCount} (включая обновления), ${errorCount} ошибок`;
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
		csvImport.state.userEdits = {};
		csvImport.state._lastAppliedMapping = null;
		storeValue('currentImportTab', 'Выбор полей');
	}
}