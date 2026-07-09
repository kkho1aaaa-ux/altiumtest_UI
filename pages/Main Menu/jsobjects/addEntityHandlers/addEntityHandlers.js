export default {
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