const http = require('http');

const hostname = '127.0.0.1';
const port = 12345;

// JSON example from openexchangerates.org
http.createServer((req, res) => {
	res.writeHead(200, { 'Content-Type': 'application/json' });
	res.end('{ "disclaimer": "Exchange rates provided for informational purposes only and do not constitute financial advice of any kind. Although every attempt is made to ensure quality, no guarantees are made of accuracy, validity, availability, or fitness for any purpose. All usage subject to acceptance of Terms: https://openexchangerates.org/terms/", "license": "Data sourced from various providers; resale prohibited; no warranties given of any kind. All usage subject to License Agreement: https://openexchangerates.org/license/", "timestamp": 1453449661, "base": "USD", "rates": { "AED": 3.673083, "AFN": 68.580001, "ALL": 127.3484, "AMD": 485.955002, "ANG": 1.788775, "AOA": 155.553, "ARS": 13.52, "AUD": 1.42465, "AWG": 1.793333, "AZN": 1.608483, "BAM": 1.804351, "BBD": 2, "BDT": 78.82051, "BGN": 1.804545, "BHD": 0.376961, "BIF": 1573.99, "BMD": 1, "BND": 1.437063, "BOB": 6.923602, "BRL": 4.149328, "BSD": 1, "BTC": 0.002536384435, "BTN": 67.812599, "BWP": 11.699538, "BYR": 21303.275, "BZD": 1.998635, "CAD": 1.42934, "CDF": 928.36125, "CHF": 1.009426, "CLF": 0.024602, "CLP": 725.493406, "CNY": 6.579246, "COP": 3325.905, "CRC": 535.5952, "CUC": 1, "CUP": 1.001475, "CVE": 101.540834, "CZK": 24.95956, "DJF": 177.657749, "DKK": 6.887525, "DOP": 45.81587, "DZD": 107.63328, "EEK": 14.424175, "EGP": 7.829774, "ERN": 15.0015, "ETB": 21.29806, "EUR": 0.923952, "FJD": 2.165183, "FKP": 0.702522, "GBP": 0.702522, "GEL": 2.452425, "GGP": 0.702522, "GHS": 3.997926, "GIP": 0.702522, "GMD": 39.51524, "GNF": 7813.495098, "GTQ": 7.645207, "GYD": 206.153336, "HKD": 7.797985, "HNL": 22.51953, "HRK": 7.07792, "HTG": 58.72145, "HUF": 289.986201, "IDR": 13864, "ILS": 3.970373, "IMP": 0.702522, "INR": 67.78884, "IQD": 1102.438325, "IRR": 30000, "ISK": 130.516199, "JEP": 0.702522, "JMD": 120.9369, "JOD": 0.709176, "JPY": 117.8866, "KES": 102.322801, "KGS": 75.889499, "KHR": 4066.679951, "KMF": 453.675372, "KPW": 900.09, "KRW": 1203.115015, "KWD": 0.304725, "KYD": 0.824947, "KZT": 385.258188, "LAK": 8155.485098, "LBP": 1512.223333, "LKR": 144.593201, "LRD": 84.651538, "LSL": 16.56825, "LTL": 3.11572, "LVL": 0.638775, "LYD": 1.390908, "MAD": 9.928941, "MDL": 20.5661, "MGA": 3219.349967, "MKD": 56.83599, "MMK": 1301.142512, "MNT": 2001.666667, "MOP": 8.05101, "MRO": 343.0343, "MTL": 0.683738, "MUR": 36.168325, "MVR": 15.307867, "MWK": 708.174595, "MXN": 18.61214, "MYR": 4.319982, "MZN": 45.1475, "NAD": 16.6066, "NGN": 198.981499, "NIO": 27.80748, "NOK": 8.814327, "NPR": 108.712901, "NZD": 1.530394, "OMR": 0.385034, "PAB": 1, "PEN": 3.451335, "PGK": 3.0263, "PHP": 47.81348, "PKR": 105.0543, "PLN": 4.134197, "PYG": 5939.916667, "QAR": 3.641563, "RON": 4.179244, "RSD": 113.369321, "RUB": 81.38118, "RWF": 756.500872, "SAR": 3.753561, "SBD": 8.225062, "SCR": 12.803138, "SDG": 6.112404, "SEK": 8.580903, "SGD": 1.431391, "SHP": 0.702522, "SLL": 4123.5, "SOS": 617.912125, "SRD": 3.9925, "STD": 22573.4, "SVC": 8.759931, "SYP": 219.903333, "SZL": 16.6077, "THB": 36.12053, "TJS": 7.512, "TMT": 3.501533, "TND": 2.048811, "TOP": 2.261191, "TRY": 3.019678, "TTD": 6.451479, "TWD": 33.60048, "TZS": 2191.670033, "UAH": 24.72054, "UGX": 3471.211667, "USD": 1, "UYU": 31.00191, "UZS": 2820.984986, "VEF": 6.320459, "VND": 22387.35, "VUV": 113.98875, "WST": 2.605952, "XAF": 604.951202, "XAG": 0.071044, "XAU": 0.000911, "XCD": 2.70102, "XDR": 0.724621, "XOF": 609.075642, "XPD": 0.002009, "XPF": 110.084175, "XPT": 0.001222, "YER": 214.9724, "ZAR": 16.56691, "ZMK": 5252.024745, "ZMW": 11.224663, "ZWL": 322.322775 } }');
}).listen(port, hostname, () => {
	console.log(`Server running at http://${hostname}:${port}/`);
});