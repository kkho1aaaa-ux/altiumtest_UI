export default {
	// ============================================
	// МНОЖИТЕЛИ ДЛЯ НОМИНАЛОВ
	// ============================================
	VALUE_MULTIPLIERS: [
		{ label: '-', value: '' },
		{ label: 'p (pico)', value: 'p' },
		{ label: 'n (nano)', value: 'n' },
		{ label: 'u (micro)', value: 'u' },
		{ label: 'm (milli)', value: 'm' },
		{ label: 'K (kilo)', value: 'K' },
		{ label: 'M (mega)', value: 'M' },
		{ label: 'G (giga)', value: 'G' }
	],

	// ============================================
	// ЕДИНИЦЫ ИЗМЕРЕНИЯ
	// ============================================
	VALUE_UNITS: [
		{ label: 'Ω (Ohm)', value: 'Ω' },
		{ label: 'F (Farad)', value: 'F' },
		{ label: 'H (Henry)', value: 'H' },
		{ label: 'V (Volt)', value: 'V' },
		{ label: 'A (Ampere)', value: 'A' },
		{ label: 'W (Watt)', value: 'W' },
		{ label: 'Hz (Hertz)', value: 'Hz' }
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