export default {
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
		voltageInput.setValue(row.voltage_rating_v || '');
		tempMinInput.setValue(row.temp_min_c || '');
		tempMaxInput.setValue(row.temp_max_c || '');
		powerRatingInput.setValue(row.power_rating_w || '');

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

	onCategoryChange: async () => {
		const categoryId = categorySelect.selectedOptionValue;

		if (!categoryId) return;

		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];

		const selectedCategory = categories.find(cat => cat.id == categoryId);

		if (!selectedCategory) {
			showAlert('Категория не найдена!', 'warning');
			return;
		}

		// ❌ УДАЛЕНО: const russianName = componentConstants.getCategoryRussianName(selectedCategory.name);

		const mappingsData = getCategoryLibraryMappings.data;
		const mappings = Array.isArray(mappingsData) ? mappingsData : [];

		const schLibMapping = mappings.find(m =>
																				m.category_id == categoryId &&
																				m.platform === 'altium' &&
																				m.library_name &&
																				m.library_name.endsWith('.SchLib')
																			 );

		const pcbLibMapping = mappings.find(m =>
																				m.category_id == categoryId &&
																				m.platform === 'altium' &&
																				m.library_name &&
																				m.library_name.endsWith('.PcbLib')
																			 );

		const schLib = schLibMapping ? schLibMapping.library_name : '';
		const pcbLib = pcbLibMapping ? pcbLibMapping.library_name : '';
		const designator = selectedCategory.designator_prefix || 'X';

		libraryPathInput.setValue(schLib);
		footprintPathInput.setValue(pcbLib);
		altiumDesignatorInput.setValue(designator);
		libraryRefInput.setValue(designator);
		footprintRefInput.setValue(designator);

		const packageName = packageSelect.selectedOptionValue || '';
		const fpFilter = packageName ? `${designator}*${packageName}*` : '';

		// ✅ ИСПОЛЬЗУЕМ АНГЛИЙСКОЕ НАЗВАНИЕ (оригинальное)
		const keywords = `${selectedCategory.name.toLowerCase()} ${packageName}`.trim();

		kicadFpFilterInput.setValue(fpFilter);
		kicadKeywordsInput.setValue(keywords);

		const unit = componentConstants.getUnitByCategory(selectedCategory.name);
		if (unit) {
			valueUnitSelect.setSelectedOption(unit);
		}
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

		const categoryId = categorySelect.selectedOptionValue;
		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryId);
		const isIC = selectedCategory && (
			selectedCategory.name.toLowerCase().includes('ic') ||
			selectedCategory.designator_prefix === 'U'
		);

		if (!isIC) {
			if (!valueNumberInput.value || valueNumberInput.value === 0) {
				errors.push('Value обязателен');
			}
			if (!toleranceInput.value || toleranceInput.value === '') {
				errors.push('Точность (Tolerance) обязательна');
			}
		}

		if (!packageSelect.selectedOptionValue) {
			errors.push('Корпус обязателен');
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
		voltageInput.setValue('');
		tempMinInput.setValue('');
		tempMaxInput.setValue('');
		powerRatingInput.setValue('');
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