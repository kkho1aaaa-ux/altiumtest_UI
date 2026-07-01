if (addComponentForm.categoryDropdown.selectedOptionValue == 3 || 
		addComponentForm.categoryDropdown.selectedOptionValue == 7) {
	// Резисторы
	addComponentForm.resistanceOhmInput.isVisible = true;
	addComponentForm.capacitancePfInput.isVisible = false;
	addComponentForm.inductanceUhInput.isVisible = false;
	addComponentForm.valueUnitInput.setValue('Ohm');
} else if (addComponentForm.categoryDropdown.selectedOptionValue == 4 || 
					 addComponentForm.categoryDropdown.selectedOptionValue == 8) {
	// Конденсаторы
	addComponentForm.resistanceOhmInput.isVisible = false;
	addComponentForm.capacitancePfInput.isVisible = true;
	addComponentForm.inductanceUhInput.isVisible = false;
	addComponentForm.valueUnitInput.setValue('nF');
} else if (addComponentForm.categoryDropdown.selectedOptionValue == 5) {
	// Индуктивности
	addComponentForm.resistanceOhmInput.isVisible = false;
	addComponentForm.capacitancePfInput.isVisible = false;
	addComponentForm.inductanceUhInput.isVisible = true;
	addComponentForm.valueUnitInput.setValue('uH');
}