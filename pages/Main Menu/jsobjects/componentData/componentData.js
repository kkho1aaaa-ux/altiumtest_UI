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

		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];
		const selectedCategory = categories.find(cat => cat.id == categoryVal);
		const categoryName = selectedCategory ? selectedCategory.name : '';

		const valueDisplay = formHandlers.buildValueDisplay();
		const parsedValue = componentConstants.parseValueDisplay(valueDisplay);
		const baseValue = csvParser.calculateBaseValue(parsedValue.number, parsedValue.multiplier);

		const generateFpFilter = (categoryName, packageName) => {
			const prefixMap = {
				'Resistors': 'R', 'Capacitors': 'C', 'Inductors': 'L',
				'Diodes': 'D', 'LEDs': 'LED'
			};
			const prefix = prefixMap[categoryName] || '';
			return packageName ? `${prefix}*${packageName}*` : '';
		};

		const generateKeywords = (categoryName, packageName, valueDisplay) => {
			return `${categoryName.toLowerCase()} ${packageName} ${valueDisplay}`.trim();
		};

		const fpFilter = generateFpFilter(categoryName, packageVal);
		const keywords = generateKeywords(categoryName, packageVal, valueDisplay);

		return {
			part_number: partNumberInput.text?.trim() || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,
			value_numeric: baseValue || null,
			value_unit: parsedValue.unit || componentConstants.getUnitByCategory(categoryName),
			value_display: valueDisplay,
			tolerance_percent: (toleranceVal && toleranceVal !== 'null' && toleranceVal !== '') ? parseFloat(toleranceVal) : null,
			voltage_rating_v: (voltageVal && voltageVal !== 'null' && voltageVal !== '') ? parseFloat(voltageVal) : null,
			power_rating_w: (powerVal && powerVal !== 'null' && powerVal !== '') ? parseFloat(powerVal) : null,
			temp_min_c: (tempMinVal && tempMinVal !== 'null' && tempMinVal !== '') ? parseFloat(tempMinVal) : null,
			temp_max_c: (tempMaxVal && tempMaxVal !== 'null' && tempMaxVal !== '') ? parseFloat(tempMaxVal) : null,
			package: packageVal || '',
			package_standard: 'Custom',
			library_path: libraryPathInput.text || '',
			library_ref: libraryRefInput.text || '',
			footprint_path: footprintPathInput.text || '',
			footprint_ref: footprintRefInput.text || '',
			datasheet_url: datasheetUrlInput.text || '',
			spice_model_path: spiceModelInput.text || '',
			altium_comment: altiumCommentInput.text || '',
			altium_designator: selectedCategory ? selectedCategory.designator_prefix : '',
			kicad_keywords: keywords,
			kicad_fp_filter: fpFilter
		};
	}
}