export default {
	// ============================================
	// МНОЖИТЕЛИ ДЛЯ НОМИНАЛОВ
	// ============================================
	VALUE_MULTIPLIERS: [
		{ label: '- (без множителя)', value: '' },
		{ label: 'п (пико)', value: 'p' },
		{ label: 'н (нано)', value: 'n' },
		{ label: 'мк (микро)', value: 'u' },
		{ label: 'м (милли)', value: 'm' },
		{ label: 'к (кило)', value: 'K' },
		{ label: 'М (мега)', value: 'M' },
		{ label: 'Г (гига)', value: 'G' }
	],

	// ============================================
	// ЕДИНИЦЫ ИЗМЕРЕНИЯ
	// ============================================
	VALUE_UNITS: [
		{ label: 'Ω (Ом)', value: 'Ω' },
		{ label: 'F (Фарад)', value: 'F' },
		{ label: 'H (Генри)', value: 'H' },
		{ label: 'V (Вольт)', value: 'V' },
		{ label: 'A (Ампер)', value: 'A' },
		{ label: 'W (Ватт)', value: 'W' },
		{ label: 'Hz (Герц)', value: 'Hz' }
	],

	// ============================================
	// СТАНДАРТЫ КОРПУСОВ
	// ============================================
	PACKAGE_STANDARDS: [
		{ label: 'EIA', value: 'EIA' },
		{ label: 'Metric', value: 'Metric' },
		{ label: 'JEDEC', value: 'JEDEC' },
		{ label: 'IPC', value: 'IPC' },
		{ label: 'Custom', value: 'Custom' }
	],

	// ============================================
	// DESIGNATOR ПО КАТЕГОРИЯМ
	// ============================================
	DESIGNATORS: {
		'1': 'R',   // Резисторы
		'2': 'C',   // Конденсаторы
		'3': 'R',   // SMD резисторы
		'4': 'C',   // SMD конденсаторы
		'5': 'L',   // Индуктивности
		'6': 'D',   // Диоды
		'7': 'Q',   // Транзисторы
		'8': 'U',   // Микросхемы
		'9': 'Q',   // Транзисторы
		'10': 'U'   // Микросхемы
	},

	// ============================================
	// LIBRARY PATH ПО КАТЕГОРИЯМ
	// ============================================
	LIBRARY_PATHS: {
		'1': 'Resistors.SchLib',
		'2': 'Capacitors.SchLib',
		'3': 'Resistors.SchLib',
		'4': 'Capacitors.SchLib',
		'5': 'Inductors.SchLib',
		'6': 'Diodes.SchLib',
		'7': 'Transistors.SchLib',
		'8': 'MCU.SchLib',
		'9': 'Transistors.SchLib',
		'10': 'MCU.SchLib'
	},

	// ============================================
	// FOOTPRINT PATH ПО КАТЕГОРИЯМ
	// ============================================
	FOOTPRINT_PATHS: {
		'1': 'Resistors.PcbLib',
		'2': 'Capacitors.PcbLib',
		'3': 'Resistors.PcbLib',
		'4': 'Capacitors.PcbLib',
		'5': 'Inductors.PcbLib',
		'6': 'Diodes.PcbLib',
		'7': 'Transistors.PcbLib',
		'8': 'MCU.PcbLib',
		'9': 'Transistors.PcbLib',
		'10': 'MCU.PcbLib'
	},

	// ============================================
	// ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
	// ============================================

	// Получить Designator по категории
	getDesignator: (categoryId) => {
		return componentConstants.DESIGNATORS[categoryId] || 'X';
	},

	// Получить Library Path по категории
	getLibraryPath: (categoryId) => {
		return componentConstants.LIBRARY_PATHS[categoryId] || '';
	},

	// Получить Footprint Path по категории
	getFootprintPath: (categoryId) => {
		return componentConstants.FOOTPRINT_PATHS[categoryId] || '';
	},

	// Собрать номинал из частей
	buildValueDisplay: (number, multiplier, unit) => {
		const num = number || 0;
		const mult = multiplier || '';
		const un = unit || '';
		return `${num}${mult}${un}`;
	},

	// Разобрать номинал на части (простой парсинг)
	parseValueDisplay: (valueDisplay) => {
		if (!valueDisplay) return { number: 0, multiplier: '', unit: '' };

		// Регулярное выражение: число + опциональный множитель + единица
		const regex = /^([\d.]+)\s*([pnumkKMG]?)\s*([a-zA-ZΩ]+)?$/;
		const match = valueDisplay.trim().match(regex);

		if (!match) return { number: 0, multiplier: '', unit: '' };

		return {
			number: parseFloat(match[1]),
			multiplier: match[2] || '',
			unit: match[3] || ''
		};
	}
}