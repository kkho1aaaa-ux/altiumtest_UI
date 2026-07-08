export default {
	// Парсинг номинала: "150 pF", "1,500 pF", "0.022 uF" → {number, multiplier, unit}
	parseValue: (valueStr) => {
		if (valueStr === null || valueStr === undefined) return { number: 0, multiplier: '', unit: '' };

		const str = String(valueStr).trim().replace(/\s+/g, ' ').replace(/,/g, '');

		if (str === '') return { number: 0, multiplier: '', unit: '' };

		const regex = /^([\d.]+)\s*([pnumkKMG]?)\s*([a-zA-ZΩ]+)?$/;
		const match = str.match(regex);

		if (!match) {
			const num = parseFloat(str);
			return { number: isNaN(num) ? 0 : num, multiplier: '', unit: '' };
		}

		return {
			number: parseFloat(match[1]) || 0,
			multiplier: match[2] || '',
			unit: match[3] || ''
		};
	},

	// Расчет базового значения (в основных единицах)
	calculateBaseValue: (number, multiplier) => {
		const multipliers = {
			'p': 1e-12,  // пико
			'n': 1e-9,   // нано
			'u': 1e-6,   // микро
			'm': 1e-3,   // милли
			'': 1,       // без множителя
			'K': 1e3,    // кило
			'M': 1e6,    // мега
			'G': 1e9     // гига
		};

		const mult = multipliers[multiplier] || 1;
		return number * mult;
	},

	// Парсинг tolerance: "10%" → 10, "0.1" → 0.1
	parseTolerance: (str) => {
		if (str === null || str === undefined) return null;

		const s = String(str).trim();

		if (!isNaN(parseFloat(s)) && !s.includes('%')) {
			return parseFloat(s);
		}

		const match = s.match(/([\d.]+)\s*%/);
		return match ? parseFloat(match[1]) : null;
	},

	// Парсинг напряжения: "200 VDC" → 200
	parseVoltage: (str) => {
		if (str === null || str === undefined) return null;

		const s = String(str).trim();
		const match = s.match(/([\d.]+)/);
		return match ? parseFloat(match[1]) : null;
	},

	// Парсинг температуры: "125°C" → 125, "-55°C" → -55
	parseTemperature: (str) => {
		if (str === null || str === undefined) return null;

		const s = String(str).trim();
		const match = s.match(/([+-]?\d+)/);
		return match ? parseFloat(match[1]) : null;
	}
}