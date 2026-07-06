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
	// ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
	// ============================================

	// Собрать номинал из частей
	buildValueDisplay: (number, multiplier, unit) => {
		const num = number || 0;
		const mult = multiplier || '';
		const un = unit || '';
		return `${num}${mult}${un}`;
	},

	// Разобрать номинал на части
	parseValueDisplay: (valueDisplay) => {
		if (!valueDisplay) return { number: 0, multiplier: '', unit: '' };

		const regex = /^([\d.]+)\s*([pnumkKMG]?)\s*([a-zA-ZΩ]+)?$/;
		const match = valueDisplay.trim().match(regex);

		if (!match) return { number: 0, multiplier: '', unit: '' };

		return {
			number: parseFloat(match[1]),
			multiplier: match[2] || '',
			unit: match[3] || ''
		};
	},

	// Получить единицу измерения по категории
	getUnitByCategory: (categoryName) => {
		const unitMap = {
			'Resistors': 'Ω',
			'Capacitors': 'F',
			'Inductors': 'H',
			'Diodes': 'V',
			'Transistors': 'A',
			'LEDs': 'V'
		};
		return unitMap[categoryName] || '';
	},

	// Получить специфичное поле для категории
	getSpecificFieldByCategory: (categoryName) => {
		const fieldMap = {
			'Resistors': 'resistance_ohm',
			'Capacitors': 'capacitance_pf',
			'Inductors': 'inductance_uh',
			'Diodes': 'voltage_breakdown_v',
			'Transistors': 'current_rating_a'
		};
		return fieldMap[categoryName] || null;
	}
}