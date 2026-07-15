export default {
	// ===== НОВЫЕ ФУНКЦИИ ДЛЯ УПРАВЛЕНИЯ UI =====

	getComponentType: () => {
		const categoryId = categorySelect?.selectedOptionValue;
		if (!categoryId) return 'unknown';

		const categories = getCategories.data || [];
		const category = categories.find(c => c.id == categoryId);
		const prefix = category?.designator_prefix || '';

		if (['R', 'C', 'L'].includes(prefix)) return 'passive';
		if (prefix === 'D' || prefix === 'LED') return 'diode';
		if (prefix === 'Q') return 'transistor';
		if (prefix === 'U') return 'ic';
		if (prefix === 'J') return 'connector';

		return 'other';
	},

	getDesignatorPrefix: () => {
		const categoryId = categorySelect?.selectedOptionValue;
		if (!categoryId) return '';
		const categories = getCategories.data || [];
		const category = categories.find(c => c.id == categoryId);
		return category?.designator_prefix || '';
	},

	isNominalDisabled: () => {
		return formHandlers.getComponentType() !== 'passive';
	},

	isToleranceDisabled: () => {
		return formHandlers.getComponentType() !== 'passive';
	},

	isCapacitor: () => formHandlers.getDesignatorPrefix() === 'C',
	isInductor: () => formHandlers.getDesignatorPrefix() === 'L',
	isDiode: () => formHandlers.getComponentType() === 'diode',
	isTransistor: () => formHandlers.getComponentType() === 'transistor',
	isIC: () => formHandlers.getComponentType() === 'ic',
	isConnector: () => formHandlers.getComponentType() === 'connector',

	getSpecTabLabel: () => {
		const type = formHandlers.getComponentType();
		const labels = {
			'passive': 'Спец поля',
			'diode': 'Параметры диода',
			'transistor': 'Параметры транзистора',
			'ic': 'Параметры ИС',
			'connector': 'Параметры разъёма',
			'unknown': 'Спец поля'
		};
		return labels[type] || 'Спец поля';
	},

	clearSpecFields: () => {
		if (typeof dielectricSelect !== 'undefined') dielectricSelect.setSelectedOption('');
		if (typeof polarizedCheckbox !== 'undefined') {
			if (typeof polarizedCheckbox.setValue === 'function') {
				polarizedCheckbox.setValue(false);
			}
		}
		if (typeof qFactorInput !== 'undefined') qFactorInput.setValue('');
		if (typeof forwardVoltageInput !== 'undefined') forwardVoltageInput.setValue('');
		if (typeof reverseVoltageInput !== 'undefined') reverseVoltageInput.setValue('');
		if (typeof transistorTypeSelect !== 'undefined') transistorTypeSelect.setSelectedOption('');
		if (typeof channelTypeSelect !== 'undefined') channelTypeSelect.setSelectedOption('');
		if (typeof outputVoltageInput !== 'undefined') outputVoltageInput.setValue('');
		if (typeof dropoutVoltageInput !== 'undefined') dropoutVoltageInput.setValue('');
		if (typeof pinCountInput !== 'undefined') pinCountInput.setValue('');
		if (typeof pitchInput !== 'undefined') pitchInput.setValue('');
	},

	// ===== СУЩЕСТВУЮЩИЕ ФУНКЦИИ =====

	buildValueDisplay: () => {
		let num = valueNumberInput.text || '0';
		const mult = valueMultiplierSelect.selectedOptionValue || '';
		const unit = valueUnitSelect.selectedOptionValue || '';

		const parsedNum = parseFloat(num);

		if (!isNaN(parsedNum)) {
			if (Number.isInteger(parsedNum)) {
				num = Math.floor(parsedNum).toString();
			} else {
				num = parseFloat(parsedNum.toFixed(6)).toString();
			}
		}

		return `${num}${mult}${unit}`;
	},

	parseValueDisplay: (valueDisplay) => {
		if (!valueDisplay) return { number: '0', multiplier: '', unit: '' };

		const regex = /^([\d.]+)\s*([pnumkKMG]?)\s*([a-zA-ZΩ]+)?$/;
		const match = valueDisplay.trim().match(regex);

		if (!match) return { number: '0', multiplier: '', unit: '' };

		return {
			number: match[1],
			multiplier: match[2] || '',
			unit: match[3] || ''
		};
	},

	openEditForm: () => {
		if (!Table1.selectedRow || !Table1.selectedRow.id) {
			showAlert('Выберите компонент для редактирования', 'warning');
			return;
		}

		const row = Table1.selectedRow;

		partNumberInput.setValue(row.part_number || '');
		toleranceInput.setValue(row.tolerance_percent || '');
		tempMinInput.setValue(row.temp_min_c || '');
		tempMaxInput.setValue(row.temp_max_c || '');
		forwardVoltageInput.setValue(row.forward_voltage_v || '');
		reverseVoltageInput.setValue(row.reverse_voltage_v || '');
		outputVoltageInput.setValue(row.output_voltage_v || '');
		dropoutVoltageInput.setValue(row.dropout_voltage_v || '');
		pinCountInput.setValue(row.pin_count || '');
		pitchInput.setValue(row.pitch_mm || '');
		qFactorInput.setValue(row.q_factor || '');
		dielectricSelect.setSelectedOption(row.dielectric_type || '');
		transistorTypeSelect.setSelectedOption(row.transistor_type || '');
		channelTypeSelect.setSelectedOption(row.channel_type || '');
		if (typeof polarizedCheckbox.setValue === 'function') {
			polarizedCheckbox.setValue(Boolean(row.is_polarized));
		}

		libraryPathInput.setValue(row.library_path || '');
		libraryRefInput.setValue(row.library_ref || '');
		footprintPathInput.setValue(row.footprint_path || '');
		footprintRefInput.setValue(row.footprint_ref || '');

		datasheetUrlInput.setValue(row.datasheet_url || '');
		spiceModelInput.setValue(row.spice_model_path || '');

		altiumCommentInput.setValue(row.altium_comment || '');
		altiumDesignatorInput.setValue(row.altium_designator || '');
		kicadKeywordsInput.setValue(row.kicad_keywords || '');
		kicadFpFilterInput.setValue(row.kicad_fp_filter || '');

		valueDisplayInput.setText(row.value_display || '');

		if (row.category_id) {
			categorySelect.setSelectedOption(row.category_id);
		}

		if (row.manufacturer_id) {
			manufacturerSelect.setSelectedOption(row.manufacturer_id);
		}

		if (row.package) {
			packageSelect.setSelectedOption(row.package);
		}

		const valueParts = formHandlers.parseValueDisplay(row.value_display);
		valueNumberInput.setValue(valueParts.number);
		valueMultiplierSelect.setSelectedOption(valueParts.multiplier || '');
		valueUnitSelect.setSelectedOption(valueParts.unit || '');

		storeValue('editingComponentId', row.id);
		showModal(modalAddEditComponent.name);
	},

	openAddForm: () => {
		showModal(modalAddEditComponent.name);
	},

	onCategoryChange: () => {
		const categoryId = categorySelect.selectedOptionValue;

		if (!categoryId) return;

		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];

		const selectedCategory = categories.find(cat => cat.id == categoryId);

		if (!selectedCategory) {
			showAlert('Категория не найдена!', 'warning');
			return;
		}

		const designator = selectedCategory.designator_prefix || 'X';

		// ===== БИНДЫ БИБЛИОТЕК ПО КАТЕГОРИИ =====
		const bindings = componentConstants.getLibraryBindings(selectedCategory.name);

		if (bindings) {
			libraryPathInput.setValue(bindings.libraryPath);
			libraryRefInput.setValue(bindings.libraryRef);
			footprintPathInput.setValue(bindings.footprintPath);
		} else {
			libraryPathInput.setValue('');
			libraryRefInput.setValue('');
			footprintPathInput.setValue('');
		}

		altiumDesignatorInput.setValue(designator);

		// Footprint Ref зависит от корпуса/контактов/шага
		const packageName = packageSelect.selectedOptionValue || '';
		const pinCount = pinCountInput.text || '';
		const pitch = pitchInput.text || '';
		footprintRefInput.setValue(
			componentConstants.buildFootprintRef(bindings, packageName, pinCount, pitch)
		);

		const fpFilter = packageName ? `${designator}*${packageName}*` : '';
		const keywords = `${selectedCategory.name.toLowerCase()} ${packageName}`.trim();

		kicadFpFilterInput.setValue(fpFilter);
		kicadKeywordsInput.setValue(keywords);

		const unit = componentConstants.getUnitByCategory(selectedCategory.name);
		if (unit) {
			valueUnitSelect.setSelectedOption(unit);
		}

		// ===== ОЧИСТКА СПЕЦ ПОЛЕЙ ПРИ СМЕНЕ КАТЕГОРИИ =====
		formHandlers.clearSpecFields();
	},

	// Пересчитывает Footprint Ref при изменении корпуса/контактов/шага
	updateFootprintRef: () => {
		const categoryId = categorySelect.selectedOptionValue;
		if (!categoryId) return;

		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryId);
		if (!selectedCategory) return;

		const bindings = componentConstants.getLibraryBindings(selectedCategory.name);
		if (!bindings) return;

		const packageName = packageSelect.selectedOptionValue || '';
		const pinCount = pinCountInput.text || '';
		const pitch = pitchInput.text || '';

		footprintRefInput.setValue(
			componentConstants.buildFootprintRef(bindings, packageName, pinCount, pitch)
		);
	},

	onPackageChange: () => {
		const categoryId = categorySelect.selectedOptionValue;
		if (!categoryId) return;

		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryId);
		if (!selectedCategory) return;

		const designator = selectedCategory.designator_prefix || 'X';
		const packageName = packageSelect.selectedOptionValue || '';

		const fpFilter = packageName ? `${designator}*${packageName}*` : '';
		const keywords = `${selectedCategory.name.toLowerCase()} ${packageName}`.trim();

		kicadFpFilterInput.setValue(fpFilter);
		kicadKeywordsInput.setValue(keywords);

		// Footprint Ref зависит от корпуса
		formHandlers.updateFootprintRef();
	},

	onPackageChangeWithDelay: () => {
		setTimeout(() => formHandlers.onPackageChange(), 100);
	},

	validateForm: () => {
		const errors = [];

		if (!partNumberInput.text || partNumberInput.text.trim() === '') {
			errors.push('Part Number обязателен');
		}

		if (!categorySelect.selectedOptionValue) {
			errors.push('Категория обязательна');
		}

		if (!libraryPathInput.text || libraryPathInput.text.trim() === '') {
			errors.push('Library Path обязателен');
		}

		if (!libraryRefInput.text || libraryRefInput.text.trim() === '') {
			errors.push('Library Ref обязателен');
		}

		if (!footprintPathInput.text || footprintPathInput.text.trim() === '') {
			errors.push('Footprint Path обязателен');
		}

		if (!footprintRefInput.text || footprintRefInput.text.trim() === '') {
			errors.push('Footprint Ref обязателен');
		}

		if (!packageSelect.selectedOptionValue) {
			errors.push('Корпус обязателен');
		}

		// ===== СПЕЦИФИЧЕСКАЯ ВАЛИДАЦИЯ ПО ТИПАМ =====
		const type = formHandlers.getComponentType();
		const prefix = formHandlers.getDesignatorPrefix();

		if (type === 'passive') {
			if (!valueNumberInput.value || valueNumberInput.value === 0) {
				errors.push('Value (номинал) обязателен');
			}
			if (!toleranceInput.value || toleranceInput.value === '') {
				errors.push('Tolerance (допуск) обязателен');
			}
		}

		if (prefix === 'C') {
			// Конденсаторы
			if (!dielectricSelect.selectedOptionValue) {
				errors.push('Dielectric Type (тип диэлектрика) обязателен');
			}
		}

		if (prefix === 'D' || prefix === 'LED') {
			// Диоды
			if (!forwardVoltageInput.text || forwardVoltageInput.text.trim() === '') {
				errors.push('Forward Voltage (прямое напряжение) обязателен');
			}
		}

		if (prefix === 'Q') {
			// Транзисторы
			if (!transistorTypeSelect.selectedOptionValue) {
				errors.push('Transistor Type (тип транзистора) обязателен');
			}
			if (!channelTypeSelect.selectedOptionValue) {
				errors.push('Channel Type (тип канала) обязателен');
			}
		}

		if (prefix === 'J') {
			// Разъёмы
			if (!pinCountInput.text || pinCountInput.text.trim() === '') {
				errors.push('Pin Count (количество контактов) обязателен');
			}
			if (!pitchInput.text || pitchInput.text.trim() === '') {
				errors.push('Pitch (шаг контактов) обязателен');
			}
		}

		return errors;
	},

	resetForm: () => {
		partNumberInput.setValue('');
		categorySelect.setSelectedOption('');
		manufacturerSelect.setSelectedOption('');
		valueNumberInput.setValue(0);
		valueMultiplierSelect.setSelectedOption('');
		valueUnitSelect.setSelectedOption('');
		valueDisplayInput.setText('');
		toleranceInput.setValue('');
		tempMinInput.setValue('');
		tempMaxInput.setValue('');
		forwardVoltageInput.setValue('');
		reverseVoltageInput.setValue('');
		outputVoltageInput.setValue('');
		dropoutVoltageInput.setValue('');
		pinCountInput.setValue('');
		pitchInput.setValue('');
		qFactorInput.setValue('');
		dielectricSelect.setSelectedOption('');
		transistorTypeSelect.setSelectedOption('');
		channelTypeSelect.setSelectedOption('');
		if (typeof polarizedCheckbox.setValue === 'function') {
			polarizedCheckbox.setValue(false);
		} else if (typeof polarizedCheckbox.setValue === 'function') {
			polarizedCheckbox.setValue(false);
		} else {
			polarizedCheckbox.isChecked(false);
		}
		packageSelect.setSelectedOption('');
		libraryPathInput.setValue('');
		libraryRefInput.setValue('');
		footprintPathInput.setValue('');
		footprintRefInput.setValue('');
		datasheetUrlInput.setValue('');
		spiceModelInput.setValue('');
		altiumCommentInput.setValue('');
		altiumDesignatorInput.setValue('');
		kicadKeywordsInput.setValue('');
		kicadFpFilterInput.setValue('');

		storeValue('editingComponentId', null);
	},

	confirmAction: async () => {
		const partNumber = partNumberInput.text?.trim();

		if (!partNumber) {
			showAlert('Part Number обязателен!', 'error');
			return;
		}

		const categoryId = categorySelect.selectedOptionValue;
		if (!categoryId) {
			showAlert('Выберите категорию!', 'error');
			return;
		}

		const errors = formHandlers.validateForm();

		if (errors.length > 0) {
			showAlert('Ошибки валидации:\n\n• ' + errors.join('\n• '), 'error');
			return;
		}

		// ===== ОБНОВЛЕНИЕ KICAD ПОЛЕЙ ПЕРЕД СОХРАНЕНИЕМ =====
		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryId);
		const designator = selectedCategory?.designator_prefix || 'X';
		const packageName = packageSelect.selectedOptionValue || '';
		const categoryName = selectedCategory?.name || '';

		const fpFilter = packageName ? `${designator}*${packageName}*` : '';
		const keywords = `${categoryName.toLowerCase()} ${packageName}`.trim();

		kicadFpFilterInput.setValue(fpFilter);
		kicadKeywordsInput.setValue(keywords);

		const editingId = appsmith.store.editingComponentId;

		if (editingId) {
			try {
				await updateComponent.run();
				showAlert('Компонент обновлён!', 'success');
				getAllComponents.run();
				closeModal(modalAddEditComponent.name);
				storeValue('editingComponentId', null);
			} catch (error) {
				showAlert('Ошибка обновления: ' + error.message, 'error');
			}
		} else {
			try {
				await addComponent.run();
				showAlert('Компонент добавлен!', 'success');
				getAllComponents.run();
				closeModal(modalAddEditComponent.name);
				formHandlers.resetForm();
			} catch (error) {
				showAlert('Ошибка добавления: ' + error.message, 'error');
			}
		}
	}
}