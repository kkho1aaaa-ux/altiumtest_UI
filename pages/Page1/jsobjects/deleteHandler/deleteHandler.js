export default {
	deleteSelected: async () => {
		const rows = Table1.selectedRows;

		if (!rows || rows.length === 0) {
			showAlert('Выберите хотя бы один компонент', 'warning');
			return;
		}

		const ids = rows.map(row => parseInt(row.id));
		const count = rows.length;

		const getPluralForm = (count, one, few, many) => {
			const lastTwo = count % 100;
			const lastOne = count % 10;
			if (lastTwo >= 11 && lastTwo <= 19) return many;
			if (lastOne === 1) return one;
			if (lastOne >= 2 && lastOne <= 4) return few;
			return many;
		};

		const word = getPluralForm(count, 'компонент', 'компонента', 'компонентов');
		const message = `Удалить ${count} ${word}?`;

		await storeValue('deleteTargetIds', ids);
		await storeValue('deleteMessage', message);

		showModal(confirmDeleteModal.name);
	}
}