export default {
	prepareData: () => {
		const categoryVal = categorySelect.selectedOptionValue;
		const manufacturerVal = manufacturerSelect.selectedOptionValue;
		const packageVal = packageSelect.selectedOptionValue;

		const toleranceVal = toleranceInput.text;
		const voltageVal = voltageInput.text;
		const powerVal = powerRatingInput.text;
		const tempMinVal = tempMinInput.text;
		const tempMaxVal = tempMaxInput.text;

		// Безопасная работа с категориями
		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];

		const selectedCategory = categories.find(cat => cat.id == categoryVal);
		const categoryName = selectedCategory ? selectedCategory.name : '';

		// Безопасная работа с маппингом библиотек
		const mappingsData = getCategoryLibraryMappings.data;
		const mappings = Array.isArray(mappingsData) ? mappingsData : [];

		// Определяем библиотеки по расширению
		const schLibMapping = mappings.find(m => 
																				m.category_id == categoryVal && 
																				m.platform === 'altium' && 
																				m.library_name && m.library_name.endsWith('.SchLib')
																			 );

		const pcbLibMapping = mappings.find(m => 
																				m.category_id == categoryVal && 
																				m.platform === 'altium' && 
																				m.library_name && m.library_name.endsWith('.PcbLib')
																			 );

		// Парсинг значения
		const valueDisplay = formHandlers.buildValueDisplay();
		const parsedValue = componentConstants.parseValueDisplay(valueDisplay);
		const baseValue = csvParser.calculateBaseValue(parsedValue.number, parsedValue.multiplier);

		// Определение специфичного поля
		const specificField = componentConstants.getSpecificFieldByCategory(categoryName);
		const specificFieldValue = specificField ? baseValue : null;

		// Автогенерация FP filter на основе корпуса
		const generateFpFilter = (categoryName, packageName) => {
			const prefixMap = {
				'Resistors': 'R',
				'Capacitors': 'C',
				'Inductors': 'L',
				'Diodes': 'D',
				'LEDs': 'LED'
			};

			const prefix = prefixMap[categoryName] || '';
			return packageName ? `${prefix}*${packageName}*` : '';
		};

		// Автогенерация keywords
		const generateKeywords = (categoryName, packageName, valueDisplay) => {
			return `${categoryName.toLowerCase()} ${packageName} ${valueDisplay}`.trim();
		};

		// ===== ИСПОЛЬЗУЕМ generateFpFilter и generateKeywords =====
		const fpFilter = generateFpFilter(categoryName, packageVal);
		const keywords = generateKeywords(categoryName, packageVal, valueDisplay);

		return {
			part_number: partNumberInput.text?.trim() || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,

			// Универсальные параметры
			value_numeric: baseValue || null,
			value_unit: parsedValue.unit || componentConstants.getUnitByCategory(categoryName),
			value_display: valueDisplay,
			tolerance_percent: (toleranceVal && toleranceVal !== 'null' && toleranceVal !== '') ? parseFloat(toleranceVal) : null,
			voltage_rating_v: (voltageVal && voltageVal !== 'null' && voltageVal !== '') ? parseFloat(voltageVal) : null,
			power_rating_w: (powerVal && powerVal !== 'null' && powerVal !== '') ? parseFloat(powerVal) : null,
			temp_min_c: (tempMinVal && tempMinVal !== 'null' && tempMinVal !== '') ? parseFloat(tempMinVal) : null,
			temp_max_c: (tempMaxVal && tempMaxVal !== 'null' && tempMaxVal !== '') ? parseFloat(tempMaxVal) : null,

			// Специфичные параметры
			resistance_ohm: specificField === 'resistance_ohm' ? specificFieldValue : null,
			capacitance_pf: specificField === 'capacitance_pf' ? specificFieldValue * 1e12 : null,
			inductance_uh: specificField === 'inductance_uh' ? specificFieldValue * 1e6 : null,
			voltage_breakdown_v: specificField === 'voltage_breakdown_v' ? specificFieldValue : null,
			current_rating_a: specificField === 'current_rating_a' ? specificFieldValue : null,

			// Корпус
			package: packageVal || '',

			// Библиотеки - используем schLibMapping и pcbLibMapping
			library_path: schLibMapping ? schLibMapping.library_name : '',
			library_ref: libraryRefInput.text || '',
			footprint_path: pcbLibMapping ? pcbLibMapping.library_name : '',
			footprint_ref: footprintRefInput.text || '',

			// Ссылки
			datasheet_url: datasheetUrlInput.text || '',
			spice_model_path: spiceModelInput.text || '',

			// Altium/KiCad специфичные поля - ИСПОЛЬЗУЕМ сгенерированные значения
			altium_comment: altiumCommentInput.text || '',
			altium_designator: selectedCategory ? selectedCategory.designator_prefix : '',
			kicad_keywords: keywords,  // ← Используем generateKeywords
			kicad_fp_filter: fpFilter  // ← Используем generateFpFilter
		};
	}
}