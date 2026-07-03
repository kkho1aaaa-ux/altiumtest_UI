export default {
	prepareData: () => {
		const categoryVal = categorySelect.selectedOptionValue;
		const manufacturerVal = manufacturerSelect.selectedOptionValue;
		const packageVal = packageSelect.selectedOptionValue;
		const valueNum = valueNumberInput.text;
		const toleranceVal = toleranceInput.text;
		const voltageVal = voltageInput.text;
		const powerVal = powerRatingInput.text;
		const tempMinVal = tempMinInput.text;
		const tempMaxVal = tempMaxInput.text;

		return {
			part_number: partNumberInput.text || '',
			category_id: (categoryVal && categoryVal !== 'null' && categoryVal !== '') ? parseInt(categoryVal) : null,
			manufacturer_id: (manufacturerVal && manufacturerVal !== 'null' && manufacturerVal !== '') ? parseInt(manufacturerVal) : null,
			value_number: (valueNum && valueNum !== 'null' && valueNum !== '') ? parseFloat(valueNum) : 0,
			value_multiplier: valueMultiplierSelect.selectedOptionValue || '',
			value_unit: valueUnitSelect.selectedOptionValue || '',
			value_display: formHandlers.buildValueDisplay(),
			tolerance_percent: (toleranceVal && toleranceVal !== 'null' && toleranceVal !== '') ? parseFloat(toleranceVal) : null,
			voltage_rating_v: (voltageVal && voltageVal !== 'null' && voltageVal !== '') ? parseFloat(voltageVal) : null,
			power_rating_w: (powerVal && powerVal !== 'null' && powerVal !== '') ? parseFloat(powerVal) : null,
			temp_min_c: (tempMinVal && tempMinVal !== 'null' && tempMinVal !== '') ? parseFloat(tempMinVal) : null,
			temp_max_c: (tempMaxVal && tempMaxVal !== 'null' && tempMaxVal !== '') ? parseFloat(tempMaxVal) : null,
			package: packageVal || '',
			library_path: libraryPathInput.text || '',
			library_ref: libraryRefInput.text || '',
			footprint_path: footprintPathInput.text || '',
			footprint_ref: footprintRefInput.text || '',
			datasheet_url: datasheetUrlInput.text || '',
			spice_model_path: spiceModelInput.text || '',
			altium_comment: altiumCommentInput.text || '',
			altium_designator: altiumDesignatorInput.text || '',
			kicad_keywords: kicadKeywordsInput.text || '',
			kicad_fp_filter: kicadFpFilterInput.text || ''
		};
	}
}