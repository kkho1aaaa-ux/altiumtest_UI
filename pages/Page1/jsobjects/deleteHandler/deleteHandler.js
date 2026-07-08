export default {
	deleteSelected: async () => {
		const rows = Table1.selectedRows;

		if (!rows || rows.length === 0) {
			showAlert('Выберите хотя бы один компонент', 'warning');
			return;
		}

		const ids = rows.map(row => parseInt(row.id)).filter(id => !isNaN(id));

		if (ids.length === 0) {
			showAlert('Не удалось получить ID компонентов', 'error');
			return;
		}

		const count = ids.length;
		const word = count === 1 ? 'компонент' : 
		count >= 2 && count <= 4 ? 'компонента' : 'компонентов';

		const message = `Удалить ${count} ${word}?`;

		await storeValue('deleteMessage', message);
		await storeValue('deleteTargetIds', ids);

		showModal('confirmDeleteModal');
	},

	// ✅ МЕТОД ДЛЯ КНОПКИ "УДАЛИТЬ" В МОДАЛКЕ
	confirmDelete: async () => {
		const ids = appsmith.store.deleteTargetIds;

		if (!ids || ids.length === 0) {
			showAlert('Нет компонентов для удаления', 'warning');
			closeModal('confirmDeleteModal');
			return;
		}

		try {
			await deleteComponents.run({ ids: ids });
			showAlert(`Удалено ${ids.length} компонент(ов)`, 'success');
			closeModal('confirmDeleteModal');
			await getAllComponents.run();
		} catch (error) {
			showAlert('Ошибка удаления: ' + error.message, 'error');
		}
	}
}