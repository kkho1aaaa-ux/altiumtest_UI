export default {
	// ============================================
	// ID категорий
	// ============================================
	CATEGORY_IDS: {
		RESISTORS: ['1', '3', '7'],
		CAPACITORS: ['2', '4', '8'],
		INDUCTORS: ['5'],
		PASSES_ALL: ['1', '2', '3', '4', '5', '7', '8']
	},

	// ============================================
	// Множители для номинала
	// ============================================
	MULTIPLIERS: [
		{label: '-', value: ''},
		{label: 'p (пико)', value: 'p'},
		{label: 'n (нано)', value: 'n'},
		{label: 'u (микро)', value: 'u'},
		{label: 'm (милли)', value: 'm'},
		{label: 'K (кило)', value: 'K'},
		{label: 'M (мега)', value: 'M'},
		{label: 'G (гига)', value: 'G'}
	],

	// ============================================
	// Единицы измерения
	// ============================================
	UNITS: [
		{label: 'Ом (Ω)', value: 'Ω'},
		{label: 'Ф (F)', value: 'F'},
		{label: 'Гн (H)', value: 'H'},
		{label: 'В (V)', value: 'V'},
		{label: 'А (A)', value: 'A'},
		{label: 'Вт (W)', value: 'W'},
		{label: 'Гц (Hz)', value: 'Hz'}
	],

	// ============================================
	// Проверки категорий
	// ============================================
	isPassiveCategory: (categoryId) => {
		if (!categoryId) return false;
		return formLogic.CATEGORY_IDS.PASSES_ALL.includes(String(categoryId));
	},

	isResistorCategory: (categoryId) => {
		if (!categoryId) return false;
		return formLogic.CATEGORY_IDS.RESISTORS.includes(String(categoryId));
	},

	isCapacitorCategory: (categoryId) => {
		if (!categoryId) return false;
		return formLogic.CATEGORY_IDS.CAPACITORS.includes(String(categoryId));
	},

	// ============================================
	// Получение Designator по категории
	// ============================================
	getDesignatorByCategory: (categoryId) => {
		const id = String(categoryId);
		if (formLogic.CATEGORY_IDS.RESISTORS.includes(id)) return 'R';
		if (formLogic.CATEGORY_IDS.CAPACITORS.includes(id)) return 'C';
		if (formLogic.CATEGORY_IDS.INDUCTORS.includes(id)) return 'L';
		if (id === '6') return 'D';
		if (id === '9') return 'Q';
		if (id === '10') return 'U';
		return 'X';
	},

	// ============================================
	// Обработчик изменения категории
	// ============================================
	onCategoryChange: (formPrefix) => {
		const form = appsmith.evaluator.getWidgetByName(formPrefix);
		const catId = form.categorySelect.selectedOptionValue;

		if (!catId) return;

		// Устанавливаем Designator
		const designator = formLogic.getDesignatorByCategory(catId);
		if (form.altiumDesignatorInput) {
			form.altiumDesignatorInput.setValue(designator);
		}
	},

	// ============================================
	// Формирование value_display из трех частей
	// ============================================
	updateValueDisplay: () => {
		const num = valueNumberInput.value || 0;
		const mult = valueMultiplierSelect.selectedOptionValue || '';
		const unit = valueUnitSelect.selectedOptionValue || '';
		const display = num + mult + unit;

		valueDisplayInput.setValue(display);
	},

	// ============================================
	// Валидация формы
	// ============================================
	validateAddForm: () => {
		const errors = [];
		const f = addForm;

		if (!f.partNumberInput.text || f.partNumberInput.text.trim() === '') {
			errors.push('Part Number обязателен');
		}
		if (!f.categorySelect.selectedOptionValue) {
			errors.push('Категория обязательна');
		}
		if (!f.libraryPathInput.text || f.libraryPathInput.text.trim() === '') {
			errors.push('Library Path обязателен');
		}
		if (!f.libraryRefInput.text || f.libraryRefInput.text.trim() === '') {
			errors.push('Library Ref обязателен');
		}
		if (!f.footprintPathInput.text || f.footprintPathInput.text.trim() === '') {
			errors.push('Footprint Path обязателен');
		}
		if (!f.footprintRefInput.text || f.footprintRefInput.text.trim() === '') {
			errors.push('Footprint Ref обязателен');
		}
		if (!f.packageSelect.selectedOptionValue) {
			errors.push('Корпус обязателен');
		}

		// Условная валидация для пассивных компонентов
		if (formLogic.isPassiveCategory(f.categorySelect.selectedOptionValue)) {
			if (!f.valueDisplayInput.text || f.valueDisplayInput.text.trim() === '') {
				errors.push('Номинал обязателен для пассивных компонентов');
			}
		}

		return errors;
	},

	// ============================================
	// Отправка формы добавления
	// ============================================
	submitAdd: async () => {
		const errors = formLogic.validateAddForm();

		if (errors.length > 0) {
			showAlert('Ошибки валидации:\n• ' + errors.join('\n• '), 'error');
			return;
		}

		try {
			await addComponent.run();
			showAlert('Компонент успешно добавлен!', 'success');
			getAllComponents.run();
			resetWidget('addForm', true);
		} catch (error) {
			showAlert('Ошибка: ' + error.message, 'error');
		}
	},

	// ============================================
	// Отправка формы редактирования
	// ============================================
	submitEdit: async () => {
		try {
			await updateComponent.run();
			showAlert('Компонент обновлён!', 'success');
			getAllComponents.run();
			closeModal('editModal');
		} catch (error) {
			showAlert('Ошибка: ' + error.message, 'error');
		}
	}
}