export default {
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

	VALUE_UNITS: [
		{ label: 'Ω (Ом)', value: 'Ω' },
		{ label: 'F (Фарад)', value: 'F' },
		{ label: 'H (Генри)', value: 'H' },
		{ label: 'V (Вольт)', value: 'V' },
		{ label: 'A (Ампер)', value: 'A' },
		{ label: 'W (Ватт)', value: 'W' },
		{ label: 'Hz (Герц)', value: 'Hz' }
	],

	PACKAGE_STANDARDS: [
		{ label: 'EIA', value: 'EIA' },
		{ label: 'Metric', value: 'Metric' },
		{ label: 'JEDEC', value: 'JEDEC' },
		{ label: 'IPC', value: 'IPC' },
		{ label: 'Custom', value: 'Custom' }
	],

	// ===== ПАТТЕРНЫ КОРПУСОВ ПО СТАНДАРТАМ =====
	PACKAGE_PATTERNS: {
		// EIA (Imperial) - 4 цифры
		'EIA': {
			pattern: /\b(0201|0402|0603|0805|1206|1210|1812|2010|2512)\b/gi,
			priority: 2,  // Второй приоритет
			format: 'EIA'
		},
		// Metric (mm) - с буквой mm
		'Metric': {
			pattern: /\b((?:0603|1005|1608|2012|3216|3225|4532|5020|6432)\s*mm)\b/gi,
			priority: 1,  // ПЕРВЫЙ ПРИОРИТЕТ
			format: 'mm'
		},
		// Metric без mm (просто цифры)
		'Metric_NoMM': {
			pattern: /\b(0603|1005|1608|2012|3216|3225|4532|5020|6432)\b/gi,
			priority: 1,  // Тоже первый приоритет
			format: 'mm'
		},
		// JEDEC
		'JEDEC': {
			pattern: /\b(SOD-123|SOD-323|SOT-23|SOT-89|SOT-223|SOIC-8|SOIC-14|SOIC-16|QFN-16|QFN-20|QFN-24|BGA-64|BGA-100)\b/gi,
			priority: 3,
			format: 'JEDEC'
		},
		// IPC
		'IPC': {
			pattern: /\bIPC-[0-9A-Z-]+\b/gi,
			priority: 4,
			format: 'IPC'
		}
	},

	// Функция извлечения корпуса с приоритетами
	extractPackage: (packageStr, packagesData = []) => {
		if (!packageStr) return '';

		const str = packageStr.trim();
		const matches = {};

		// Ищем все паттерны
		Object.entries(componentConstants.PACKAGE_PATTERNS).forEach(([name, config]) => {
			const found = str.match(config.pattern);
			if (found && found.length > 0) {
				matches[name] = {
					value: found[0].trim(),
					priority: config.priority,
					format: config.format
				};
			}
		});

		// Если ничего не найдено - пробуем извлечь просто 4 цифры
		if (Object.keys(matches).length === 0) {
			const simpleMatch = str.match(/\b(\d{4})\b/);
			if (simpleMatch) {
				return simpleMatch[1];
			}
			// Или первую часть до "/"
			const parts = str.split('/');
			return parts[0]?.trim() || str;
		}

		// Сортируем по приоритету (1 = высший)
		const sortedMatches = Object.values(matches).sort((a, b) => {
			// Сначала по приоритету
			if (a.priority !== b.priority) {
				return a.priority - b.priority;
			}
			// Если приоритет одинаковый - предпочитаем mm формат
			if (a.format === 'mm') return -1;
			if (b.format === 'mm') return 1;
			return 0;
		});

		// Возвращаем лучший матч
		return sortedMatches[0].value;
	},

	// Функция для получения стандартного названия корпуса из БД
	getStandardPackage: (extractedPackage, packagesData = []) => {
		if (!packagesData || packagesData.length === 0) {
			return extractedPackage;
		}

		// Ищем точное совпадение
		const exactMatch = packagesData.find(p => 
																				 p.name.toLowerCase() === extractedPackage.toLowerCase()
																				);
		if (exactMatch) {
			return exactMatch.name;
		}

		// Ищем по паттерну
		const patternMatch = packagesData.find(p => {
			const patterns = [
				p.name,
				p.standard === 'EIA' ? p.name : null,
				p.standard === 'Metric' ? p.name : null
			].filter(Boolean);

			return patterns.some(pattern => 
													 extractedPackage.toLowerCase().includes(pattern.toLowerCase())
													);
		});

		return patternMatch ? patternMatch.name : extractedPackage;
	},

	// ===== ПЕРЕВОД КАТЕГОРИЙ НА РУССКИЙ =====
	CATEGORY_TRANSLATIONS: {
		'Active Components': 'Активные компоненты',
		'Passive Components': 'Пассивные компоненты',
		'Resistors': 'Резисторы',
		'Capacitors': 'Конденсаторы',
		'Inductors': 'Индуктивности',
		'Diodes': 'Диоды',
		'Transistors': 'Транзисторы',
		'Thyristors': 'Тиристоры',
		'LEDs': 'Светодиоды',
		'Optocouplers': 'Оптопары',
		'Logic': 'Логические микросхемы',
		'Memory': 'Микросхемы памяти',
		'Microcontrollers': 'Микроконтроллеры',
		'FPGA': 'ПЛИС',
		'Linear': 'Линейные микросхемы',
		'Power_Management': 'Микросхемы управления питанием',
		'Data_Converters': 'АЦП/ЦАП',
		'IC_General': 'Прочие ИС',
		'Generators': 'Генераторы',
		'Crystals': 'Кварцевые резонаторы',
		'Crystals_Passive': 'Пассивные резонаторы',
		'Transformers': 'Трансформаторы',
		'Ferrites': 'Ферриты',
		'Connectors': 'Разъёмы',
		'Switches': 'Переключатели',
		'Relays': 'Реле',
		'Fuses': 'Предохранители',
		'Mechanical': 'Механические компоненты',
		'Displays': 'Дисплеи'
	},

	getCategoryRussianName: (categoryName) => {
		if (!categoryName) return '';
		return componentConstants.CATEGORY_TRANSLATIONS[categoryName] || categoryName;
	},

	getEnglishCategoryName: (categoryName) => {
		if (!categoryName) return '';

		const reverseMap = {};
		Object.entries(componentConstants.CATEGORY_TRANSLATIONS).forEach(([en, ru]) => {
			reverseMap[ru] = en;
		});

		// Если нашли русское название — возвращаем английское, иначе как есть
		return reverseMap[categoryName] || categoryName;
	},

	buildValueDisplay: (number, multiplier, unit) => {
		const num = number || 0;
		const mult = multiplier || '';
		const un = unit || '';
		return `${num}${mult}${un}`;
	},

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

	// ===== БИНДЫ АВТОЗАПОЛНЕНИЯ БИБЛИОТЕК (Altium) =====
	// Фиксированное соответствие категория -> Library Path / Library Ref /
	// Footprint Path / Footprint Ref.
	//   libraryPath  : SchLib
	//   libraryRef   : имя компонента в схемной библиотеке
	//   footprintPath: PcbLib
	//   footprintRef : посадочное место (зависит от корпуса/контактов)
	// Для footprintRef используются плейсхолдеры:
	//   {package}      - корпус (например 0402)
	//   {pinCount}     - количество контактов разъёма
	//   {pitch}        - шаг контактов разъёма
	LIBRARY_BINDINGS: {
		'Resistors': {
			libraryPath: 'Passive.SchLib',
			libraryRef: 'Resistor',
			footprintPath: 'Resistors.PcbLib',
			footprintRef: 'R{package}'
		},
		'Capacitors': {
			libraryPath: 'Passive.SchLib',
			libraryRef: 'Capacitor',
			footprintPath: 'Capacitors.PcbLib',
			footprintRef: 'C{package}'
		},
		'Inductors': {
			libraryPath: 'Passive.SchLib',
			libraryRef: 'Inductor',
			footprintPath: 'Inductors.PcbLib',
			footprintRef: 'L{package}'
		},
		'Diodes': {
			libraryPath: 'Active.SchLib',
			libraryRef: 'Diode',
			footprintPath: 'Diodes.PcbLib',
			footprintRef: 'D{package}'
		},
		'LEDs': {
			libraryPath: 'Active.SchLib',
			libraryRef: 'LED',
			footprintPath: 'LED.PcbLib',
			footprintRef: 'LED{package}'
		},
		'Transistors': {
			libraryPath: 'Active.SchLib',
			libraryRef: 'Transistor',
			footprintPath: 'Transistors.PcbLib',
			footprintRef: 'Q{package}'
		},
		'ICs': {
			libraryPath: 'IC.SchLib',
			libraryRef: '',
			footprintPath: 'IC.PcbLib',
			footprintRef: '{package}'
		},
		'Connectors': {
			libraryPath: 'Connectors.SchLib',
			libraryRef: 'J',
			footprintPath: 'Connectors.PcbLib',
			footprintRef: 'J{pinCount}-{pitch}'
		}
	},

	// Возвращает бинды для категории (по английскому имени).
	// Если передано имя на русском - переводит в английское.
	getLibraryBindings: (categoryName) => {
		if (!categoryName) return null;
		const enName = componentConstants.getEnglishCategoryName(categoryName);
		return componentConstants.LIBRARY_BINDINGS[enName] || null;
	},

	// Формирует Footprint Ref на основе бинда и значений корпуса/контактов/шага.
	// packageName - выбранный корпус (например "0402")
	// pinCount    - количество контактов (для разъёмов)
	// pitch       - шаг контактов (для разъёмов)
	buildFootprintRef: (binding, packageName, pinCount, pitch) => {
		if (!binding) return '';
		let ref = binding.footprintRef || '';
		ref = ref.replace(/\{package\}/g, packageName || '');
		ref = ref.replace(/\{pinCount\}/g, pinCount != null && pinCount !== '' ? String(pinCount) : '');
		ref = ref.replace(/\{pitch\}/g, pitch != null && pitch !== '' ? String(pitch) : '');
		return ref;
	}
}