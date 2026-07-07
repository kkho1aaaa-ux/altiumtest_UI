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

		// Сохраняем IDs в store
		await storeValue('deleteTargetIds', ids);

		// Показываем модалку
		showModal('confirmDeleteModal');
	}
}