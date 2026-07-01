export default {
	onRowSelect: () => {
		storeValue('isComponentSelected', true);
		storeValue('selectedComponent', Table1.selectedRow);
	},

	onRowDeselect: () => {
		storeValue('isComponentSelected', false);
		storeValue('selectedComponent', null);
	},

	checkSelection: () => {
		return appsmith.store.isComponentSelected;
	}
}