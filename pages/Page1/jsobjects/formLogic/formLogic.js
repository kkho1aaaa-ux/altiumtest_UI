export default {
	// Валидация формы
	validateForm: () => {
		const errors = [];

		// Обязательные поля (со звёздочкой *)
		if (!partNumberInput.text || partNumberInput.text.trim() === '') {
			errors.push('Part Number обязателен');
		}

		if (!valueNumberInput.value || valueNumberInput.value === 0) {
			errors.push('Value обязателен');
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

		if (!datasheetUrlInput.text || datasheetUrlInput.text.trim() === '') {
			errors.push('Datasheet URL обязателен');
		}

		if (!spiceModelInput.text || spiceModelInput.text.trim() === '') {
			errors.push('SPICE Model Path обязателен');
		}

		if (!categorySelect.selectedOptionValue) {
			errors.push('Категория обязательна');
		}

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
			return; // Прерываем выполнение
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