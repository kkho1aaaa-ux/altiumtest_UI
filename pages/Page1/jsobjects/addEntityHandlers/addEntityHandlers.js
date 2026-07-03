export default {
	// Добавление категории
	addCategory: async () => {
		const name = newCategoryNameInput.text;

		if (!name || name.trim() === '') {
			showAlert('Введите название категории', 'warning');
			return;
		}

		try {
			const result = await addCategory.run();
			if (result && result.length > 0) {
				showAlert(`Категория "${name}" добавлена!`, 'success');
				// Очищаем поля
				newCategoryNameInput.setValue('');
				newCategorySchLibInput.setValue('');
				newCategoryPcbLibInput.setValue('');
				newCategoryDesignatorInput.setValue('');
				closeModal('modalAddCategory');
				// Обновляем список категорий
				await getCategories.run();
			} else {
				showAlert('Категория с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	},

	// Добавление производителя
	addManufacturer: async () => {
		const name = newManufacturerNameInput.text;
		const website = newManufacturerWebSiteInput.text;

		// Проверка названия
		if (!name || name.trim() === '') {
			showAlert('Введите название производителя', 'warning');
			return;
		}

		// Проверка вебсайта (если указан)
		if (website && website.trim() !== '') {
			const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
			if (!urlPattern.test(website)) {
				showAlert('Введите корректный URL вебсайта (например: https://example.com)', 'warning');
				return;
			}
		}

		try {
			const result = await addManufacturer.run();
			if (result && result.length > 0) {
				showAlert(`Производитель "${name}" добавлен!`, 'success');
				// Очищаем поля
				newManufacturerNameInput.setValue('');
				newManufacturerWebSiteInput.setValue('');
				closeModal('modalAddManufacturer');
				// Обновляем список производителей
				await getManufacturers.run();
			} else {
				showAlert('Производитель с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	},

	// Добавление корпуса
	addPackage: async () => {
		const name = newPackageNameInput.text;

		// Проверка названия
		if (!name || name.trim() === '') {
			showAlert('Введите название корпуса', 'warning');
			return;
		}

		// Проверка формата названия (только буквы, цифры, дефисы)
		const packagePattern = /^[a-zA-Z0-9\-]+$/;
		if (!packagePattern.test(name)) {
			showAlert('Название корпуса должно содержать только буквы, цифры и дефисы', 'warning');
			return;
		}

		try {
			const result = await addPackage.run();
			if (result && result.length > 0) {
				showAlert(`Корпус "${name}" добавлен!`, 'success');
				// Очищаем поле
				newPackageNameInput.setValue('');
				closeModal('modalAddPackage');
				// Обновляем список корпусов
				await getPackages.run();
			} else {
				showAlert('Корпус с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	}
}