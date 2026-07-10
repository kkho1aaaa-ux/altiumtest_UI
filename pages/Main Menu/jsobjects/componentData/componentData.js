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
		const diodeTypeVal = diodeTypeSelect?.selectedOptionValue;
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
				'Resistors': 'R',
				'Capacitors': 'C',
				'Inductors': 'L',
				'Diodes': 'D',
				'LEDs': 'LED',
				'Transistors': 'Q',
				'ICs': 'U',
				'Connectors': 'J'
			};
			const designator = selectedCategory?.designator_prefix || '';
			let prefix = prefixMap[categoryName] || designator || '';
			return packageName ? `${prefix}*${packageName}*` : '';
		};

		const generateKeywords = (categoryName, packageName, valueDisplay) => {
			return `${categoryName.toLowerCase()} ${packageName} ${valueDisplay}`.trim();
		};

		const fpFilter = generateFpFilter(categoryName, packageVal);
		const keywords = generateKeywords(categoryName, packageVal, valueDisplay);
		const isPolarized = polarizedVal === true || polarizedVal === 'true' || polarizedVal === 1 || polarizedVal === '1';

		// ===== СИНХРОНИЗАЦИЯ НОМИНАЛОВ СО СПЕЦИАЛЬНЫМИ ПОЛЯМИ =====
		let resistance_ohm = null;
		let capacitance_pf = null;
		let inductance_uh = null;

		if (baseValue && parsedValue.unit) {
			const num = parseFloat(baseValue);
			if (!isNaN(num)) {
				if (parsedValue.unit === 'Ω' || parsedValue.unit === 'ohm') {
					resistance_ohm = num;
				} else if (parsedValue.unit === 'F' || parsedValue.unit === 'farad' || parsedValue.unit === 'pF' || parsedValue.unit === 'µF' || parsedValue.unit === 'nF') {
					let pf = num;
					if (parsedValue.unit === 'F') pf = num * 1e12;
					else if (parsedValue.unit === 'µF') pf = num * 1e6;
					else if (parsedValue.unit === 'nF') pf = num * 1e3;
					capacitance_pf = pf;
				} else if (parsedValue.unit === 'H' || parsedValue.unit === 'henry' || parsedValue.unit === 'µH' || parsedValue.unit === 'mH') {
					let uh = num;
					if (parsedValue.unit === 'H') uh = num * 1e6;
					else if (parsedValue.unit === 'mH') uh = num * 1e3;
					inductance_uh = uh;
				}
			}
		}

		return {
			part_number: partNumberInput.text?.trim() || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,
			value_numeric: baseValue || null,
			value_unit: parsedValue.unit || componentConstants.getUnitByCategory(categoryName),
			value_display: valueDisplay,
			resistance_ohm: resistance_ohm,
			capacitance_pf: capacitance_pf,
			inductance_uh: inductance_uh,
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
			diode_type: diodeTypeVal || '',
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