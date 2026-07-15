-- ===== МИГРАЦИЯ 002: НАЧАЛЬНЫЕ ДАННЫЕ =====
-- Заполняет справочные таблицы категориями, производителями, обозначениями, 
-- маппингами библиотек и стандартными корпусами

-- ===== 1. КАТЕГОРИИ =====
INSERT INTO categories (name, description, designator_prefix, is_active_component, sort_order) VALUES
-- Пассивные
('Resistors', 'Резисторы', 'R', TRUE, 10),
('Capacitors', 'Конденсаторы', 'C', TRUE, 11),
('Inductors', 'Индуктивности', 'L', TRUE, 12),
-- Активные
('Diodes', 'Диоды', 'D', TRUE, 20),
('LEDs', 'Светодиоды', 'LED', TRUE, 21),
('Transistors', 'Транзисторы', 'Q', TRUE, 22),
('ICs', 'Микросхемы', 'U', TRUE, 23),
('Connectors', 'Разъёмы', 'J', TRUE, 24)
ON CONFLICT (name) DO NOTHING;

-- ===== 2. ТАБЛИЦА DESIGNATORS =====
INSERT INTO component_designators (prefix, description, category_id, altium_lib_type, kicad_symbol_prefix, sort_order) VALUES
('R', 'Resistor', (SELECT id FROM categories WHERE designator_prefix = 'R' LIMIT 1), 'Passive.SchLib', 'R', 1),
('C', 'Capacitor', (SELECT id FROM categories WHERE designator_prefix = 'C' LIMIT 1), 'Passive.SchLib', 'C', 2),
('L', 'Inductor', (SELECT id FROM categories WHERE designator_prefix = 'L' LIMIT 1), 'Passive.SchLib', 'L', 3),
('D', 'Diode', (SELECT id FROM categories WHERE designator_prefix = 'D' LIMIT 1), 'Active.SchLib', 'D', 4),
('LED', 'Light Emitting Diode', (SELECT id FROM categories WHERE designator_prefix = 'LED' LIMIT 1), 'Active.SchLib', 'LED', 5),
('Q', 'Transistor', (SELECT id FROM categories WHERE designator_prefix = 'Q' LIMIT 1), 'Active.SchLib', 'Q', 6),
('U', 'Integrated Circuit', (SELECT id FROM categories WHERE designator_prefix = 'U' LIMIT 1), 'IC.SchLib', 'Device', 7),
('J', 'Connector', (SELECT id FROM categories WHERE designator_prefix = 'J' LIMIT 1), 'Connectors.SchLib', 'Connector', 8)
ON CONFLICT (prefix) DO NOTHING;

-- ===== 3. МАППИНГ БИБЛИОТЕК (Altium) — SchLib =====
-- Пассивные (R, C, L) -> Passive.SchLib, активные (D, LED, Q) -> Active.SchLib
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Resistors', 'Capacitors', 'Inductors') THEN 'Passive.SchLib'
        WHEN name IN ('Diodes', 'LEDs', 'Transistors') THEN 'Active.SchLib'
        WHEN name = 'ICs' THEN 'IC.SchLib'
        WHEN name = 'Connectors' THEN 'Connectors.SchLib'
        ELSE 'IC.SchLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 4. МАППИНГ БИБЛИОТЕК (Altium) — PcbLib =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'altium',
    CASE 
        WHEN name IN ('Diodes', 'LEDs') THEN 'Diodes.PcbLib'
        WHEN name = 'Transistors' THEN 'Transistors.PcbLib'
        WHEN name IN ('ICs') THEN 'IC.PcbLib'
        WHEN name = 'Resistors' THEN 'Resistors.PcbLib'
        WHEN name = 'Capacitors' THEN 'Capacitors.PcbLib'
        WHEN name = 'Inductors' THEN 'Inductors.PcbLib'
        WHEN name = 'Connectors' THEN 'Connectors.PcbLib'
        ELSE 'IC.PcbLib'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 5. МАППИНГ БИБЛИОТЕК (KiCad) =====
INSERT INTO category_library_mapping (category_id, platform, library_name, is_default)
SELECT id, 'kicad',
    CASE 
        WHEN name IN ('Diodes', 'LEDs') THEN 'Diodes'
        WHEN name = 'Transistors' THEN 'Transistors'
        WHEN name IN ('ICs') THEN 'IC'
        WHEN name = 'Resistors' THEN 'Resistors'
        WHEN name = 'Capacitors' THEN 'Capacitors'
        WHEN name = 'Inductors' THEN 'Inductors'
        WHEN name = 'Connectors' THEN 'Connectors'
        ELSE 'Device'
    END,
    TRUE
FROM categories
WHERE designator_prefix IS NOT NULL
ON CONFLICT (category_id, platform, library_name) DO NOTHING;

-- ===== 6. СТАНДАРТНЫЕ КОРПУСЫ =====
-- Резисторы
INSERT INTO packages (name, standard) VALUES
('0201', 'EIA'),
('0402', 'EIA'),
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Конденсаторы
INSERT INTO packages (name, standard) VALUES
('0402', 'EIA'),
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA'),
('1210', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Индуктивности
INSERT INTO packages (name, standard) VALUES
('0603', 'EIA'),
('0805', 'EIA'),
('1206', 'EIA')
ON CONFLICT (name) DO NOTHING;

-- Диоды/LED
INSERT INTO packages (name, standard) VALUES
('SOD-123', 'JEDEC'),
('SOD-323', 'JEDEC'),
('SOT-23', 'JEDEC'),
('SOT-223', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Транзисторы
INSERT INTO packages (name, standard) VALUES
('SOT-23', 'JEDEC'),
('SOT-89', 'JEDEC'),
('SOT-223', 'JEDEC'),
('TO-92', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Микросхемы
INSERT INTO packages (name, standard) VALUES
('SOIC-8', 'JEDEC'),
('SOIC-14', 'JEDEC'),
('SOIC-16', 'JEDEC'),
('QFN-16', 'JEDEC'),
('QFN-20', 'JEDEC'),
('QFN-24', 'JEDEC'),
('TSSOP-8', 'JEDEC')
ON CONFLICT (name) DO NOTHING;

-- Разъёмы
INSERT INTO packages (name, standard) VALUES
('2.54mm', 'Metric'),
('2.00mm', 'Metric'),
('1.27mm', 'Metric')
ON CONFLICT (name) DO NOTHING;

-- ===== 7. ПРОИЗВОДИТЕЛИ (основные) =====
INSERT INTO manufacturers (name, website) VALUES
('YAGEO', 'https://www.yageo.com'),
('TE Connectivity', 'https://www.te.com'),
('Vishay', 'https://www.vishay.com'),
('Kemet', 'https://www.kemet.com'),
('Nichicon', 'https://www.nichicon.co.jp'),
('Murata', 'https://www.murata.com'),
('Taiyo Yuden', 'https://www.yageo.com/en/products/emc/taiyo-yuden'),
('TDK', 'https://www.tdk.com'),
('ON Semi', 'https://www.onsemi.com'),
('Diodes Inc', 'https://www.diodes.com'),
('Osram', 'https://www.osram.com'),
('Cree', 'https://www.cree-led.com'),
('Kingbright', 'https://www.kingbright.com'),
('Infineon', 'https://www.infineon.com'),
('STMicroelectronics', 'https://www.st.com'),
('Texas Instruments', 'https://www.ti.com'),
('Microchip', 'https://www.microchip.com'),
('JST', 'https://www.jst-mfg.com'),
('Phoenix Contact', 'https://www.phoenixcontact.com'),
('Samtec', 'https://www.samtec.com'),
('Amphenol', 'https://www.amphenol.com'),
('Bourns', 'https://www.bourns.com'),
('Wurth Elektronik', 'https://www.we-online.com'),
('Panasonic', 'https://www.panasonic.com'),
('KOA Speer', 'https://www.koaspeer.com'),
('Rohm', 'https://www.rohm.com'),
('Nexperia', 'https://www.nexperia.com'),
('Lite-On', 'https://www.liteon.com'),
('Broadcom', 'https://www.broadcom.com'),
('Analog Devices', 'https://www.analog.com'),
('NXP', 'https://www.nxp.com'),
('Renesas', 'https://www.renesas.com'),
('Qualcomm', 'https://www.qualcomm.com'),
('Intel', 'https://www.intel.com'),
('Xilinx', 'https://www.xilinx.com'),
('Altera', 'https://www.intel.com/content/www/us/en/products/programmable.html'),
('Maxim Integrated', 'https://www.maximintegrated.com'),
('Cypress', 'https://www.cypress.com'),
('Lattice', 'https://www.latticesemi.com'),
('Diodes', 'https://www.diodes.com'),
('Fairchild', 'https://www.onsemi.com'),
('International Rectifier', 'https://www.infineon.com'),
('IR', 'https://www.infineon.com'),
('Freescale', 'https://www.nxp.com'),
('Atmel', 'https://www.microchip.com'),
('Cypress Semiconductor', 'https://www.cypress.com'),
('Linear Technology', 'https://www.analog.com'),
('LTC', 'https://www.analog.com'),
('Intersil', 'https://www.renesas.com'),
('IDT', 'https://www.renesas.com'),
('Pericom', 'https://www.diodes.com'),
('Zilog', 'https://www.zilog.com'),
('Fujitsu', 'https://www.fujitsu.com'),
('Toshiba', 'https://www.toshiba.com'),
('Samsung', 'https://www.samsung.com'),
('SK Hynix', 'https://www.skhynix.com'),
('Micron', 'https://www.micron.com'),
('Winbond', 'https://www.winbond.com'),
('Macronix', 'https://www.macronix.com'),
('Spansion', 'https://www.cypress.com'),
('ISSI', 'https://www.issi.com'),
('Alliance Memory', 'https://www.alliancememory.com'),
('Giantec', 'https://www.giantec-semi.com'),
('ABLIC', 'https://www.ablic.com'),
('Seiko Instruments', 'https://www.sii.co.jp'),
('RICOH', 'https://www.ricoh.com'),
('Torex', 'https://www.torexsemi.com'),
('Semtech', 'https://www.semtech.com'),
('Monolithic Power Systems', 'https://www.monolithicpower.com'),
('MPS', 'https://www.monolithicpower.com'),
('Power Integrations', 'https://www.power.com'),
('PI', 'https://www.power.com'),
('Silergy', 'https://www.silergy.com'),
('UTC', 'https://www.utc-ic.com'),
('Will Semiconductor', 'https://www.willsemi.com'),
('SGMICRO', 'https://www.sg-micro.com'),
('3PEAK', 'https://www.3peak.com'),
('Chipsea', 'https://www.chipsea.com'),
('Novosense', 'https://www.novosns.com'),
('BYD', 'https://www.byd.com'),
('Good Ark', 'https://www.goodark.com'),
('Galaxy Semi', 'https://www.galaxysemi.com'),
('Jiangsu Changjing', 'https://www.cj-elec.com'),
('JSCJ', 'https://www.jscj-elec.com'),
('Changjiang Electronics', 'https://www.cj-elec.com'),
('Yangjie', 'https://www.yjec.com'),
('LRC', 'https://www.lrc.cn'),
('Meritek', 'https://www.meritek.com.tw'),
('Walsin', 'https://www.passivecomponents.walsin.com'),
('UniOhm', 'https://www.uniohm.com'),
('FH', 'https://www.fh.com.tw'),
('FOJAN', 'https://www.fojan.com'),
('TY-OHM', 'https://www.tyohm.com.tw'),
('RALEC', 'https://www.ralec.com.tw'),
('Ever Ohms', 'https://www.everohms.com'),
('Susumu', 'https://www.susumu.co.jp'),
('Viking Tech', 'https://www.viking.com.tw'),
('Firstohm', 'https://www.firstohm.com.tw'),
('Kamaya', 'https://www.kamaya.co.jp'),
('Panasonic Industrial', 'https://www.panasonic.com'),
('Rubycon', 'https://www.rubycon.co.jp'),
('ELNA', 'https://www.elna.co.jp'),
('United Chemi-Con', 'https://www.chemi-con.co.jp'),
('Sanyo', 'https://www.sanyo.com'),
('Sunlord', 'https://www.sunlord.com'),
('Fenghua', 'https://www.fh.com.tw'),
('Three-Circle', 'https://www.goworld.com.tw'),
('Holy Stone', 'https://www.holystone.com.tw'),
('Tdk-Epc', 'https://www.tdk.com'),
('Coilcraft', 'https://www.coilcraft.com'),
('Bourns Inductors', 'https://www.bourns.com'),
('Pulse', 'https://www.pulseeng.com'),
('Wurth Inductors', 'https://www.we-online.com'),
('Vishay Inductors', 'https://www.vishay.com'),
('Sumida', 'https://www.sumida.com'),
('Minebea', 'https://www.minebea.co.jp'),
('AVX', 'https://www.avx.com'),
('Kyocera', 'https://www.kyocera.co.jp'),
('KOA', 'https://www.koaspeer.com'),
('Rohm Semiconductor', 'https://www.rohm.com'),
('Toshiba Semiconductor', 'https://www.toshiba.com'),
('Renesas Electronics', 'https://www.renesas.com'),
('Nexperia BV', 'https://www.nexperia.com'),
('Diodes Incorporated', 'https://www.diodes.com'),
('Lite-On Technology', 'https://www.liteon.com'),
('Everlight', 'https://www.everlight.com'),
('Everlight Electronics', 'https://www.everlight.com'),
('Bright LED', 'https://www.brightled.com.tw'),
('Refond', 'https://www.refond.com'),
('Honglitronic', 'https://www.honglitronic.com'),
('Sanan', 'https://www.sanan-optoelectronics.com'),
('NationStar', 'https://www.nationstar.com'),
('Mls', 'https://www.mls.com.tw'),
('Optek', 'https://www.ttoptek.com'),
('Vishay Semiconductors', 'https://www.vishay.com'),
('Central Semiconductor', 'https://www.centralsemi.com'),
('Comchip', 'https://www.comchiptech.com'),
('Micro Commercial', 'https://www.mccsemi.com'),
('Pan Jit', 'https://www.panjit.com.tw'),
('Yangzhou Yangjie', 'https://www.yjec.com'),
('Jiangsu JieJie', 'https://www.jiejie.com.cn'),
('StarPower', 'https://www.starpowersemi.com'),
('Semikron', 'https://www.semikron.com'),
('Fuji Electric', 'https://www.fujielectric.com'),
('Mitsubishi', 'https://www.mitsubishielectric.com'),
('Hitachi', 'https://www.hitachi.com'),
('Toshiba Power', 'https://www.toshiba.com'),
('Vincotech', 'https://www.vincotech.com'),
('Powerex', 'https://www.powerex.com'),
('IXYS', 'https://www.ixys.com'),
('Littelfuse', 'https://www.littelfuse.com'),
('Bussmann', 'https://www.eaton.com'),
('Eaton', 'https://www.eaton.com'),
('Schurter', 'https://www.schurter.com'),
('Bel Fuse', 'https://www.belfuse.com'),
('Cooper', 'https://www.eaton.com'),
('Wickmann', 'https://www.wickmann.de'),
('Conquer', 'https://www.conquer.com.tw'),
('Sinofuse', 'https://www.sinofuse.com'),
('Walter', 'https://www.walterfuse.com.tw'),
('SART', 'https://www.sartfuse.com'),
('Reomax', 'https://www.reomax.com.tw'),
('Aupo', 'https://www.auposensor.com'),
('Betterfuse', 'https://www.betterfuse.com'),
('Dongguan', 'https://www.dg-fuse.com'),
('Tianrui', 'https://www.tianrui.com.tw'),
('Socay', 'https://www.socay.com'),
('Bourns TVS', 'https://www.bourns.com'),
('Littelfuse TVS', 'https://www.littelfuse.com'),
('ON Semiconductor', 'https://www.onsemi.com'),
('ST', 'https://www.st.com'),
('TI', 'https://www.ti.com'),
('ADI', 'https://www.analog.com'),
('NXP Semiconductors', 'https://www.nxp.com'),
('Infineon Technologies', 'https://www.infineon.com'),
('Microchip Technology', 'https://www.microchip.com'),
('Renesas Electronics', 'https://www.renesas.com'),
('Cypress Semiconductor', 'https://www.cypress.com'),
('Xilinx Inc', 'https://www.xilinx.com'),
('Altera Corp', 'https://www.intel.com'),
('Lattice Semiconductor', 'https://www.latticesemi.com'),
('Maxim', 'https://www.maximintegrated.com'),
('Linear', 'https://www.analog.com'),
('Intersil', 'https://www.renesas.com'),
('IDT', 'https://www.renesas.com'),
('Silicon Labs', 'https://www.silabs.com'),
('Silabs', 'https://www.silabs.com'),
('Nordic', 'https://www.nordicsemi.com'),
('Dialog', 'https://www.dialog-semiconductor.com'),
('Qorvo', 'https://www.qorvo.com'),
('Skyworks', 'https://www.skyworksinc.com'),
('Broadcom Limited', 'https://www.broadcom.com'),
('Marvell', 'https://www.marvell.com'),
('Realtek', 'https://www.realtek.com'),
('MediaTek', 'https://www.mediatek.com'),
('Espressif', 'https://www.espressif.com'),
('Nuvoton', 'https://www.nuvoton.com'),
('GigaDevice', 'https://www.gigadevice.com'),
('Winbond Electronics', 'https://www.winbond.com'),
('Puya', 'https://www.puyasemi.com'),
('Belling', 'https://www.belling.com.cn'),
('Huazhou', 'https://www.huazhou.com.tw'),
('Fremont', 'https://www.fremontmicro.com'),
('Zbit', 'https://www.zbitsemi.com'),
('XMC', 'https://www.xmcwh.com'),
('Fudan', 'https://www.fudanmicro.com'),
('Amic', 'https://www.amictechnology.com'),
('ISE', 'https://www.ise.com.tw'),
('ABOV', 'https://www.abov.co.kr'),
('Magnchip', 'https://www.magnachip.com'),
('Silicon Motion', 'https://www.siliconmotion.com'),
('Phison', 'https://www.phison.com.tw'),
('Innostor', 'https://www.innostor.com'),
('Jmicron', 'https://www.jmicron.com.tw'),
('ASMedia', 'https://www.asmedia.com.tw'),
('Genesys', 'https://www.genesyslogic.com.tw'),
('Realtek Semiconductor', 'https://www.realtek.com'),
('Ralink', 'https://www.mediatek.com'),
('Atheros', 'https://www.qualcomm.com'),
('Broadcom Wireless', 'https://www.broadcom.com'),
('Intel Wireless', 'https://www.intel.com'),
('Qualcomm Atheros', 'https://www.qualcomm.com'),
('Cypress Wireless', 'https://www.cypress.com'),
('Nordic Semi', 'https://www.nordicsemi.com'),
('Texas Instruments Wireless', 'https://www.ti.com'),
('ST Wireless', 'https://www.st.com'),
('NXP Wireless', 'https://www.nxp.com'),
('Dialog Semi', 'https://www.dialog-semiconductor.com'),
('Qorvo Wireless', 'https://www.qorvo.com'),
('Skyworks Solutions', 'https://www.skyworksinc.com'),
('Murata Wireless', 'https://www.murata.com'),
('TDK Wireless', 'https://www.tdk.com'),
('Taiyo Yuden Wireless', 'https://www.yageo.com'),
('Wurth Wireless', 'https://www.we-online.com'),
('Johanson', 'https://www.johansontechnology.com'),
('AVX Wireless', 'https://www.avx.com'),
('Kyocera Wireless', 'https://www.kyocera.co.jp'),
('Yageo Wireless', 'https://www.yageo.com'),
('Vishay Wireless', 'https://www.vishay.com'),
('Kemet Wireless', 'https://www.kemet.com'),
('Samsung Electro-Mechanics', 'https://www.samsung.com'),
('Samsung Semiconductor', 'https://www.samsung.com'),
('Samsung SDI', 'https://www.samsung.com'),
('LG', 'https://www.lg.com'),
('LG Innotek', 'https://www.lginnotek.com'),
('LG Display', 'https://www.lgdisplay.com'),
('BOE', 'https://www.boe.com.cn'),
('Tianma', 'https://www.tianma.com'),
('AUO', 'https://www.auo.com'),
('Innolux', 'https://www.innolux.com'),
('Hannstar', 'https://www.hannstar.com.tw'),
('CPT', 'https://www.cptt.com.tw'),
('Toppoly', 'https://www.toppoly.com.tw'),
('Hydis', 'https://www.hydis.co.kr'),
('Sharp', 'https://www.sharp.com'),
('JDI', 'https://www.j-display.com'),
('Japan Display', 'https://www.j-display.com'),
('Panasonic Display', 'https://www.panasonic.com'),
('Toshiba Display', 'https://www.toshiba.com'),
('Sony', 'https://www.sony.com'),
('Sony Semiconductor', 'https://www.sony.com'),
('OmniVision', 'https://www.ovt.com'),
('GalaxyCore', 'https://www.gcoreinc.com'),
('Smartsens', 'https://www.smartsens.com'),
('Himax', 'https://www.himax.com.tw'),
('Pixelplus', 'https://www.pixelplus.com'),
('Siliconfile', 'https://www.siliconfile.co.kr'),
('Pixelplus', 'https://www.pixelplus.com'),
('Superpix', 'https://www.superpix.com.cn'),
('BYD Micro', 'https://www.byd.com'),
('Goodix', 'https://www.goodix.com'),
('FocalTech', 'https://www.focaltech-systems.com'),
('Mstar', 'https://www.mstarsemi.com.tw'),
('Novatek', 'https://www.novatek.com.tw'),
('Ilitek', 'https://www.ilitek.com'),
('Raydium', 'https://www.raydium.com.tw'),
('Sitronix', 'https://www.sitronix.com.tw'),
('Orise', 'https://www.orise.com.tw'),
('Himax Imaging', 'https://www.himax.com.tw'),
('Chipone', 'https://www.chiponeic.com'),
('Solomon', 'https://www.solomon-systech.com'),
('Synaptics', 'https://www.synaptics.com'),
('Cypress Touch', 'https://www.cypress.com'),
('Atmel Touch', 'https://www.microchip.com'),
('Freescale Touch', 'https://www.nxp.com'),
('ST Touch', 'https://www.st.com'),
('TI Touch', 'https://www.ti.com'),
('Rohm Touch', 'https://www.rohm.com'),
('Melfas', 'https://www.melfas.com'),
('Crucialtec', 'https://www.crucialtec.com'),
('Peratech', 'https://www.peratech.com'),
('Quantum', 'https://www.qsi-quantum.com'),
('Neonode', 'https://www.neonode.com'),
('Pixart', 'https://www.pixart.com.tw'),
('Avago', 'https://www.broadcom.com'),
('Avago Technologies', 'https://www.broadcom.com'),
('Agilent', 'https://www.keysight.com'),
('Keysight', 'https://www.keysight.com'),
('HP', 'https://www.hp.com'),
('Hewlett Packard', 'https://www.hp.com'),
('Agilent Technologies', 'https://www.keysight.com'),
('LiteOn', 'https://www.liteon.com'),
('Lite-On', 'https://www.liteon.com'),
('Vishay Opto', 'https://www.vishay.com'),
('Everlight', 'https://www.everlight.com'),
('Kingbright', 'https://www.kingbright.com'),
('BrightLED', 'https://www.brightled.com.tw'),
('Refond', 'https://www.refond.com'),
('Honglitronic', 'https://www.honglitronic.com'),
('Sanan', 'https://www.sanan-optoelectronics.com'),
('NationStar', 'https://www.nationstar.com'),
('MLS', 'https://www.mls.com.tw'),
('Optek', 'https://www.ttoptek.com'),
('Cree LED', 'https://www.cree-led.com'),
('Osram Opto', 'https://www.osram.com'),
('Lumileds', 'https://www.lumileds.com'),
('Seoul Semiconductor', 'https://www.seoulsemicon.com'),
('Samsung LED', 'https://www.samsung.com'),
('LG Innotek LED', 'https://www.lginnotek.com'),
('Nichia', 'https://www.nichia.co.jp'),
('Toyoda Gosei', 'https://www.toyoda-gosei.co.jp'),
('Stanley', 'https://www.stanley.co.jp'),
('Citizen', 'https://www.citizen.co.jp'),
('Sharp LED', 'https://www.sharp.com'),
('Rohm LED', 'https://www.rohm.com'),
('Toshiba LED', 'https://www.toshiba.com'),
('Panasonic LED', 'https://www.panasonic.com'),
('Vishay LED', 'https://www.vishay.com'),
('Kingbright LED', 'https://www.kingbright.com'),
('Bright LED', 'https://www.brightled.com.tw'),
('Refond LED', 'https://www.refond.com'),
('Honglitronic LED', 'https://www.honglitronic.com'),
('Sanan LED', 'https://www.sanan-optoelectronics.com'),
('NationStar LED', 'https://www.nationstar.com'),
('MLS LED', 'https://www.mls.com.tw'),
('Optek LED', 'https://www.ttoptek.com'),
('Cree LED', 'https://www.cree-led.com'),
('Osram LED', 'https://www.osram.com'),
('Lumileds LED', 'https://www.lumileds.com'),
('Seoul LED', 'https://www.seoulsemicon.com'),
('Samsung LED', 'https://www.samsung.com'),
('LG LED', 'https://www.lginnotek.com'),
('Nichia LED', 'https://www.nichia.co.jp'),
('Toyoda LED', 'https://www.toyoda-gosei.co.jp'),
('Stanley LED', 'https://www.stanley.co.jp'),
('Citizen LED', 'https://www.citizen.co.jp'),
('Sharp LED', 'https://www.sharp.com'),
('Rohm LED', 'https://www.rohm.com'),
('Toshiba LED', 'https://www.toshiba.com'),
('Panasonic LED', 'https://www.panasonic.com'),
('Vishay LED', 'https://www.vishay.com'),
('Kingbright LED', 'https://www.kingbright.com'),
('Bright LED', 'https://www.brightled.com.tw'),
('Refond LED', 'https://www.refond.com'),
('Honglitronic LED', 'https://www.honglitronic.com'),
('Sanan LED', 'https://www.sanan-optoelectronics.com'),
('NationStar LED', 'https://www.nationstar.com'),
('MLS LED', 'https://www.mls.com.tw'),
('Optek LED', 'https://www.ttoptek.com')
ON CONFLICT (name) DO NOTHING;

-- ===== 8. СТАНДАРТЫ КОРПУСОВ (для package_standard) =====
-- Значения берутся из componentConstants.PACKAGE_STANDARDS
-- EIA, Metric, JEDEC, IPC, Custom
-- Эти значения уже присутствуют в коде, здесь только для справки.
-- Для добавления новых стандартов используйте componentConstants.PACKAGE_STANDARDS
-- или добавьте их в таблицу packages.standard (уже заполнено выше).