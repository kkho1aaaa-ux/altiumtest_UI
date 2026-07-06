export default {
	// Добавление категории
	// Добавление корпуса
	addPackage: async () => {
		const name = newPackageNameInput.text;

		// ===== ВАЛИДАЦИЯ =====
		if (!name || name.trim() === '') {
			showAlert('Введите название корпуса', 'warning');
			return;
		}

		// Проверка формата
		const packagePattern = /^[a-zA-Z0-9\-]+$/;
		if (!packagePattern.test(name)) {
			showAlert('Название корпуса должно содержать только буквы, цифры и дефисы', 'warning');
			return;
		}

		try {
			const result = await addPackage.run({
				name: name.trim(),
				standard: 'Custom'  // Значение по умолчанию
			});

			if (result && result.length > 0) {
				showAlert(`Корпус "${name}" добавлен!`, 'success');

				// Очищаем поле
				newPackageNameInput.setValue('');

				closeModal('modalAddPackage');

				// Обновляем список
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

		// ===== ВАЛИДАЦИЯ =====
		if (!name || name.trim() === '') {
			showAlert('Введите название производителя', 'warning');
			return;
		}

		if (!website || website.trim() === '') {
			showAlert('Введите сайт производителя', 'warning');
			return;
		}

		// Проверка URL
		const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
		if (!urlPattern.test(website)) {
			showAlert('Введите корректный URL вебсайта (например: https://example.com)', 'warning');
			return;
		}

		try {
			const result = await addManufacturer.run({
				name: name.trim(),
				website: website.trim()
			});

			if (result && result.length > 0) {
				showAlert(`Производитель "${name}" добавлен!`, 'success');

				// Очищаем поля
				newManufacturerNameInput.setValue('');
				newManufacturerWebSiteInput.setValue('');

				closeModal('modalAddManufacturer');

				// Обновляем список
				await getManufacturers.run();
			} else {
				showAlert('Производитель с таким названием уже существует', 'warning');
			}
		} catch (error) {
			showAlert('Ошибка добавления: ' + error.message, 'error');
		}
	}
}