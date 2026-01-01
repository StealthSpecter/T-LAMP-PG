export const mockDashboardData = {
  total_lines: 115,
  total_km: 8805.0,
  voltage_breakdown: {
    "800 KV": { count: 2, km: 767.0 },
    "400 KV": { count: 32, km: 4145.0 },
    "220 KV": { count: 19, km: 1100.0 },
    "132 KV": { count: 62, km: 2794.0 }
  },
  recent_trippings: 51,
  states_summary: [
    { id: 1, name: "ARUNACHAL PRADESH", code: "AP", line_count: 13 },
    { id: 2, name: "ASSAM", code: "AS", line_count: 74 },
    { id: 3, name: "MANIPUR", code: "MN", line_count: 9 },
    { id: 4, name: "MEGHALAYA", code: "ML", line_count: 4 },
    { id: 5, name: "MIZORAM", code: "MZ", line_count: 9 },
    { id: 6, name: "NAGALAND", code: "NL", line_count: 9 },
    { id: 7, name: "TRIPURA", code: "TR", line_count: 11 }
  ]
};

export const mockTrippingData = [
  {
    id: 1,
    voltage_level: "132 KV",
    line_name: "132KV IMPHAL NINGTHOUKONG(STATE)",
    fault_date: "2025-08-10T15:59:00",
    fault_time: "15:59:00",
    fault_type: "OTHER UTILITIES",
    tripping_code: "OMSU"
  },
  {
    id: 2,
    voltage_level: "132 KV",
    line_name: "132 KV NIRJULI-LEKHI",
    fault_date: "2025-08-10T09:30:00",
    fault_time: "09:30:00",
    fault_type: "OTHER UTILITIES",
    tripping_code: "LART"
  },
  {
    id: 3,
    voltage_level: "132 KV",
    line_name: "132 KV JIRIBAM-LOKTAK II",
    fault_date: "2025-08-08T11:39:00",
    fault_time: "11:39:00",
    fault_type: "TLAM VERIFICATION PENDING",
    tripping_code: "LHWT"
  },
  {
    id: 4,
    voltage_level: "400 KV",
    line_name: "400 KV PALATANA-BONGAIGAON",
    fault_date: "2025-08-05T14:22:00",
    fault_time: "14:22:00",
    fault_type: "LIGHTNING",
    tripping_code: "LGTN"
  },
  {
    id: 5,
    voltage_level: "220 KV",
    line_name: "220 KV SILCHAR-HAILAKANDI",
    fault_date: "2025-08-03T08:15:00",
    fault_time: "08:15:00",
    fault_type: "VEGETATION",
    tripping_code: "VEGT"
  }
];

export const mockLineData = [
  {
    id: 1,
    line_name: "132 KV AIZAWL-KUMARGHAT",
    voltage_level: "132 KV",
    commission_date: "1989-02-01T00:00:00",
    total_length_km: 120.5,
    state_name: "MIZORAM",
    maintenance_office_name: "AIZAWL"
  },
  {
    id: 2,
    line_name: "400 KV PALATANA-BONGAIGAON",
    voltage_level: "400 KV",
    commission_date: "2015-06-15T00:00:00",
    total_length_km: 287.6,
    state_name: "TRIPURA",
    maintenance_office_name: "PALATANA"
  },
  {
    id: 3,
    line_name: "220 KV SILCHAR-HAILAKANDI",
    voltage_level: "220 KV",
    commission_date: "2010-03-20T00:00:00",
    total_length_km: 45.2,
    state_name: "ASSAM",
    maintenance_office_name: "SILCHAR"
  },
  {
    id: 4,
    line_name: "132 KV DIMAPUR-IMPHAL",
    voltage_level: "132 KV",
    commission_date: "1997-04-01T00:00:00",
    total_length_km: 145.3,
    state_name: "MANIPUR",
    maintenance_office_name: "IMPHAL"
  }
];

export const mockTowerData = [
  {
    id: 1,
    tower_number: 1,
    voltage_level: "132 KV",
    line_name: "132 KV D/C SILCHAR-HAILAKANDI",
    latitude: 24.8294040000,
    longitude: 92.7198580000,
    foundation_type: "RCC"
  },
  {
    id: 2,
    tower_number: 2,
    voltage_level: "132 KV",
    line_name: "132 KV D/C SILCHAR-HAILAKANDI",
    latitude: 24.8298190000,
    longitude: 92.7191740000,
    foundation_type: "Steel"
  },
  {
    id: 3,
    tower_number: 3,
    voltage_level: "400 KV",
    line_name: "400 KV PALATANA-BONGAIGAON",
    latitude: 24.8290970000,
    longitude: 92.7183310000,
    foundation_type: "Composite"
  },
  {
    id: 4,
    tower_number: 1,
    voltage_level: "220 KV",
    line_name: "220 KV SILCHAR-HAILAKANDI",
    latitude: 24.8271898000,
    longitude: 92.7160123000,
    foundation_type: "RCC"
  }
];
