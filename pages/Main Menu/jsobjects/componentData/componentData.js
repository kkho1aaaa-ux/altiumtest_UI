export default {
	prepareData: () => {
		const categoryVal = categorySelect.selectedOptionValue;
		const manufacturerVal = manufacturerSelect.selectedOptionValue;
		const packageVal = packageSelect.selectedOptionValue;

		const toleranceVal = toleranceInput.text;
		const tempMinVal = tempMinInput.text;
		const tempMaxVal = tempMaxInput.text;
		const forwardVoltageVal = forwardVoltageInput.text;
		const reverseVoltageVal = reverseVoltageInput.text;
		const outputVoltageVal = outputVoltageInput.text;
		const dropoutVoltageVal = dropoutVoltageInput.text;
		const pinCountVal = pinCountInput.text;
		const pitchVal = pitchInput.text;
		const qFactorVal = qFactorInput.text;
		const dielectricVal = dielectricSelect.selectedOptionValue;
		const transistorTypeVal = transistorTypeSelect.selectedOptionValue;
		const channelTypeVal = channelTypeSelect.selectedOptionValue;
		const polarizedVal = polarizedCheckbox.isChecked;

		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];
		const selectedCategory = categories.find(cat => cat.id == categoryVal);
		const categoryName = selectedCategory ? selectedCategory.name : '';

		const valueDisplay = formHandlers.buildValueDisplay();
		const parsedValue = componentConstants.parseValueDisplay(valueDisplay);
		const baseValue = csvParser.calculateBaseValue(parsedValue.number, parsedValue.multiplier);

		const parseNumeric = (value) => {
			const parsed = parseFloat(value);
			return Number.isNaN(parsed) ? null : parsed;
		};

		const parseInteger = (value) => {
			const parsed = parseInt(value, 10);
			return Number.isNaN(parsed) ? null : parsed;
		};

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
		const isPolarized = polarizedVal === true || polarizedVal === 'true' || polarizedVal === 1 || polarizedVal === '1';

		return {
			part_number: partNumberInput.text?.trim() || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,
			value_numeric: baseValue || null,
			value_unit: parsedValue.unit || componentConstants.getUnitByCategory(categoryName),
			value_display: valueDisplay,
			tolerance_percent: (toleranceVal && toleranceVal !== 'null' && toleranceVal !== '') ? parseFloat(toleranceVal) : null,
			temp_min_c: (tempMinVal && tempMinVal !== 'null' && tempMinVal !== '') ? parseFloat(tempMinVal) : null,
			temp_max_c: (tempMaxVal && tempMaxVal !== 'null' && tempMaxVal !== '') ? parseFloat(tempMaxVal) : null,
			forward_voltage_v: (forwardVoltageVal && forwardVoltageVal !== 'null' && forwardVoltageVal !== '') ? parseNumeric(forwardVoltageVal) : null,
			reverse_voltage_v: (reverseVoltageVal && reverseVoltageVal !== 'null' && reverseVoltageVal !== '') ? parseNumeric(reverseVoltageVal) : null,
			output_voltage_v: (outputVoltageVal && outputVoltageVal !== 'null' && outputVoltageVal !== '') ? parseNumeric(outputVoltageVal) : null,
			dropout_voltage_v: (dropoutVoltageVal && dropoutVoltageVal !== 'null' && dropoutVoltageVal !== '') ? parseNumeric(dropoutVoltageVal) : null,
			pin_count: (pinCountVal && pinCountVal !== 'null' && pinCountVal !== '') ? parseInteger(pinCountVal) : null,
			pitch_mm: (pitchVal && pitchVal !== 'null' && pitchVal !== '') ? parseNumeric(pitchVal) : null,
			q_factor: (qFactorVal && qFactorVal !== 'null' && qFactorVal !== '') ? parseNumeric(qFactorVal) : null,
			dielectric_type: dielectricVal || '',
			transistor_type: transistorTypeVal || '',
			channel_type: channelTypeVal || '',
			is_polarized: isPolarized,
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