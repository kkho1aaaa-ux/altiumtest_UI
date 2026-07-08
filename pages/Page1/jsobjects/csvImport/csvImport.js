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
		const allDbFields = [
			{ key: 'part_number', label: 'Part Number', required: false, type: 'mapping' },
			{ key: 'category_name', label: 'Category Name', required: false, type: 'mapping' },
			{ key: 'manufacturer_name', label: 'Manufacturer Name', required: false, type: 'mapping' },
			{ key: 'value_display', label: 'Value Display', required: false, type: 'mapping' },
			{ key: 'tolerance_percent', label: 'Tolerance %', required: false, type: 'mapping' },
			{ key: 'voltage_rating_v', label: 'Voltage Rating (V)', required: false, type: 'mapping' },
			{ key: 'power_rating_w', label: 'Power Rating (W)', required: false, type: 'mapping' },
			{ key: 'temp_min_c', label: 'Temp Min (°C)', required: false, type: 'mapping' },
			{ key: 'temp_max_c', label: 'Temp Max (°C)', required: false, type: 'mapping' },
			{ key: 'package', label: 'Package', required: false, type: 'mapping' },
			{ key: 'package_standard', label: 'Package Standard', required: false, type: 'mapping' },
			{ key: 'library_path', label: 'Library Path (SchLib)', required: false, type: 'mapping' },
			{ key: 'library_ref', label: 'Library Ref', required: false, type: 'mapping' },
			{ key: 'footprint_path', label: 'Footprint Path (PcbLib)', required: false, type: 'mapping' },
			{ key: 'footprint_ref', label: 'Footprint Ref', required: false, type: 'mapping' },
			{ key: 'datasheet_url', label: 'Datasheet URL', required: false, type: 'mapping' },
			{ key: 'spice_model_path', label: 'SPICE Model Path', required: false, type: 'mapping' },
			{ key: 'altium_comment', label: 'Altium Comment', required: false, type: 'mapping' },
			{ key: 'altium_designator', label: 'Altium Designator', required: false, type: 'mapping' },
			{ key: 'kicad_keywords', label: 'KiCad Keywords', required: false, type: 'mapping' },
			{ key: 'kicad_fp_filter', label: 'KiCad FP Filter', required: false, type: 'mapping' },
			{ key: 'lifecycle', label: 'Lifecycle', required: false, type: 'mapping' },
			{ key: 'name', label: 'Name', required: false, type: 'static', default: '' },
			{ key: 'status', label: 'Status', required: false, type: 'static', default: 'active' },
			{ key: 'rohs_compliant', label: 'RoHS Compliant', required: false, type: 'static', default: 'true' }
		];

		this.state.dbFields = allDbFields;
		this.state.mapping = {};
		this.state.staticValues = {};

		allDbFields.forEach(field => {
			if (field.type === 'static') {
				this.state.staticValues[field.key] = field.default || '';
			}
		});

		storeValue('mappingCsvOptions',
							 this.state.selectedFields.map(f => ({ label: f, value: f }))
							);
		storeValue('mappingAllDbFields', allDbFields);
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

		// ===== ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ — ОПРЕДЕЛЯЕМ СРАЗУ! =====
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

		// ===== ОПРЕДЕЛЯЕМ ЧТО ИЗМЕНИЛОСЬ В МАППИНГЕ =====
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

		// ❌ УБРАНЫ специфичные поля из зависимостей
		const dependentFields = {
			'category_name': ['category_id', 'altium_designator'],
			'value_display': ['value_number', 'value_multiplier', 'value_unit', 'value_numeric'],
			'part_number': ['name'],
			'manufacturer_name': ['manufacturer_id']
		};

		const fieldsToUpdate = new Set(changedFields);
		changedFields.forEach(field => {
			if (dependentFields[field]) {
				dependentFields[field].forEach(dep => fieldsToUpdate.add(dep));
			}
		});

		const packagesData = getPackages.data || [];

		// ===== АВТОГЕНЕРАЦИЯ KICAD ПОЛЕЙ =====
		const generateKiCadFields = (categoryName, packageName) => {
			const prefixMap = {
				'Resistors': 'R', 'Capacitors': 'C', 'Inductors': 'L',
				'Diodes': 'D', 'LEDs': 'LED', 'Transistors': 'Q',
				'IC_General': 'U', 'Microcontrollers': 'U', 'Connectors': 'J',
				'Transformers': 'T', 'Relays': 'K', 'Fuses': 'F',
				'Crystals': 'Y', 'Generators': 'Y'
			};
			const prefix = prefixMap[categoryName] || 'X';
			const fpFilter = packageName ? `${prefix}*${packageName}*` : '';
			const keywords = `${categoryName.toLowerCase()} ${packageName}`.trim();
			return { fpFilter, keywords };
		};

		if (this.state.previewData.length === 0) {
			this.state.previewData = this.state.rawData.map((row, index) => {
				const partNumber = getFieldValue(row, mapping.part_number);

				const categoryNameRaw = getFieldValue(row, mapping.category_name) || '';
				const categoryName = componentConstants.getEnglishCategoryName(categoryNameRaw);

				const manufacturerName = getFieldValue(row, mapping.manufacturer_name) || '';
				const valueDisplayRaw = getFieldValue(row, mapping.value_display);

				const valueData = csvParser.parseValue(valueDisplayRaw);
				const valueNumeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);

				const category = categoriesData.find(cat => cat.name === categoryName);
				const categoryId = category ? category.id : null;
				const designator = category?.designator_prefix || 'X';

				const manufacturer = manufacturersData.find(m => m.name === manufacturerName);
				const manufacturerId = manufacturer ? manufacturer.id : null;

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

				const packageRaw = getFieldValue(row, mapping.package) || '';
				const extractedPackage = componentConstants.extractPackage(packageRaw, packagesData);
				const pkg = componentConstants.getStandardPackage(extractedPackage, packagesData);

				const { fpFilter, keywords } = generateKiCadFields(categoryName, pkg);

				// ===== ОТЛАДКА =====
				console.log('=== Library Mapping Debug ===');
				console.log('categoryId:', categoryId);
				console.log('categoryName:', categoryName);
				console.log('mappingsData count:', mappingsData.length);
				console.log('schLibMapping:', schLibMapping);
				console.log('pcbLibMapping:', pcbLibMapping);
				console.log('All mappings for this category:', 
										mappingsData.filter(m => m.category_id === categoryId)
									 );

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
					package: pkg,    // ← ИСПРАВЛЕНО: используем извлечённый pkg
					package_standard: getFieldValue(row, mapping.package_standard) || 'Custom',
					library_path: libraryPath,
					library_ref: libraryRef,
					footprint_path: footprintPath,
					footprint_ref: footprintRef,
					datasheet_url: getFieldValue(row, mapping.datasheet_url) || '',
					spice_model_path: getFieldValue(row, mapping.spice_model_path) || '',
					altium_comment: getFieldValue(row, mapping.altium_comment) || '',
					altium_designator: getFieldValue(row, mapping.altium_designator) || designator,
					kicad_keywords: mapping.kicad_keywords ? getFieldValue(row, mapping.kicad_keywords) : keywords,    // ← ИСПРАВЛЕНО
					kicad_fp_filter: mapping.kicad_fp_filter ? getFieldValue(row, mapping.kicad_fp_filter) : fpFilter,  // ← ИСПРАВЛЕНО
					status: staticValues.status || 'active',
					lifecycle: getFieldValue(row, mapping.lifecycle) || '',
					rohs_compliant: staticValues.rohs_compliant || 'true',
					_selected: false
				};
			});
		} else {
			this.state.previewData = this.state.previewData.map((existingRow, index) => {
				const rawRow = this.state.rawData[index];
				const updatedRow = { ...existingRow };
				const userEditsForRow = this.state.userEdits[index] || {};

				if (fieldsToUpdate.has('category_name')) {
					// ✅ КОНВЕРТАЦИЯ: русское → английское
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
				}

				if (fieldsToUpdate.has('value_display')) {
					updatedRow.value_display = getFieldValue(rawRow, mapping.value_display);
					const valueData = csvParser.parseValue(updatedRow.value_display);
					updatedRow.value_number = valueData.number;
					updatedRow.value_multiplier = valueData.multiplier;
					updatedRow.value_unit = valueData.unit;
					updatedRow.value_numeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);
				}
				// ===== ОБНОВЛЕНИЕ PACKAGE =====
				if (fieldsToUpdate.has('package')) {
					const packageRaw = getFieldValue(rawRow, mapping.package) || '';
					const extractedPackage = componentConstants.extractPackage(packageRaw, packagesData);
					updatedRow.package = componentConstants.getStandardPackage(extractedPackage, packagesData);
				}

				// ===== ОБНОВЛЕНИЕ KICAD ПОЛЕЙ =====
				if (fieldsToUpdate.has('category_name') || fieldsToUpdate.has('package')) {
					const { fpFilter, keywords } = generateKiCadFields(
						updatedRow.category_name,
						updatedRow.package
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

				const simpleFields = [
					'tolerance_percent', 'voltage_rating_v', 'power_rating_w',
					'temp_min_c', 'temp_max_c', 'package', 'package_standard',
					'datasheet_url', 'spice_model_path', 'altium_comment',
					'altium_designator', 'kicad_keywords', 'kicad_fp_filter', 'lifecycle'
				];

				simpleFields.forEach(field => {
					if (fieldsToUpdate.has(field) && mapping[field]) {
						let parsedValue = getFieldValue(rawRow, mapping[field]);
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
			'voltage_rating_v': [
				'voltage', 'voltage_rating', 'rated voltage', 'working voltage',
				'vdc', 'vac', 'напряжение', 'вольтаж'
			],
			'power_rating_w': [
				'power', 'power_rating', 'rated power', 'wattage', 'dissipation',
				'мощность', 'ватт'
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
			'lifecycle': [
				'lifecycle', 'stage', 'phase', 'жизненный цикл'
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

				// ✅ ИСПРАВЛЕНО: при смене категории конвертируем русское → английское
				if (field === 'category_name') {
					const englishName = componentConstants.getEnglishCategoryName(value);
					const categoriesData = getCategories.data || [];
					const category = categoriesData.find(cat => cat.name === englishName);

					if (category) {
						row.category_id = category.id;
						row.category_name = englishName;  // ← Английское для БД
						row.altium_designator = category.designator_prefix || 'X';

						// Обновляем библиотеки
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

						if (!this.state.userEdits[row._id]?.library_path) {
							row.library_path = schLib?.library_name || '';
							this.state.userEdits[row._id].library_path = row.library_path;
						}
						if (!this.state.userEdits[row._id]?.footprint_path) {
							row.footprint_path = pcbLib?.library_name || '';
							this.state.userEdits[row._id].footprint_path = row.footprint_path;
						}
						if (!this.state.userEdits[row._id]?.library_ref) {
							row.library_ref = category.designator_prefix || 'X';
							this.state.userEdits[row._id].library_ref = row.library_ref;
						}
						if (!this.state.userEdits[row._id]?.footprint_ref) {
							row.footprint_ref = category.designator_prefix || 'X';
							this.state.userEdits[row._id].footprint_ref = row.footprint_ref;
						}

						this.state.userEdits[row._id].category_id = category.id;
						this.state.userEdits[row._id].category_name = englishName;
						this.state.userEdits[row._id].altium_designator = category.designator_prefix || 'X';
					}
					// ===== ОБНОВЛЕНИЕ KICAD ПОЛЕЙ =====
					const { fpFilter, keywords } = (() => {
						const prefixMap = {
							'Resistors': 'R', 'Capacitors': 'C', 'Inductors': 'L',
							'Diodes': 'D', 'LEDs': 'LED', 'Transistors': 'Q',
							'IC_General': 'U', 'Microcontrollers': 'U', 'Connectors': 'J'
						};
						const prefix = prefixMap[englishName] || 'X';
						const fpFilter = row.package ? `${prefix}*${row.package}*` : '';
						const keywords = `${englishName.toLowerCase()} ${row.package}`.trim();
						return { fpFilter, keywords };
					})();

					if (!this.state.userEdits[row._id]?.kicad_keywords) {
						row.kicad_keywords = keywords;
						this.state.userEdits[row._id].kicad_keywords = keywords;
					}
					if (!this.state.userEdits[row._id]?.kicad_fp_filter) {
						row.kicad_fp_filter = fpFilter;
						this.state.userEdits[row._id].kicad_fp_filter = fpFilter;
					}
				}

				if (field === 'value_display') {
					const valueData = csvParser.parseValue(value);
					row.value_number = valueData.number;
					row.value_multiplier = valueData.multiplier;
					row.value_unit = valueData.unit;
					row.value_numeric = csvParser.calculateBaseValue(valueData.number, valueData.multiplier);

					this.state.userEdits[row._id].value_number = valueData.number;
					this.state.userEdits[row._id].value_multiplier = valueData.multiplier;
					this.state.userEdits[row._id].value_unit = valueData.unit;
					this.state.userEdits[row._id].value_numeric = row.value_numeric;
				}

				updatedCount++;
			}
			return row;
		});

		this.state.previewData = [...this.state.previewData];

		setTimeout(() => {
			selectedRowsBefore.forEach(row => {
				Table2.setSelectedRowIndices(row._id);
			});
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