export default {
	// Обновление отображаемого номинала
	buildValueDisplay: () => {
		const num = valueNumberInput.value || 0;
		const mult = valueMultiplierSelect.selectedOptionValue || '';
		const unit = valueUnitSelect.selectedOptionValue || '';
		return `${num}${mult}${unit}`;
	},

	// Открытие формы редактирования
	openEditForm: () => {
		if (!Table1.selectedRow || !Table1.selectedRow.id) {
			showAlert('Выберите компонент для редактирования', 'warning');
			return;
		}

		const row = Table1.selectedRow;

		// Text Input
		partNumberInput.setValue(row.part_number);
		toleranceInput.setValue(row.tolerance_percent);
		voltageInput.setValue(row.voltage_rating_v);
		tempMinInput.setValue(row.temp_min_c);
		tempMaxInput.setValue(row.temp_max_c);
		powerRatingInput.setValue(row.power_rating_w);
		libraryPathInput.setValue(row.library_path);
		libraryRefInput.setValue(row.library_ref);
		footprintPathInput.setValue(row.footprint_path);
		footprintRefInput.setValue(row.footprint_ref);
		datasheetUrlInput.setValue(row.datasheet_url);
		spiceModelInput.setValue(row.spice_model_path);
		altiumCommentInput.setValue(row.altium_comment);
		altiumDesignatorInput.setValue(row.altium_designator);
		kicadKeywordsInput.setValue(row.kicad_keywords || '');
		kicadFpFilterInput.setValue(row.kicad_fp_filter || '');

		// Text widget (valueDisplayInput - это Text, не Text Input!)
		valueDisplayInput.setText(row.value_display);

		// Select
		categorySelect.setSelectedOption(row.category_id);
		manufacturerSelect.setSelectedOption(row.manufacturer_id);
		packageSelect.setSelectedOption(row.package);

		// Сохраняем ID в store
		storeValue('editingComponentId', row.id);

		// Открываем модалку
		showModal(modalAddEditComponent.name);
	},

	// Открытие формы добавления (новая)
	openAddForm: () => {
		formLogic.resetForm();
		showModal(modalAddEditComponent.name);
	},

	// Автозаполнение при выборе категории
	onCategoryChange: () => {
		const categoryId = categorySelect.selectedOptionValue;
		const categoryName = categorySelect.selectedOptionLabel?.toLowerCase() || '';

		if (!categoryId) return;

		let libraryPath = '';
		let footprintPath = '';
		let designator = '';

		if (categoryName.includes('capacitor')) {
			libraryPath = 'Passive.SchLib';
			footprintPath = 'Passive.PcbLib';
			designator = 'C';
		} else if (categoryName.includes('resistor')) {
			libraryPath = 'Passive.SchLib';
			footprintPath = 'Passive.PcbLib';
			designator = 'R';
		} else if (categoryName.includes('inductor') || categoryName.includes('inductance')) {
			libraryPath = 'Inductors.SchLib';
			footprintPath = 'Inductors.PcbLib';
			designator = 'L';
		} else if (categoryName.includes('diode')) {
			libraryPath = 'Diodes.SchLib';
			footprintPath = 'Diodes.PcbLib';
			designator = 'D';
		} else if (categoryName.includes('transistor')) {
			libraryPath = 'Transistors.SchLib';
			footprintPath = 'Transistors.PcbLib';
			designator = 'Q';
		} else if (categoryName.includes('ic') || categoryName.includes('microcontroller') || categoryName.includes('mcu')) {
			libraryPath = 'MCU.SchLib';
			footprintPath = 'MCU.PcbLib';
			designator = 'U';
		} else {
			libraryPath = 'Passive.SchLib';
			footprintPath = 'Passive.PcbLib';
			designator = 'X';
		}

		libraryPathInput.setValue(libraryPath);
		footprintPathInput.setValue(footprintPath);
		altiumDesignatorInput.setValue(designator);

		if (designator === 'C' && !libraryRefInput.value) {
			libraryRefInput.setValue('C');
		}
		if (designator === 'R' && !libraryRefInput.value) {
			libraryRefInput.setValue('R');
		}
	}
}