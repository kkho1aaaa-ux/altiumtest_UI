export default {
	// Валидация формы
	validateForm: () => {
		const errors = [];

		// ===== ОБЯЗАТЕЛЬНЫЕ ПОЛЯ =====

		// 1. Part Number
		if (!partNumberInput.text || partNumberInput.text.trim() === '') {
			errors.push('Part Number обязателен');
		}

		// 2. Category (ОБЯЗАТЕЛЬНА)
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
			selectedCategory.name.toLowerCase().includes('микросхема') ||
			selectedCategory.altium_designator === 'U' ||
			selectedCategory.altium_designator === 'IC'
		);

		if (!isIC) {
			// Value Number
			if (!valueNumberInput.value || valueNumberInput.value === 0) {
				errors.push('Value обязателен');
			}

			// Tolerance
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
		// ВАЛИДАЦИЯ ПЕРЕД ОТПРАВКОЙ
		const errors = formLogic.validateForm();

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
				formLogic.resetForm();
			} catch (error) {
				showAlert('Ошибка добавления: ' + error.message, 'error');
			}
		}
	},

	// Отмена и закрытие
	cancelAction: () => {
		closeModal(modalAddEditComponent.name);
		storeValue('editingComponentId', null);
	}
}