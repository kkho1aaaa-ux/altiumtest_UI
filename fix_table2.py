import json
import re

path = r'c:/Docker/component_library/altiumtest_UI/pages/Main Menu/widgets/modalCSVImport/Tabs1/Table2.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Remove from columnOrder
if 'resistance_ohm' in data.get('columnOrder', []):
    data['columnOrder'].remove('resistance_ohm')
if 'capacitance_pf' in data.get('columnOrder', []):
    data['columnOrder'].remove('capacitance_pf')
if 'inductance_uh' in data.get('columnOrder', []):
    data['columnOrder'].remove('inductance_uh')

# Remove from primaryColumns
for col in ['resistance_ohm', 'capacitance_pf', 'inductance_uh']:
    if col in data.get('primaryColumns', {}):
        del data['primaryColumns'][col]

# Remove from dynamicBindingPathList
data['dynamicBindingPathList'] = [
    item for item in data.get('dynamicBindingPathList', [])
    if not any(col in item.get('key', '') for col in ['resistance_ohm', 'capacitance_pf', 'inductance_uh'])
]

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Done")