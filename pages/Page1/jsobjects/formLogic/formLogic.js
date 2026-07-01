export default {
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

		// Очищаем ID из store
		storeValue('editingComponentId', null);
	},

	// Подтверждение (добавление или обновление)
	confirmAction: async () => {
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