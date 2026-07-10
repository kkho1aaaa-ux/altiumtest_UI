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
			} else if (typeof fileContent === 'string') {
				const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
				if (lines.length === 0) {
					showAlert('Файл пуст', 'warning');
					return { success: false, error: 'Empty file' };
				}
				headers = this.parseCSVLine(lines[0]);
				for (let i = 1; i < lines.length; i++) {
					const values = this.parseCSVLine(lines[i]);
					if (values.length === headers.length) {
						const row = {};
						headers.forEach((header, idx) => {
							row[header] = values[idx] || '';
						});
						rows.push(row);
					}
				}
			} else {
				showAlert('Неподдерживаемый формат файла', 'error');
				return { success: false, error: 'Unsupported format' };
			}

			if (rows.length === 0) {
				showAlert('Файл не содержит данных', 'warning');
				return { success: false, error: 'No data' };
			}

			this.state.rawData = rows;
			this.state.headers = headers;
			this.state.selectedFields = headers;
			this.state.mapping = {};
			this.state.previewData = [];
			this.state.userEdits = {};

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

		this.state.selectedFields = selected;
		this.buildMappingUI();
		storeValue('currentImportTab', 'Маппинг');
		return true;
	},

	buildMappingUI: () => {
		const columnsData = getComponentColumns.data || [];
		const allKeys = columnsData.map(row => row.column_name);

		const excludedKeys = [
			'category_name_ru',
			'value_number',
			'category_id',
			'manufacturer_id',
			'value_numeric',
			'value_unit',
			'altium_comment',
			'altium_designator',
			'kicad_keywords',
			'kicad_fp_filter',
			'voltage_rating_v',
			'power_rating_w',
			'operating_temp_min_c',
			'operating_temp_max_c'
		];

		const requiredKeys = ['part_number'];

		const allDbFields = allKeys
		.filter(key => !excludedKeys.includes(key))
		.map(key => ({
			key: key,
			label: key
			.replace(/_/g, ' ')
			.replace(/\b\w/g, l => l.toUpperCase()),
			required: requiredKeys.includes(key),
			type: 'mapping'
		}));

		this.state.dbFields = allDbFields;
		this.state.mapping = {};
		this.state.staticValues = {};

		storeValue('mappingCsvOptions',
							 this.state.selectedFields.map(f => ({ label: f, value: f }))
							);
		storeValue('mappingAllDbFields', allDbFields);

		console.log('buildMappingUI: fields count =', allDbFields.length);
		console.log('buildMappingUI: fields =', allDbFields.map(f => f.key));
	},

	saveMapping: (dbKey, csvField) => {
		if (csvField && csvField !== '') {
			this.state.mapping[dbKey] = csvField;
		} else {
			delete this.state.mapping[dbKey];
		}
	},

	saveStaticValue: (key, value) => {
		this.state.staticValues[key] = value;
	},

	applyMapping: () => {
		const mapping = this.state.mapping;
		const staticValues = this.state.staticValues;

		if (!mapping.part_number) {
			showAlert('Не замаплено обязательное поле: Part Number', 'warning');
			return false;
		}

		const getFieldValue = (row, fieldName) => {
			if (!fieldName) return '';
			let value = row[fieldName];
			if (value === undefined || value === null) {
				const normalizedFieldName = fieldName.trim();
				const matchingKey = Object.keys(row).find(key =>
																									key.trim().toLowerCase() === normalizedFieldName.toLowerCase()
																								 );
				if (matchingKey) value = row[matchingKey];
			}
			return value !== undefined && value !== null ? String(value).trim() : '';
		};

		const previousMapping = this.state._lastAppliedMapping || {};
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

		if (changedFields.length === 0 && this.state.previewData.length > 0) {
			return true;
		}

		const categoriesData = getCategories.data || [];
		const manufacturersData = getManufacturers.data || [];
		const mappingsData = getCategoryLibraryMappings.data || [];

		const dependentFields = {
			'category_name': ['category_id', 'altium_designator'],
			'value_display': ['value_unit', 'value_numeric'],
			'manufacturer_name': ['manufacturer_id']
		};

		const fieldsToUpdate = new Set(changedFields);
		changedFields.forEach(field => {
			if (dependentFields[field]) {
				dependentFields[field].forEach(dep => fieldsToUpdate.add(dep));
			}
		});

		const packagesData = getPackages.data || [];

		// ===== ИСПРАВЛЕННАЯ ГЕНЕРАЦИЯ KICAD ПОЛЕЙ =====
		const generateKiCadFields = (categoryName, packageName, designator) => {
			const prefixMap = {
				'Resistors': 'R', 'Capacitors': 'C', 'Inductors': 'L',
				'Diodes': 'D', 'LEDs': 'LED', 'Transistors': 'Q',
				'IC_General': 'U', 'Microcontrollers': 'U', 'Power_Management': 'U',
				'Data_Converters': 'U', 'Linear': 'U', 'Logic': 'U',
				'Memory': 'U', 'FPGA': 'U',
				'Connectors': 'J', 'Transformers': 'T', 'Relays': 'K',
				'Fuses': 'F', 'Crystals': 'Y', 'Generators': 'X',
				'Crystals_Passive': 'Y', 'Ferrites': 'FB',
				'Thyristors': 'TH', 'Optocouplers': 'U', 'Displays': 'DS',
				'Switches': 'S'
			};

			// Используем categoryName, если есть, иначе designator
			let prefix = prefixMap[categoryName];
			if (!prefix && designator) {
				prefix = designator;
			}
			if (!prefix) {
				prefix = 'X';
			}

			const fpFilter = packageName ? `${prefix}*${packageName}*` : '';
			const keywords = categoryName ? `${categoryName.toLowerCase()} ${packageName || ''}`.trim() : '';
			return { fpFilter, keywords };
		};

		if (this.state.previewData.length === 0) {
			this.state.previewData = this.state.rawData.map((row, index) => {
				const result = {
					_id: index,
					_selected: false,
					// ===== ДОБАВЛЕНО: Инициализация по умолчанию =====
					is_polarized: false,
					kicad_keywords: '',
					kicad_fp_filter: '',
					category_id: null,
					manufacturer_id: null,
					value_numeric: null,
					value_unit: '',
					package_standard: 'Custom'
				};

				// Копируем все замапленные поля из CSV
				this.state.dbFields.forEach(field => {
					if (field.type === 'mapping' && this.state.mapping[field.key]) {
						result[field.key] = getFieldValue(row, this.state.mapping[field.key]);
					}
				});

				// ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА: Category =====
				const categoryNameRaw = result.category_name || '';
				const categoryName = componentConstants.getEnglishCategoryName(categoryNameRaw);
				result.category_name = categoryName;

				const category = categoriesData.find(cat => cat.name === categoryName);
				const categoryId = category ? category.id : null;
				const designator = category?.designator_prefix || 'X';
				result.category_id = categoryId;

				// ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА: Manufacturer =====
				const manufacturerName = result.manufacturer_name || '';
				const manufacturer = manufacturersData.find(m => m.name === manufacturerName);
				result.manufacturer_id = manufacturer ? manufacturer.id : null;

				// ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА: Value =====
				const valueDisplayRaw = result.value_display || '';
				const valueData = csvParser.parseValue(valueDisplayRaw);
				result.value_numeric = valueData.number;
				result.value_unit = valueData.unit || componentConstants.getUnitByCategory(categoryName);

				// ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА: Package =====
				const packageRaw = result.package || '';
				const extractedPackage = componentConstants.extractPackage(packageRaw, packagesData);
				result.package = componentConstants.getStandardPackage(extractedPackage, packagesData);
				if (!result.package_standard) result.package_standard = 'Custom';

				// ===== СПЕЦИАЛЬНАЯ ОБРАБОТКА: Библиотеки =====
				const schLibMapping = mappingsData.find(m =>
																								m.category_id === categoryId &&
																								m.platform === 'altium' &&
																								m.library_name?.endsWith('.SchLib')
																							 );
				const pcbLibMapping = mappingsData.find(m =>
																								m.category_id === categoryId &&
																								m.platform === 'altium' &&
																								m.library_name?.endsWith('.PcbLib')
																							 );

				if (!this.state.mapping.library_path) {
					result.library_path = schLibMapping?.library_name || '';
				}
				if (!this.state.mapping.library_ref) {
					result.library_ref = designator;
				}
				if (!this.state.mapping.footprint_path) {
					result.footprint_path = pcbLibMapping?.library_name || '';
				}
				if (!this.state.mapping.footprint_ref) {
					result.footprint_ref = designator;
				}
				if (!this.state.mapping.altium_designator) {
					result.altium_designator = designator;
				}

				// ===== ИСПРАВЛЕНО: Передаём designator как fallback =====
				const { fpFilter, keywords } = generateKiCadFields(categoryName, result.package, designator);
				if (!this.state.mapping.kicad_keywords) {
					result.kicad_keywords = keywords;
				}
				if (!this.state.mapping.kicad_fp_filter) {
					result.kicad_fp_filter = fpFilter;
				}

				// ===== ПАРСИНГ ЧИСЛОВЫХ ПОЛЕЙ =====
				if (result.tolerance_percent) {
					result.tolerance_percent = csvParser.parseTolerance(result.tolerance_percent);
				}
				if (result.temp_min_c) {
					result.temp_min_c = csvParser.parseTemperature(result.temp_min_c);
				}
				if (result.temp_max_c) {
					result.temp_max_c = csvParser.parseTemperature(result.temp_max_c);
				}
				if (result.inductance_uh) {
					result.inductance_uh = parseFloat(result.inductance_uh) || null;
				}
				if (result.q_factor) {
					result.q_factor = parseFloat(result.q_factor) || null;
				}
				if (result.forward_voltage_v) {
					result.forward_voltage_v = parseFloat(result.forward_voltage_v) || null;
				}
				if (result.reverse_voltage_v) {
					result.reverse_voltage_v = parseFloat(result.reverse_voltage_v) || null;
				}
				if (result.output_voltage_v) {
					result.output_voltage_v = parseFloat(result.output_voltage_v) || null;
				}
				if (result.dropout_voltage_v) {
					result.dropout_voltage_v = parseFloat(result.dropout_voltage_v) || null;
				}
				if (result.pin_count) {
					result.pin_count = parseInt(result.pin_count) || null;
				}
				if (result.pitch_mm) {
					result.pitch_mm = parseFloat(result.pitch_mm) || null;
				}

				// ===== ИСПРАВЛЕНО: Всегда инициализируем is_polarized =====
				if (result.is_polarized !== undefined && result.is_polarized !== null && result.is_polarized !== '') {
					const polarizedStr = String(result.is_polarized).toLowerCase().trim();
					result.is_polarized = polarizedStr === 'true' || polarizedStr === '1' || polarizedStr === 'yes' || polarizedStr === 'да';
				} else {
					result.is_polarized = false;
				}

				return result;
			});
		} else {
			this.state.previewData = this.state.previewData.map((existingRow, index) => {
				const rawRow = this.state.rawData[index];
				const updatedRow = { ...existingRow };
				const userEditsForRow = this.state.userEdits[index] || {};

				if (fieldsToUpdate.has('category_name')) {
					const categoryNameRaw = getFieldValue(rawRow, mapping.category_name) || '';
					const categoryName = componentConstants.getEnglishCategoryName(categoryNameRaw);

					updatedRow.category_name = categoryName;

					const category = categoriesData.find(cat => cat.name === categoryName);
					updatedRow.category_id = category ? category.id : null;
					const designator = category?.designator_prefix || 'X';

					if (!userEditsForRow.category_name) {
						userEditsForRow.category_name = categoryName;
					}
					if (!userEditsForRow.category_id) {
						userEditsForRow.category_id = updatedRow.category_id;
					}

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

					if (!userEditsForRow.altium_designator) {
						updatedRow.altium_designator = getFieldValue(rawRow, mapping.altium_designator) || designator;
					}

					// ===== ИСПРАВЛЕНО: Обновляем KiCad поля при смене категории =====
					if (!userEditsForRow.kicad_keywords && !mapping.kicad_keywords) {
						const { keywords } = generateKiCadFields(categoryName, updatedRow.package, designator);
						updatedRow.kicad_keywords = keywords;
					}
					if (!userEditsForRow.kicad_fp_filter && !mapping.kicad_fp_filter) {
						const { fpFilter } = generateKiCadFields(categoryName, updatedRow.package, designator);
						updatedRow.kicad_fp_filter = fpFilter;
					}
				}

				if (fieldsToUpdate.has('value_display')) {
					const valueData = csvParser.parseValue(updatedRow.value_display);
					updatedRow.value_unit = valueData.unit;

					if (!this.state.mapping.value_numeric) {
						updatedRow.value_numeric = valueData.number;
					}
				}

				if (fieldsToUpdate.has('value_numeric')) {
					updatedRow.value_numeric = parseFloat(updatedRow.value_numeric) || null;
				}

				if (fieldsToUpdate.has('package')) {
					const packageRaw = getFieldValue(rawRow, mapping.package) || '';
					const extractedPackage = componentConstants.extractPackage(packageRaw, packagesData);
					updatedRow.package = componentConstants.getStandardPackage(extractedPackage, packagesData);
				}

				if (fieldsToUpdate.has('category_name') || fieldsToUpdate.has('package')) {
					const category = categoriesData.find(cat => cat.name === updatedRow.category_name);
					const designator = category?.designator_prefix || 'X';
					const { fpFilter, keywords } = generateKiCadFields(
						updatedRow.category_name,
						updatedRow.package,
						designator
					);
					if (!userEditsForRow.kicad_keywords) {
						updatedRow.kicad_keywords = keywords;
					}
					if (!userEditsForRow.kicad_fp_filter) {
						updatedRow.kicad_fp_filter = fpFilter;
					}
				}

				const libraryFields = ['library_path', 'library_ref', 'footprint_path', 'footprint_ref'];
				libraryFields.forEach(field => {
					if (fieldsToUpdate.has(field) && mapping[field]) {
						updatedRow[field] = getFieldValue(rawRow, mapping[field]);
					}
				});

				// ===== ИСПРАВЛЕНО: Добавлен is_polarized =====
				const simpleFields = [
					'tolerance_percent',
					'temp_min_c', 'temp_max_c', 'package', 'package_standard',
					'datasheet_url', 'spice_model_path',
					'altium_comment',
					'altium_designator', 'kicad_keywords', 'kicad_fp_filter',
					'inductance_uh', 'q_factor',
					'forward_voltage_v', 'reverse_voltage_v',
					'output_voltage_v', 'dropout_voltage_v',
					'pin_count', 'pitch_mm',
					'dielectric_type', 'diode_type', 'transistor_type', 'channel_type',
					'is_polarized'
				];

				simpleFields.forEach(field => {
					if (fieldsToUpdate.has(field) && mapping[field]) {
						let parsedValue = getFieldValue(rawRow, mapping[field]);
						if (field === 'tolerance_percent') parsedValue = csvParser.parseTolerance(parsedValue);
						else if (field === 'temp_min_c' || field === 'temp_max_c') parsedValue = csvParser.parseTemperature(parsedValue);
						else if (field === 'package_standard') parsedValue = parsedValue || 'Custom';
						else if (field === 'inductance_uh' || field === 'q_factor' || 
										 field === 'forward_voltage_v' || field === 'reverse_voltage_v' ||
										 field === 'output_voltage_v' || field === 'dropout_voltage_v' ||
										 field === 'pitch_mm') {
							parsedValue = parseFloat(parsedValue) || null;
						}
						else if (field === 'pin_count') {
							parsedValue = parseInt(parsedValue) || null;
						}
						else if (field === 'is_polarized') {
							const polarizedStr = String(parsedValue).toLowerCase().trim();
							parsedValue = polarizedStr === 'true' || polarizedStr === '1' || polarizedStr === 'yes' || polarizedStr === 'да';
						}
						updatedRow[field] = parsedValue;
					}
				});

				return updatedRow;
			});
		}

		this.state._lastAppliedMapping = JSON.parse(JSON.stringify(mapping));

		const invalidRows = this.state.previewData.filter(r => !r.part_number);
		if (invalidRows.length > 0) {
			showAlert(`Warning: ${invalidRows.length} строк без part_number!`, 'warning');
		}

		return true;
	},

	autoMap: () => {
		const mapping = {};
		const selectedFields = this.state.selectedFields;
		const dbFields = this.state.dbFields;

		const rules = {
			'part_number': [
				'part_number', 'partnumber', 'part number', 'part num', 'part num.',
				'part no', 'part no.', 'part#', 'part-number', 'p/n', 'pn',
				'base pn', 'base_pn', 'base part number', 'display pn', 'display_pn',
				'display/base pn', 'mpn', 'manufacturer pn', 'sku', 'article',
				'арт', 'артикул', 'номер детали', 'номер компонента'
			],
			'manufacturer_name': [
				'manufacturer', 'manufacturer_name', 'manufacturer name',
				'mfg', 'mfr', 'vendor', 'producer', 'company', 'make', 'brand',
				'производитель', 'бренд', 'фирма', 'изготовитель'
			],
			'category_name': [
				'category', 'category_name', 'cat', 'type', 'class', 'family', 'group',
				'категория', 'тип', 'класс', 'семейство', 'группа'
			],
			'value_display': [
				'value', 'value_display', 'nominal', 'rating',
				'capacitance', 'resistance', 'inductance',
				'емкость', 'сопротивление', 'индуктивность', 'номинал', 'значение'
			],
			'tolerance_percent': [
				'tolerance', 'tol', 'accuracy', 'precision', 'допуск', 'точность',
				'tolerance %', 'tol %'
			],
			'temp_min_c': [
				'temp. min.', 'temp. min', 'temp min.', 'temp min',
				'min. temp.', 'min. temp', 'min temp.', 'min temp',
				'temp_min', 'temperature min', 'температура мин'
			],
			'temp_max_c': [
				'temp. max.', 'temp. max', 'temp max.', 'temp max',
				'max. temp.', 'max. temp', 'max temp.', 'max temp',
				'temp_max', 'temperature max', 'температура макс'
			],
			'package': [
				'package', 'pkg', 'case', 'footprint', 'корпус', 'упаковка'
			],
			'package_standard': [
				'package_standard', 'standard', 'package standard', 'стандарт'
			],
			'library_path': [
				'library_path', 'librarypath', 'schlib', 'sch_lib',
				'schematic library', 'symbol library', 'lib path', 'библиотека схем'
			],
			'library_ref': [
				'library_ref', 'libraryref', 'lib ref', 'libref',
				'symbol ref', 'component ref', 'ref', 'reference'
			],
			'footprint_path': [
				'footprint_path', 'footprintpath', 'pcblib', 'pcb_lib',
				'pcb library', 'footprint lib', 'библиотека посадочных мест'
			],
			'footprint_ref': [
				'footprint_ref', 'footprintref', 'fp ref', 'fpref',
				'fp reference', 'footprint reference'
			],
			'datasheet_url': [
				'datasheet', 'datasheet_url', 'datasheet link', 'doc url',
				'даташит', 'спецификация', 'документация'
			],
			'spice_model_path': [
				'spice', 'spice_model', 'spice model', 'simulation model',
				'модель spice', 'spice модель'
			],
			'altium_comment': [
				'altium_comment', 'comment', 'altium desc', 'комментарий altium'
			],
			'altium_designator': [
				'altium_designator', 'designator', 'des', 'ref des', 'refdes',
				'reference designator', 'обозначение'
			],
			'kicad_keywords': [
				'kicad_keywords', 'keywords', 'tags', 'кикад ключи', 'кикад теги'
			],
			'kicad_fp_filter': [
				'kicad_fp_filter', 'fp filter', 'footprint filter', 'фильтр footprint'
			],
			'dielectric_type': [
				'dielectric', 'dielectric_type', 'dielectric type', 'диэлектрик', 'тип диэлектрика'
			],
			'inductance_uh': [
				'inductance', 'inductance_uh', 'inductance value', 'индуктивность'
			],
			'q_factor': [
				'q_factor', 'q factor', 'quality factor', 'добротность'
			],
			'diode_type': [
				'diode_type', 'diode type', 'тип диода'
			],
			'forward_voltage_v': [
				'forward_voltage', 'forward voltage', 'vf', 'прямое напряжение'
			],
			'reverse_voltage_v': [
				'reverse_voltage', 'reverse voltage', 'vr', 'обратное напряжение'
			],
			'transistor_type': [
				'transistor_type', 'transistor type', 'тип транзистора'
			],
			'channel_type': [
				'channel', 'channel_type', 'channel type', 'канал', 'тип канала'
			],
			'output_voltage_v': [
				'output_voltage', 'output voltage', 'vout', 'выходное напряжение'
			],
			'dropout_voltage_v': [
				'dropout_voltage', 'dropout voltage', 'dropout', 'напряжение падения'
			],
			'pin_count': [
				'pin_count', 'pin count', 'pins', 'количество контактов', 'пины'
			],
			'pitch_mm': [
				'pitch', 'pitch_mm', 'step', 'шаг', 'шаг контактов'
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
					} else if (csvFieldLower.includes(keywordLower) && keywordLower.length > 3) {
						score = Math.max(score, 90);
					} else if (keywordLower.includes(csvFieldLower) && csvFieldLower.length > 3) {
						score = Math.max(score, 80);
					} else {
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
			}
		});

		this.state.mapping = mapping;

		const mappedCount = Object.keys(mapping).length;
		const totalCount = dbFields.filter(f => f.type === 'mapping').length;

		showAlert(`Авто-маппинг выполнен! Замаплено ${mappedCount} из ${totalCount} полей.`, 'success');
		return mapping;
	},

	applyBulkEdit: () => {
		const field = Select1.selectedOptionValue;
		const value = Input1.text;

		const selectedRowsBefore = Table2.selectedRows || [];
		const selectedIds = new Set(selectedRowsBefore.map(r => r._id));

		if (!field) {
			showAlert('Выберите поле для редактирования', 'warning');
			return;
		}

		if (selectedRowsBefore.length === 0) {
			showAlert('Выберите хотя бы одну строку в таблице', 'warning');
			return;
		}

		let updatedCount = 0;
		this.state.previewData = this.state.previewData.map(row => {
			if (selectedIds.has(row._id)) {
				row[field] = value;

				if (!this.state.userEdits[row._id]) {
					this.state.userEdits[row._id] = {};
				}
				this.state.userEdits[row._id][field] = value;

				if (field === 'category_name') {
					const englishName = componentConstants.getEnglishCategoryName(value);
					const categoriesData = getCategories.data || [];
					const category = categoriesData.find(cat => cat.name === englishName);

					if (category) {
						row.category_id = category.id;
						row.category_name = englishName;
						row.altium_designator = category.designator_prefix || 'X';

						const mappingsData = getCategoryLibraryMappings.data || [];
						const schLib = mappingsData.find(m =>
																						 m.category_id === category.id &&
																						 m.platform === 'altium' &&
																						 m.library_name?.endsWith('.SchLib')
																						);
						const pcbLib = mappingsData.find(m =>
																						 m.category_id === category.id &&
																						 m.platform === 'altium' &&
																						 m.library_name?.endsWith('.PcbLib')
																						);

						if (!this.state.userEdits[row._id].library_path) {
							row.library_path = schLib?.library_name || '';
							this.state.userEdits[row._id].library_path = row.library_path;
						}
						if (!this.state.userEdits[row._id].footprint_path) {
							row.footprint_path = pcbLib?.library_name || '';
							this.state.userEdits[row._id].footprint_path = row.footprint_path;
						}
						if (!this.state.userEdits[row._id].library_ref) {
							row.library_ref = category.designator_prefix || 'X';
							this.state.userEdits[row._id].library_ref = row.library_ref;
						}
						if (!this.state.userEdits[row._id].footprint_ref) {
							row.footprint_ref = category.designator_prefix || 'X';
							this.state.userEdits[row._id].footprint_ref = row.footprint_ref;
						}

						this.state.userEdits[row._id].category_id = category.id;
						this.state.userEdits[row._id].category_name = englishName;
						this.state.userEdits[row._id].altium_designator = category.designator_prefix || 'X';

						// ===== ДОБАВЛЕНО: Обновляем KiCad поля при смене категории =====
						const prefixMap = {
							'Resistors': 'R', 'Capacitors': 'C', 'Inductors': 'L',
							'Diodes': 'D', 'LEDs': 'LED', 'Transistors': 'Q',
							'IC_General': 'U', 'Microcontrollers': 'U', 'Power_Management': 'U',
							'Data_Converters': 'U', 'Linear': 'U', 'Logic': 'U',
							'Memory': 'U', 'FPGA': 'U',
							'Connectors': 'J', 'Transformers': 'T', 'Relays': 'K',
							'Fuses': 'F', 'Crystals': 'Y', 'Generators': 'X',
							'Crystals_Passive': 'Y', 'Ferrites': 'FB',
							'Thyristors': 'TH', 'Optocouplers': 'U', 'Displays': 'DS',
							'Switches': 'S'
						};

						const designator = category.designator_prefix || 'X';
						let prefix = prefixMap[englishName] || designator || 'X';
						const packageName = row.package || '';

						if (!this.state.userEdits[row._id].kicad_fp_filter) {
							row.kicad_fp_filter = packageName ? `${prefix}*${packageName}*` : '';
							this.state.userEdits[row._id].kicad_fp_filter = row.kicad_fp_filter;
						}
						if (!this.state.userEdits[row._id].kicad_keywords) {
							row.kicad_keywords = `${englishName.toLowerCase()} ${packageName}`.trim();
							this.state.userEdits[row._id].kicad_keywords = row.kicad_keywords;
						}
					}
				}
				if (field === 'value_display') {
					const valueData = csvParser.parseValue(value);
					row.value_unit = valueData.unit;
					row.value_numeric = valueData.number;

					this.state.userEdits[row._id].value_unit = valueData.unit;
					this.state.userEdits[row._id].value_numeric = row.value_numeric;
				}

				updatedCount++;
			}
			return row;
		});

		this.state.previewData = [...this.state.previewData];

		setTimeout(() => {
			const indices = selectedRowsBefore.map(r => r._id);
			Table2.setSelectedRowIndices(indices);
		}, 100);

		showAlert(`Применено "${value}" к ${updatedCount} строкам в поле "${field}"`, 'success');
	},

	importAll: async () => {
		const data = this.state.previewData;

		if (data.length === 0) {
			showAlert('Нет данных для импорта', 'warning');
			return;
		}

		const validationErrors = [];

		data.forEach((row, index) => {
			const rowErrors = [];
			const rowNum = index + 1;

			const categories = getCategories.data || [];
			const selectedCategory = categories.find(cat => cat.name === row.category_name);

			if (!selectedCategory) {
				rowErrors.push('Category Name (не найдена в БД)');
			}

			const isPassive = selectedCategory && ['R', 'C', 'L'].includes(selectedCategory.designator_prefix);

			if (!row.part_number || String(row.part_number).trim() === '') {
				rowErrors.push('Part Number');
			}

			if (!row.category_name || String(row.category_name).trim() === '') {
				rowErrors.push('Category Name');
			}

			if (isPassive) {
				const hasValue = (row.value_numeric !== null && row.value_numeric !== undefined && row.value_numeric !== 0) ||
							(row.value_display && String(row.value_display).trim() !== '');
				if (!hasValue) {
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

			console.error('Validation errors:', JSON.stringify(validationErrors, null, 2));

			showAlert(errorMessage, 'error');
			return;
		}

		let successCount = 0;
		let errorCount = 0;
		const errors = [];

		for (let i = 0; i < data.length; i++) {
			const item = data[i];
			storeValue('importItem', item);

			try {
				const result = await importComponent.run();
				if (result && result.length > 0) {
					successCount++;
				}
			} catch (error) {
				errorCount++;
				errors.push(`${item.part_number}: ${error.message}`);
			}
		}

		const message = `Импортировано: ${successCount} (включая обновления), ${errorCount} ошибок`;
		showAlert(message, errorCount > 0 ? 'warning' : 'success');

		closeModal('modalCSVImport');
		await getAllComponents.run();
	},

	reset: () => {
		this.state.rawData = [];
		this.state.headers = [];
		this.state.selectedFields = [];
		this.state.mapping = {};
		this.state.previewData = [];
		this.state.staticValues = {};
		this.state.userEdits = {};
		this.state._lastAppliedMapping = null;
		storeValue('currentImportTab', 'Выбор полей');
	}
}