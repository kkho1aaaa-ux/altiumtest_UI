export default {
	// Множители для номиналов
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

	// Единицы измерения
	VALUE_UNITS: [
		{ label: 'Ω (Ом)', value: 'Ω' },
		{ label: 'F (Фарад)', value: 'F' },
		{ label: 'H (Генри)', value: 'H' },
		{ label: 'V (Вольт)', value: 'V' },
		{ label: 'A (Ампер)', value: 'A' },
		{ label: 'W (Ватт)', value: 'W' },
		{ label: 'Hz (Герц)', value: 'Hz' }
	],

	// Стандарты корпусов
	PACKAGE_STANDARDS: [
		{ label: 'EIA', value: 'EIA' },
		{ label: 'Metric', value: 'Metric' },
		{ label: 'JEDEC', value: 'JEDEC' },
		{ label: 'IPC', value: 'IPC' },
		{ label: 'Custom', value: 'Custom' }
	],

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
			'Thyristors': 'V',
			'LEDs': 'V',
			'Generators': 'Hz',
			'Crystals': 'Hz',
			'Crystals_Passive': 'Hz',
			'Ferrites': 'Ω',
			'Transformers': 'V',
			'Fuses': 'A',
			'Relays': 'V',
			'Switches': 'V',
			'Connectors': 'V'
		};
		return unitMap[categoryName] || '';
	},

	// Автогенерация KiCad FP Filter по категории и корпусу
	generateFpFilter: (categoryName, packageName) => {
		const prefixMap = {
			'Resistors': 'R',
			'Capacitors': 'C',
			'Inductors': 'L',
			'Diodes': 'D',
			'LEDs': 'LED',
			'Transistors': 'Q',
			'IC_General': 'U',
			'Connectors': 'J'
		};
		const prefix = prefixMap[categoryName] || '';
		return packageName ? `${prefix}*${packageName}*` : '';
	},

	// Автогенерация KiCad Keywords
	generateKeywords: (categoryName, packageName, valueDisplay) => {
		return `${categoryName.toLowerCase()} ${packageName} ${valueDisplay || ''}`.trim();
	}
}