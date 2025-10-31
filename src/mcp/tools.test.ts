import { describe, it, expect, beforeEach } from 'vitest';
import {
  makeCreateTool,
  makeUpdateTool,
  makeGetTool,
  makeListTool,
  makeDeleteTool,
} from './index.ts';
import taskBaseSchema from '../tests/taskBase.ts';
import { makeBaseClient } from '../client/base-client.ts';
import { createMockFetcher } from "../client/fetcher.ts";

describe('MCP Tool - Create Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const createTool = makeCreateTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a create tool with the correct metadata', () => {
    expect(createTool.name).toBe('create-records-in-users-table');
    expect(createTool.description).toMatchInlineSnapshot(`
      "Insert new records into the users table.

      Note that the input does NOT use the same format as the Airtable API.
      Look carefully at the input schema to see how to structure the records to create.

      If you use this, consider giving the user the URLs of the created records in your final answer.
      "
    `);
    expect(createTool.inputJsonSchema).toMatchInlineSnapshot(`
          {
            "$schema": "https://json-schema.org/draft/2020-12/schema",
            "additionalProperties": false,
            "properties": {
              "records": {
                "items": {
                  "additionalProperties": false,
                  "properties": {
                    "Email": {
                      "format": "email",
                      "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
                      "type": "string",
                    },
                    "Full Name": {
                      "type": "string",
                    },
                    "Phone": {
                      "description": "please include area code",
                      "type": "string",
                    },
                  },
                  "type": "object",
                },
                "type": "array",
              },
            },
            "required": [
              "records",
            ],
            "type": "object",
          }
        `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      records: [
        {
          "Full Name": 'alice smith',
          Email: 'alice.smith@example.com',
          Phone: '907-555-1234',
        },
      ],
    };
    const expectedAPIInput = {
      records: [
        {
          fields: {
            fldFullName: 'alice smith',
            fldEmail: 'alice.smith@example.com',
            fldPhone: '907-555-1234',
          },
        },
      ],
      returnFieldsByFieldId: true,
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec1234567890ABCD",
          "fields": {
            "fldFullName": 'alice smith',
            "fldEmail": 'alice.smith@example.com',
            "fldPhone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    })
    const result = await createTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{ method: 'POST', path: '/appTaskBase/tblUsers', data: expectedAPIInput }]);
    expect(result).toMatchObject([
      {
        id: "rec1234567890ABCD",
        url: 'https://airtable.com/appTaskBase/tblUsers/rec1234567890ABCD',
        createdTime: "2024-01-01T12:00:00.000Z",
        fields: {
          "Email": "alice.smith@example.com",
          "Full Name": "alice smith",
          "Phone": "907-555-1234",
        },
      },
    ]
    );
  });
});

describe('MCP Tool - Update Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const updateTool = makeUpdateTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create an update tool with the correct metadata', () => {
    expect(updateTool.name).toBe('Update users');
    expect(updateTool.description).toBe('Update existing records in the users table.');
    expect(updateTool.inputJsonSchema).toMatchObject({
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      "additionalProperties": false,
      "properties": {
        "options": {
          "additionalProperties": false,
          "properties": {
            "destructive": {
              "type": "boolean",
            },
            "performUpsert": {
              "additionalProperties": false,
              "properties": {
                "fieldsToMergeOn": {
                  "items": {
                    "type": "string",
                  },
                  "maxItems": 3,
                  "minItems": 1,
                  "type": "array",
                },
              },
              "required": [
                "fieldsToMergeOn",
              ],
              "type": "object",
            },
            "returnFieldsByFieldId": {
              "type": "boolean",
            },
            "typecast": {
              "type": "boolean",
            },
          },
          "type": "object",
        },
        "records": {
          "items": {
            "additionalProperties": false,
            "properties": {
              "fields": {
                "additionalProperties": false,
                "properties": {
                  "Email": {
                    "format": "email",
                    "pattern": "^(?!\\.)(?!.*\\.\\.)([A-Za-z0-9_'+\\-\\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\\-]*\\.)+[A-Za-z]{2,}$",
                    "type": "string",
                  },
                  "Full Name": {
                    "type": "string",
                  },
                  "Phone": {
                    "description": "please include area code",
                    "type": "string",
                  },
                },
                "type": "object",
              },
              "id": {
                "description": "Airtable Record ID of the form 'recXXXXXXXXXXXXXX'",
                "pattern": "^rec[\\s\\S]{14,14}$",
                "type": "string",
              },
            },
            "required": [
              "fields",
            ],
            "type": "object",
          },
          "type": "array",
        },
      },
      "required": [
        "records",
      ],
      "type": "object",
    }
    );
  });
  it('should work for valid input', async () => {
    const validInput = {
      records: [
        {
          id: 'rec1234567890ABCD',
          fields: {
            "Full Name": 'alice jones',
            Email: 'alice.jones@example.com',
          },
        },
      ],
    };
    const expectedAPIInput = {
      records: [
        {
          id: 'rec1234567890ABCD',
          fields: {
            fldFullName: 'alice jones',
            fldEmail: 'alice.jones@example.com',
          },
        },
      ],
      returnFieldsByFieldId: true
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec1234567890ABCD",
          "fields": {
            "fldFullName": 'alice jones',
            "fldEmail": 'alice.jones@example.com',
            "fldPhone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await updateTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'PATCH',
      path: '/appTaskBase/tblUsers',
      data: expectedAPIInput
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec1234567890ABCD",
          "fields": {
            "Email": "alice.jones@example.com",
            "Full Name": "alice jones",
            "Phone": "907-555-1234",
          },
        },
      ]
    });
  });
});

describe('MCP Tool - Get Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const getTool = makeGetTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a get tool with the correct metadata', () => {
    expect(getTool.name).toBe('Get from users');
    expect(getTool.description).toBe('Get a single record by ID from the users table.');
    expect(getTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "options": {
            "additionalProperties": false,
            "properties": {
              "cellFormat": {
                "enum": [
                  "json",
                  "string",
                ],
                "type": "string",
              },
              "returnFieldsByFieldId": {
                "type": "boolean",
              },
            },
            "type": "object",
          },
          "recordId": {
            "description": "Airtable Record ID of the form 'recXXXXXXXXXXXXXX'",
            "pattern": "^rec[\\s\\S]{14,14}$",
            "type": "string",
          },
        },
        "required": [
          "recordId",
        ],
        "type": "object",
      }
    `);
  });
  it('should work for valid input', async () => {
    const validInput = {
      recordId: 'rec1234567890ABCD',
    } as const;
    mockFetcher.setReturnValue({
      "id": "rec1234567890ABCD",
      "fields": {
        "fldFullName": 'alice smith',
        "fldEmail": 'alice.smith@example.com',
        "fldPhone": '907-555-1234',
      },
      "createdTime": "2024-01-01T12:00:00.000Z",
    });
    const result = await getTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers/rec1234567890ABCD?returnFieldsByFieldId=true',
    }]);
    expect(result).toMatchObject({
      "id": "rec1234567890ABCD",
      "fields": {
        "Email": "alice.smith@example.com",
        "Full Name": "alice smith",
        "Phone": "907-555-1234",
      },
      "createdTime": "2024-01-01T12:00:00.000Z",
    });
  });
});

describe('MCP Tool - List Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const listTool = makeListTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a list tool with the correct metadata', () => {
    expect(listTool.name).toBe('List users');
    expect(listTool.description).toBe('List records from the users table with optional filtering and pagination.');
    expect(listTool.inputJsonSchema).toMatchInlineSnapshot(`
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "options": {
            "additionalProperties": false,
            "properties": {
              "cellFormat": {
                "enum": [
                  "json",
                  "string",
                ],
                "type": "string",
              },
              "fields": {
                "description": "If provided, only these fields will be included in the returned records.",
                "items": {
                  "enum": [
                    "Email",
                    "Full Name",
                    "Phone",
                  ],
                  "type": "string",
                },
                "type": "array",
              },
              "filterByFormula": {
                "description": "A formula used to filter records. The formula will be evaluated for each record, and if the result is not 0, false, "", NaN, [], or #Error! the record will be included in the response.

      If combined with the view parameter, only records in that view which satisfy the formula will be returned.

      Formulas should reference fields by their names in braces, eg '{Number of Guests} > 3'",
                "type": "string",
              },
              "maxRecords": {
                "maximum": 9007199254740991,
                "minimum": 1,
                "type": "integer",
              },
              "offset": {
                "description": "If the previous response contained an "offset" field, use that value here to continue from where the last response left off.",
                "type": "string",
              },
              "pageSize": {
                "maximum": 100,
                "minimum": 1,
                "type": "integer",
              },
              "recordMetadata": {
                "items": {
                  "enum": [
                    "commentCount",
                  ],
                  "type": "string",
                },
                "type": "array",
              },
              "sort": {
                "items": {
                  "additionalProperties": false,
                  "properties": {
                    "direction": {
                      "enum": [
                        "asc",
                        "desc",
                      ],
                      "type": "string",
                    },
                    "field": {
                      "enum": [
                        "Email",
                        "Full Name",
                        "Phone",
                      ],
                      "type": "string",
                    },
                  },
                  "required": [
                    "field",
                  ],
                  "type": "object",
                },
                "type": "array",
              },
              "timeZone": {
                "enum": [
                  "utc",
                  "client",
                  "Africa/Abidjan",
                  "Africa/Accra",
                  "Africa/Addis_Ababa",
                  "Africa/Algiers",
                  "Africa/Asmara",
                  "Africa/Bamako",
                  "Africa/Bangui",
                  "Africa/Banjul",
                  "Africa/Bissau",
                  "Africa/Blantyre",
                  "Africa/Brazzaville",
                  "Africa/Bujumbura",
                  "Africa/Cairo",
                  "Africa/Casablanca",
                  "Africa/Ceuta",
                  "Africa/Conakry",
                  "Africa/Dakar",
                  "Africa/Dar_es_Salaam",
                  "Africa/Djibouti",
                  "Africa/Douala",
                  "Africa/El_Aaiun",
                  "Africa/Freetown",
                  "Africa/Gaborone",
                  "Africa/Harare",
                  "Africa/Johannesburg",
                  "Africa/Juba",
                  "Africa/Kampala",
                  "Africa/Khartoum",
                  "Africa/Kigali",
                  "Africa/Kinshasa",
                  "Africa/Lagos",
                  "Africa/Libreville",
                  "Africa/Lome",
                  "Africa/Luanda",
                  "Africa/Lubumbashi",
                  "Africa/Lusaka",
                  "Africa/Malabo",
                  "Africa/Maputo",
                  "Africa/Maseru",
                  "Africa/Mbabane",
                  "Africa/Mogadishu",
                  "Africa/Monrovia",
                  "Africa/Nairobi",
                  "Africa/Ndjamena",
                  "Africa/Niamey",
                  "Africa/Nouakchott",
                  "Africa/Ouagadougou",
                  "Africa/Porto-Novo",
                  "Africa/Sao_Tome",
                  "Africa/Tripoli",
                  "Africa/Tunis",
                  "Africa/Windhoek",
                  "America/Adak",
                  "America/Anchorage",
                  "America/Anguilla",
                  "America/Antigua",
                  "America/Araguaina",
                  "America/Argentina/Buenos_Aires",
                  "America/Argentina/Catamarca",
                  "America/Argentina/Cordoba",
                  "America/Argentina/Jujuy",
                  "America/Argentina/La_Rioja",
                  "America/Argentina/Mendoza",
                  "America/Argentina/Rio_Gallegos",
                  "America/Argentina/Salta",
                  "America/Argentina/San_Juan",
                  "America/Argentina/San_Luis",
                  "America/Argentina/Tucuman",
                  "America/Argentina/Ushuaia",
                  "America/Aruba",
                  "America/Asuncion",
                  "America/Atikokan",
                  "America/Bahia",
                  "America/Bahia_Banderas",
                  "America/Barbados",
                  "America/Belem",
                  "America/Belize",
                  "America/Blanc-Sablon",
                  "America/Boa_Vista",
                  "America/Bogota",
                  "America/Boise",
                  "America/Cambridge_Bay",
                  "America/Campo_Grande",
                  "America/Cancun",
                  "America/Caracas",
                  "America/Cayenne",
                  "America/Cayman",
                  "America/Chicago",
                  "America/Chihuahua",
                  "America/Costa_Rica",
                  "America/Creston",
                  "America/Cuiaba",
                  "America/Curacao",
                  "America/Danmarkshavn",
                  "America/Dawson",
                  "America/Dawson_Creek",
                  "America/Denver",
                  "America/Detroit",
                  "America/Dominica",
                  "America/Edmonton",
                  "America/Eirunepe",
                  "America/El_Salvador",
                  "America/Fort_Nelson",
                  "America/Fortaleza",
                  "America/Glace_Bay",
                  "America/Godthab",
                  "America/Goose_Bay",
                  "America/Grand_Turk",
                  "America/Grenada",
                  "America/Guadeloupe",
                  "America/Guatemala",
                  "America/Guayaquil",
                  "America/Guyana",
                  "America/Halifax",
                  "America/Havana",
                  "America/Hermosillo",
                  "America/Indiana/Indianapolis",
                  "America/Indiana/Knox",
                  "America/Indiana/Marengo",
                  "America/Indiana/Petersburg",
                  "America/Indiana/Tell_City",
                  "America/Indiana/Vevay",
                  "America/Indiana/Vincennes",
                  "America/Indiana/Winamac",
                  "America/Inuvik",
                  "America/Iqaluit",
                  "America/Jamaica",
                  "America/Juneau",
                  "America/Kentucky/Louisville",
                  "America/Kentucky/Monticello",
                  "America/Kralendijk",
                  "America/La_Paz",
                  "America/Lima",
                  "America/Los_Angeles",
                  "America/Lower_Princes",
                  "America/Maceio",
                  "America/Managua",
                  "America/Manaus",
                  "America/Marigot",
                  "America/Martinique",
                  "America/Matamoros",
                  "America/Mazatlan",
                  "America/Menominee",
                  "America/Merida",
                  "America/Metlakatla",
                  "America/Mexico_City",
                  "America/Miquelon",
                  "America/Moncton",
                  "America/Monterrey",
                  "America/Montevideo",
                  "America/Montserrat",
                  "America/Nassau",
                  "America/New_York",
                  "America/Nipigon",
                  "America/Nome",
                  "America/Noronha",
                  "America/North_Dakota/Beulah",
                  "America/North_Dakota/Center",
                  "America/North_Dakota/New_Salem",
                  "America/Nuuk",
                  "America/Ojinaga",
                  "America/Panama",
                  "America/Pangnirtung",
                  "America/Paramaribo",
                  "America/Phoenix",
                  "America/Port-au-Prince",
                  "America/Port_of_Spain",
                  "America/Porto_Velho",
                  "America/Puerto_Rico",
                  "America/Punta_Arenas",
                  "America/Rainy_River",
                  "America/Rankin_Inlet",
                  "America/Recife",
                  "America/Regina",
                  "America/Resolute",
                  "America/Rio_Branco",
                  "America/Santarem",
                  "America/Santiago",
                  "America/Santo_Domingo",
                  "America/Sao_Paulo",
                  "America/Scoresbysund",
                  "America/Sitka",
                  "America/St_Barthelemy",
                  "America/St_Johns",
                  "America/St_Kitts",
                  "America/St_Lucia",
                  "America/St_Thomas",
                  "America/St_Vincent",
                  "America/Swift_Current",
                  "America/Tegucigalpa",
                  "America/Thule",
                  "America/Thunder_Bay",
                  "America/Tijuana",
                  "America/Toronto",
                  "America/Tortola",
                  "America/Vancouver",
                  "America/Whitehorse",
                  "America/Winnipeg",
                  "America/Yakutat",
                  "America/Yellowknife",
                  "Antarctica/Casey",
                  "Antarctica/Davis",
                  "Antarctica/DumontDUrville",
                  "Antarctica/Macquarie",
                  "Antarctica/Mawson",
                  "Antarctica/McMurdo",
                  "Antarctica/Palmer",
                  "Antarctica/Rothera",
                  "Antarctica/Syowa",
                  "Antarctica/Troll",
                  "Antarctica/Vostok",
                  "Arctic/Longyearbyen",
                  "Asia/Aden",
                  "Asia/Almaty",
                  "Asia/Amman",
                  "Asia/Anadyr",
                  "Asia/Aqtau",
                  "Asia/Aqtobe",
                  "Asia/Ashgabat",
                  "Asia/Atyrau",
                  "Asia/Baghdad",
                  "Asia/Bahrain",
                  "Asia/Baku",
                  "Asia/Bangkok",
                  "Asia/Barnaul",
                  "Asia/Beirut",
                  "Asia/Bishkek",
                  "Asia/Brunei",
                  "Asia/Chita",
                  "Asia/Choibalsan",
                  "Asia/Colombo",
                  "Asia/Damascus",
                  "Asia/Dhaka",
                  "Asia/Dili",
                  "Asia/Dubai",
                  "Asia/Dushanbe",
                  "Asia/Famagusta",
                  "Asia/Gaza",
                  "Asia/Hebron",
                  "Asia/Ho_Chi_Minh",
                  "Asia/Hong_Kong",
                  "Asia/Hovd",
                  "Asia/Irkutsk",
                  "Asia/Istanbul",
                  "Asia/Jakarta",
                  "Asia/Jayapura",
                  "Asia/Jerusalem",
                  "Asia/Kabul",
                  "Asia/Kamchatka",
                  "Asia/Karachi",
                  "Asia/Kathmandu",
                  "Asia/Khandyga",
                  "Asia/Kolkata",
                  "Asia/Krasnoyarsk",
                  "Asia/Kuala_Lumpur",
                  "Asia/Kuching",
                  "Asia/Kuwait",
                  "Asia/Macau",
                  "Asia/Magadan",
                  "Asia/Makassar",
                  "Asia/Manila",
                  "Asia/Muscat",
                  "Asia/Nicosia",
                  "Asia/Novokuznetsk",
                  "Asia/Novosibirsk",
                  "Asia/Omsk",
                  "Asia/Oral",
                  "Asia/Phnom_Penh",
                  "Asia/Pontianak",
                  "Asia/Pyongyang",
                  "Asia/Qatar",
                  "Asia/Qostanay",
                  "Asia/Qyzylorda",
                  "Asia/Rangoon",
                  "Asia/Riyadh",
                  "Asia/Sakhalin",
                  "Asia/Samarkand",
                  "Asia/Seoul",
                  "Asia/Shanghai",
                  "Asia/Singapore",
                  "Asia/Srednekolymsk",
                  "Asia/Taipei",
                  "Asia/Tashkent",
                  "Asia/Tbilisi",
                  "Asia/Tehran",
                  "Asia/Thimphu",
                  "Asia/Tokyo",
                  "Asia/Tomsk",
                  "Asia/Ulaanbaatar",
                  "Asia/Urumqi",
                  "Asia/Ust-Nera",
                  "Asia/Vientiane",
                  "Asia/Vladivostok",
                  "Asia/Yakutsk",
                  "Asia/Yangon",
                  "Asia/Yekaterinburg",
                  "Asia/Yerevan",
                  "Atlantic/Azores",
                  "Atlantic/Bermuda",
                  "Atlantic/Canary",
                  "Atlantic/Cape_Verde",
                  "Atlantic/Faroe",
                  "Atlantic/Madeira",
                  "Atlantic/Reykjavik",
                  "Atlantic/South_Georgia",
                  "Atlantic/St_Helena",
                  "Atlantic/Stanley",
                  "Australia/Adelaide",
                  "Australia/Brisbane",
                  "Australia/Broken_Hill",
                  "Australia/Currie",
                  "Australia/Darwin",
                  "Australia/Eucla",
                  "Australia/Hobart",
                  "Australia/Lindeman",
                  "Australia/Lord_Howe",
                  "Australia/Melbourne",
                  "Australia/Perth",
                  "Australia/Sydney",
                  "Europe/Amsterdam",
                  "Europe/Andorra",
                  "Europe/Astrakhan",
                  "Europe/Athens",
                  "Europe/Belgrade",
                  "Europe/Berlin",
                  "Europe/Bratislava",
                  "Europe/Brussels",
                  "Europe/Bucharest",
                  "Europe/Budapest",
                  "Europe/Busingen",
                  "Europe/Chisinau",
                  "Europe/Copenhagen",
                  "Europe/Dublin",
                  "Europe/Gibraltar",
                  "Europe/Guernsey",
                  "Europe/Helsinki",
                  "Europe/Isle_of_Man",
                  "Europe/Istanbul",
                  "Europe/Jersey",
                  "Europe/Kaliningrad",
                  "Europe/Kiev",
                  "Europe/Kirov",
                  "Europe/Lisbon",
                  "Europe/Ljubljana",
                  "Europe/London",
                  "Europe/Luxembourg",
                  "Europe/Madrid",
                  "Europe/Malta",
                  "Europe/Mariehamn",
                  "Europe/Minsk",
                  "Europe/Monaco",
                  "Europe/Moscow",
                  "Europe/Nicosia",
                  "Europe/Oslo",
                  "Europe/Paris",
                  "Europe/Podgorica",
                  "Europe/Prague",
                  "Europe/Riga",
                  "Europe/Rome",
                  "Europe/Samara",
                  "Europe/San_Marino",
                  "Europe/Sarajevo",
                  "Europe/Saratov",
                  "Europe/Simferopol",
                  "Europe/Skopje",
                  "Europe/Sofia",
                  "Europe/Stockholm",
                  "Europe/Tallinn",
                  "Europe/Tirane",
                  "Europe/Ulyanovsk",
                  "Europe/Uzhgorod",
                  "Europe/Vaduz",
                  "Europe/Vatican",
                  "Europe/Vienna",
                  "Europe/Vilnius",
                  "Europe/Volgograd",
                  "Europe/Warsaw",
                  "Europe/Zagreb",
                  "Europe/Zaporozhye",
                  "Europe/Zurich",
                  "Indian/Antananarivo",
                  "Indian/Chagos",
                  "Indian/Christmas",
                  "Indian/Cocos",
                  "Indian/Comoro",
                  "Indian/Kerguelen",
                  "Indian/Mahe",
                  "Indian/Maldives",
                  "Indian/Mauritius",
                  "Indian/Mayotte",
                  "Indian/Reunion",
                  "Pacific/Apia",
                  "Pacific/Auckland",
                  "Pacific/Bougainville",
                  "Pacific/Chatham",
                  "Pacific/Chuuk",
                  "Pacific/Easter",
                  "Pacific/Efate",
                  "Pacific/Enderbury",
                  "Pacific/Fakaofo",
                  "Pacific/Fiji",
                  "Pacific/Funafuti",
                  "Pacific/Galapagos",
                  "Pacific/Gambier",
                  "Pacific/Guadalcanal",
                  "Pacific/Guam",
                  "Pacific/Honolulu",
                  "Pacific/Kanton",
                  "Pacific/Kiritimati",
                  "Pacific/Kosrae",
                  "Pacific/Kwajalein",
                  "Pacific/Majuro",
                  "Pacific/Marquesas",
                  "Pacific/Midway",
                  "Pacific/Nauru",
                  "Pacific/Niue",
                  "Pacific/Norfolk",
                  "Pacific/Noumea",
                  "Pacific/Pago_Pago",
                  "Pacific/Palau",
                  "Pacific/Pitcairn",
                  "Pacific/Pohnpei",
                  "Pacific/Port_Moresby",
                  "Pacific/Rarotonga",
                  "Pacific/Saipan",
                  "Pacific/Tahiti",
                  "Pacific/Tarawa",
                  "Pacific/Tongatapu",
                  "Pacific/Wake",
                  "Pacific/Wallis",
                ],
                "type": "string",
              },
              "userLocale": {
                "type": "string",
              },
              "view": {
                "type": "string",
              },
            },
            "type": "object",
          },
        },
        "type": "object",
      }
    `);
  });
  it('should work for valid input with no options', async () => {
    const validInput = {};
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "fldFullName": 'alice smith',
            "fldEmail": 'alice.smith@example.com',
            "fldPhone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await listTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers?returnFieldsByFieldId=true',
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "fields": {
            "Email": "alice.smith@example.com",
            "Full Name": "alice smith",
            "Phone": "907-555-1234",
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
  });
  it('should work with filtering options', async () => {
    const validInput = {
      options: {
        filterByFormula: 'Email = "alice.smith@example.com"',
        maxRecords: 10,
      }
    };
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec123",
          "fields": {
            "fldFullName": 'alice smith',
            "fldEmail": 'alice.smith@example.com',
            "fldPhone": '907-555-1234',
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
    const result = await listTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'GET',
      path: '/appTaskBase/tblUsers?returnFieldsByFieldId=true&maxRecords=10&filterByFormula=Email+%3D+%22alice.smith%40example.com%22',
    }]);
    expect(result).toMatchObject({
      records: [
        {
          "id": "rec123",
          "fields": {
            "Email": "alice.smith@example.com",
            "Full Name": "alice smith",
            "Phone": "907-555-1234",
          },
          "createdTime": "2024-01-01T12:00:00.000Z",
        }
      ]
    });
  });
});

describe('MCP Tool - Delete Tool', () => {
  const mockFetcher = createMockFetcher();
  const client = makeBaseClient({ baseSchema: taskBaseSchema, fetcher: mockFetcher });
  const usersTableClient = client.tables.users;
  const deleteTool = makeDeleteTool(usersTableClient);
  beforeEach(() => {
    mockFetcher.reset();
  });
  it('should create a delete tool with the correct metadata', () => {
    expect(deleteTool.name).toBe('Delete from users');
    expect(deleteTool.description).toMatchInlineSnapshot(`
      "Delete records by ID from the users table.

          You can delete up to 10 records at a time.
          
          Returns the list of deleted record IDs."
    `);
    expect(deleteTool.inputJsonSchema).toMatchObject(
      {
        "$schema": "https://json-schema.org/draft/2020-12/schema",
        "additionalProperties": false,
        "properties": {
          "recordIds": {
            "items": {
              "type": "string",
            },
            "maxItems": 10,
            "minItems": 1,
            "type": "array",
          },
        },
        "required": [
          "recordIds",
        ],
        "type": "object",
      }
    );
  });
  it('should work for valid input', async () => {
    const validInput = {
      recordIds: ['rec1234567890ABCD', 'rec1234567890ABCE'],
    } as const;
    mockFetcher.setReturnValue({
      "records": [
        {
          "id": "rec1234567890ABCD",
          "deleted": true,
        },
        {
          "id": "rec1234567890ABCE",
          "deleted": true,
        }
      ]
    });
    const result = await deleteTool.execute(validInput);
    expect(mockFetcher.getCallHistory()).toEqual([{
      method: 'DELETE',
      path: '/appTaskBase/tblUsers?records%5B%5D=rec1234567890ABCD&records%5B%5D=rec1234567890ABCE',
    }]);
    expect(result).toMatchObject(["rec1234567890ABCD", "rec1234567890ABCE"]);
  });
});