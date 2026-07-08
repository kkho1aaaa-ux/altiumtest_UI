export default {
	// Добавление категории
	addCategory: async () => {
		const name = newCategoryNameInput.text;
		const prefix = newCategoryPrefixInput.text;
		const parentId = newCategoryParentSelect.selectedOptionValue;
		const description = newCategoryDescriptionInput.text;

		if (!name || name.trim() === '') {
			showAlert('Введите название категории', 'warning');
			return;
		}

		if (!prefix || prefix.trim() === '') {
			showAlert('Введите префикс обозначения', 'warning');
			return;
		}

		const prefixPattern = /^[A-Z]{1,3}$/;
		if (!prefixPattern.test(prefix)) {
			showAlert('Префикс должен содержать 1-3 заглавные буквы (например: R, C, U)', 'warning');
			return;
		}

		try {
			const result = await addCategory.run({
				name: name.trim(),
				prefix: prefix.trim().toUpperCase(),
				parent_id: parentId ? parseInt(parentId) : null,
				description: description?.trim() || ''
			});

			if (result && result.length > 0) {
				showAlert(`Категория "${name}" добавлена!`, 'success');
				newCategoryNameInput.setValue('');
				newCategoryPrefixInput.setValue('');
				newCategoryParentSelect.setSelectedOption('');
				newCategoryDescriptionInput.setValue('');
				closeModal('modalAddCategory');
				await getCategories.run();
			} else {
				showAlert('Категория с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	},

	// Добавление корпуса
	addPackage: async () => {
		const name = newPackageNameInput.text;

		if (!name || name.trim() === '') {
			showAlert('Введите название корпуса', 'warning');
			return;
		}

		const packagePattern = /^[a-zA-Z0-9\-_]+$/;
		if (!packagePattern.test(name)) {
			showAlert('Название корпуса должно содержать только буквы, цифры, дефисы и подчёркивания', 'warning');
			return;
		}

		try {
			const result = await addPackage.run({
				name: name.trim(),
				standard: 'Custom'
			});

			if (result && result.length > 0) {
				showAlert(`Корпус "${name}" добавлен!`, 'success');
				newPackageNameInput.setValue('');
				closeModal('modalAddPackage');
				await getPackages.run();
			} else {
				showAlert('Корпус с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	},

	// Добавление производителя
	addManufacturer: async () => {
		const name = newManufacturerNameInput.text;
		const website = newManufacturerWebSiteInput.text;

		if (!name || name.trim() === '') {
			showAlert('Введите название производителя', 'warning');
			return;
		}

		if (!website || website.trim() === '') {
			showAlert('Введите сайт производителя', 'warning');
			return;
		}

		const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
		if (!urlPattern.test(website)) {
			showAlert('Введите корректный URL (например: https://example.com)', 'warning');
			return;
		}

		try {
			const result = await addManufacturer.run({
				name: name.trim(),
				website: website.trim()
			});

			if (result && result.length > 0) {
				showAlert(`Производитель "${name}" добавлен!`, 'success');
				newManufacturerNameInput.setValue('');
				newManufacturerWebSiteInput.setValue('');
				closeModal('modalAddManufacturer');
				await getManufacturers.run();
			} else {
				showAlert('Производитель с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	}
}