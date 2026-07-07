export default {
	// Обновление отображаемого номинала
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

	// Разбор value_display на части
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

	// Открытие формы редактирования
	openEditForm: () => {
		if (!Table1.selectedRow || !Table1.selectedRow.id) {
			showAlert('Выберите компонент для редактирования', 'warning');
			return;
		}

		const row = Table1.selectedRow;

		// Text Input - основные поля
		partNumberInput.setValue(row.part_number || '');
		toleranceInput.setValue(row.tolerance_percent || '');
		voltageInput.setValue(row.voltage_rating_v || '');
		tempMinInput.setValue(row.temp_min_c || '');
		tempMaxInput.setValue(row.temp_max_c || '');
		powerRatingInput.setValue(row.power_rating_w || '');

		// Text Input - библиотеки
		libraryPathInput.setValue(row.library_path || '');
		libraryRefInput.setValue(row.library_ref || '');
		footprintPathInput.setValue(row.footprint_path || '');
		footprintRefInput.setValue(row.footprint_ref || '');

		// Text Input - ссылки
		datasheetUrlInput.setValue(row.datasheet_url || '');
		spiceModelInput.setValue(row.spice_model_path || '');

		// Text Input - Altium/KiCad
		altiumCommentInput.setValue(row.altium_comment || '');
		altiumDesignatorInput.setValue(row.altium_designator || '');
		kicadKeywordsInput.setValue(row.kicad_keywords || '');
		kicadFpFilterInput.setValue(row.kicad_fp_filter || '');

		// Text widget
		valueDisplayInput.setText(row.value_display || '');

		// Select - Category
		if (row.category_id) {
			categorySelect.setSelectedOption(row.category_id);
		}

		// Select - Manufacturer
		if (row.manufacturer_id) {
			manufacturerSelect.setSelectedOption(row.manufacturer_id);
		}

		// Select - Package
		if (row.package) {
			packageSelect.setSelectedOption(row.package);
		}

		// Разбираем value_display
		const valueParts = formHandlers.parseValueDisplay(row.value_display);
		valueNumberInput.setValue(valueParts.number);
		valueMultiplierSelect.setSelectedOption(valueParts.multiplier || '');
		valueUnitSelect.setSelectedOption(valueParts.unit || '');

		// Сохраняем ID
		storeValue('editingComponentId', row.id);

		// Открываем модалку
		showModal(modalAddEditComponent.name);
	},

	// Открытие формы добавления
	openAddForm: () => {
		showModal(modalAddEditComponent.name);
	},

	// Автозаполнение при выборе категории (ИСПРАВЛЕН)
	onCategoryChange: async () => {
		const categoryId = categorySelect.selectedOptionValue;

		const packageName = packageSelect.selectedOptionValue || '';
		const fpFilter = packageName ? `${designator}*${packageName}*` : '';
		const keywords = `${selectedCategory.name.toLowerCase()} ${packageName}`.trim();

		kicadFpFilterInput.setValue(fpFilter);
		kicadKeywordsInput.setValue(keywords);

		console.log('=== onCategoryChange TRIGGERED ===');
		console.log('categoryId:', categoryId);

		if (!categoryId) {
			console.log('No categoryId, exiting');
			return;
		}

		// Безопасная работа с данными
		const categoriesData = getCategories.data;
		const categories = Array.isArray(categoriesData) ? categoriesData : [];

		console.log('categoriesData:', categoriesData);
		console.log('categories count:', categories.length);

		const selectedCategory = categories.find(cat => cat.id == categoryId);

		console.log('selectedCategory:', selectedCategory);

		if (!selectedCategory) {
			console.warn('Category not found:', categoryId);
			showAlert('Категория не найдена! Обновите страницу.', 'warning');
			return;
		}

		// Безопасная работа с маппингом
		const mappingsData = getCategoryLibraryMappings.data;
		const mappings = Array.isArray(mappingsData) ? mappingsData : [];

		console.log('mappingsData:', mappingsData);
		console.log('mappings count:', mappings.length);

		// ИСПРАВЛЕНИЕ: определяем тип по расширению
		const schLibMapping = mappings.find(m => {
			const match = m.category_id == categoryId && 
						m.platform === 'altium' && 
						m.library_name && 
						m.library_name.endsWith('.SchLib');
			console.log('Checking SchLib:', m.library_name, '-> match:', match);
			return match;
		});

		const pcbLibMapping = mappings.find(m => {
			const match = m.category_id == categoryId && 
						m.platform === 'altium' && 
						m.library_name && 
						m.library_name.endsWith('.PcbLib');
			console.log('Checking PcbLib:', m.library_name, '-> match:', match);
			return match;
		});

		console.log('schLibMapping:', schLibMapping);
		console.log('pcbLibMapping:', pcbLibMapping);

		const schLib = schLibMapping ? schLibMapping.library_name : '';
		const pcbLib = pcbLibMapping ? pcbLibMapping.library_name : '';
		const designator = selectedCategory.designator_prefix || 'X';

		console.log('Final values:');
		console.log('- schLib:', schLib);
		console.log('- pcbLib:', pcbLib);
		console.log('- designator:', designator);

		// ===== ЯВНАЯ ОЧИСТКА ПЕРЕД УСТАНОВКОЙ =====
		libraryPathInput.setValue('');
		footprintPathInput.setValue('');

		// Небольшая задержка перед установкой новых значений
		setTimeout(() => {
			libraryPathInput.setValue(schLib);
			footprintPathInput.setValue(pcbLib);
			altiumDesignatorInput.setValue(designator);

			// Всегда обновляем Ref при смене категории
			libraryRefInput.setValue(designator);
			footprintRefInput.setValue(designator);

			console.log('Values SET:');
			console.log('- libraryPathInput.text:', libraryPathInput.text);
			console.log('- footprintPathInput.text:', footprintPathInput.text);
			console.log('- libraryRefInput.text:', libraryRefInput.text);
			console.log('- footprintRefInput.text:', footprintRefInput.text);
		}, 100);

		// Автоматически устанавливаем единицу измерения
		const unit = componentConstants.getUnitByCategory(selectedCategory.name);
		console.log('unit for', selectedCategory.name, ':', unit);
		if (unit) {
			valueUnitSelect.setSelectedOption(unit);
		}
	},

	// Валидация формы
	validateForm: () => {
		const errors = [];

		// 1. Part Number
		if (!partNumberInput.text || partNumberInput.text.trim() === '') {
			errors.push('Part Number обязателен');
		}

		// 2. Category
		if (!categorySelect.selectedOptionValue) {
			errors.push('Категория обязательна');
		}

		// 3. Library Path
		if (!libraryPathInput.text || libraryPathInput.text.trim() === '') {
			errors.push('Library Path обязателен');
		}

		// 4. Library Ref
		if (!libraryRefInput.text || libraryRefInput.text.trim() === '') {
			errors.push('Library Ref обязателен');
		}

		// 5. Footprint Path
		if (!footprintPathInput.text || footprintPathInput.text.trim() === '') {
			errors.push('Footprint Path обязателен');
		}

		// 6. Footprint Ref
		if (!footprintRefInput.text || footprintRefInput.text.trim() === '') {
			errors.push('Footprint Ref обязателен');
		}

		// 7. Value и Tolerance (если это НЕ микросхема)
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

		// 8. Package
		if (!packageSelect.selectedOptionValue) {
			errors.push('Корпус обязателен');
		}

		return errors;
	},

	// Сброс формы
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

	// Подтверждение (добавление или обновление)
	confirmAction: async () => {
		// ВАЛИДАЦИЯ: проверяем обязательные поля
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

		// Остальная валидация...
		const errors = formHandlers.validateForm();

		if (errors.length > 0) {
			showAlert(
				'Ошибки валидации:\n\n• ' + errors.join('\n• '),
				'error'
			);
			return;
		}

		const editingId = appsmith.store.editingComponentId;

		if (editingId) {
			// Режим редактирования
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
			// Режим добавления
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
	},

}