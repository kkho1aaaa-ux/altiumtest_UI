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

		// Получаем данные категории
		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryVal);
		const categoryName = selectedCategory ? selectedCategory.name : '';

		// Получаем маппинг библиотек
		const mappings = getCategoryLibraryMappings.data || [];
		const schLibMapping = mappings.find(m => 
																				m.category_id == categoryVal && 
																				m.platform === 'altium' && 
																				m.library_type === 'symbol'
																			 );
		const pcbLibMapping = mappings.find(m => 
																				m.category_id == categoryVal && 
																				m.platform === 'altium' && 
																				m.library_type === 'footprint'
																			 );

		// Парсим значение
		const valueDisplay = formHandlers.buildValueDisplay();
		const parsedValue = componentConstants.parseValueDisplay(valueDisplay);
		const baseValue = csvParser.calculateBaseValue(parsedValue.number, parsedValue.multiplier);

		// Определяем специфичное поле
		const specificField = componentConstants.getSpecificFieldByCategory(categoryName);
		const specificFieldValue = specificField ? baseValue : null;

		return {
			part_number: partNumberInput.text || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,

			value_number: (valueNumberInput.text && valueNumberInput.text !== 'null' && valueNumberInput.text !== '') ? parseFloat(valueNumberInput.text) : 0,

			value_unit: parsedValue.unit || componentConstants.getUnitByCategory(categoryName),
			value_display: valueDisplay,
			tolerance_percent: (toleranceVal && toleranceVal !== 'null' && toleranceVal !== '') ? parseFloat(toleranceVal) : null,
			voltage_rating_v: (voltageVal && voltageVal !== 'null' && voltageVal !== '') ? parseFloat(voltageVal) : null,
			power_rating_w: (powerVal && powerVal !== 'null' && powerVal !== '') ? parseFloat(powerVal) : null,
			temp_min_c: (tempMinVal && tempMinVal !== 'null' && tempMinVal !== '') ? parseFloat(tempMinVal) : null,
			temp_max_c: (tempMaxVal && tempMaxVal !== 'null' && tempMaxVal !== '') ? parseFloat(tempMaxVal) : null,

			// Специфичные параметры
			resistance_ohm: specificField === 'resistance_ohm' ? specificFieldValue : null,
			capacitance_pf: specificField === 'capacitance_pf' ? specificFieldValue * 1e12 : null, // Переводим в пФ
			inductance_uh: specificField === 'inductance_uh' ? specificFieldValue * 1e6 : null, // Переводим в мкГн
			voltage_breakdown_v: specificField === 'voltage_breakdown_v' ? specificFieldValue : null,
			current_rating_a: specificField === 'current_rating_a' ? specificFieldValue : null,

			// Корпус
			package: packageVal || '',

			// Библиотеки (из category_library_mapping)
			library_path: schLibMapping ? schLibMapping.library_name : '',
			library_ref: libraryRefInput.text || '',
			footprint_path: pcbLibMapping ? pcbLibMapping.library_name : '',
			footprint_ref: footprintRefInput.text || '',

			// Ссылки
			datasheet_url: datasheetUrlInput.text || '',
			spice_model_path: spiceModelInput.text || '',

			// Altium/KiCad специфичные поля
			altium_comment: altiumCommentInput.text || '',
			altium_designator: selectedCategory ? selectedCategory.designator_prefix : '',
			kicad_keywords: kicadKeywordsInput.text || '',
			kicad_fp_filter: kicadFpFilterInput.text || ''
		};
	}
}