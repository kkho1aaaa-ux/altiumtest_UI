export default {
	// Обновление отображаемого номинала
	buildValueDisplay: () => {
		let num = valueNumberInput.text || '0';
		const mult = valueMultiplierSelect.selectedOptionValue || '';
		const unit = valueUnitSelect.selectedOptionValue || '';

		// Преобразуем в число и обратно в строку, чтобы убрать лишние нули
		const parsedNum = parseFloat(num);

		// Если это валидное число, форматируем его
		if (!isNaN(parsedNum)) {
			// Если число целое, убираем десятичную точку
			if (Number.isInteger(parsedNum)) {
				num = Math.floor(parsedNum).toString();
			} else {
				// Округляем до 6 знаков после запятой (максимум)
				num = parseFloat(parsedNum.toFixed(6)).toString();
			}
		}

		return `${num}${mult}${unit}`;
	},

	// Разбор value_display на части
	parseValueDisplay: (valueDisplay) => {
		if (!valueDisplay) return { number: '0', multiplier: '', unit: '' };

		// Регулярное выражение: число + опциональный множитель + единица
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

	// Автозаполнение при выборе категории (ИЗМЕНЁННЫЙ)
	onCategoryChange: async () => {
		const categoryId = categorySelect.selectedOptionValue;

		if (!categoryId) return;

		// Находим категорию в загруженных данных
		const categories = getCategories.data || [];
		const selectedCategory = categories.find(cat => cat.id == categoryId);

		if (!selectedCategory) return;

		// Заполняем поля из данных категории
		const schLib = selectedCategory.schlib_path || 'Passive.SchLib';
		const pcbLib = selectedCategory.pcblib_path || 'Passive.PcbLib';
		const designator = selectedCategory.altium_designator || 'X';

		// Устанавливаем значения
		libraryPathInput.setValue(schLib);
		footprintPathInput.setValue(pcbLib);
		altiumDesignatorInput.setValue(designator);

		// Автозаполнение library_ref для стандартных случаев
		if (designator === 'C' && !libraryRefInput.text) {
			libraryRefInput.setValue('C');
		}
		if (designator === 'R' && !libraryRefInput.text) {
			libraryRefInput.setValue('R');
		}
		if (designator === 'L' && !libraryRefInput.text) {
			libraryRefInput.setValue('L');
		}
		if (designator === 'D' && !libraryRefInput.text) {
			libraryRefInput.setValue('D');
		}
	}
}