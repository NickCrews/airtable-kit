export const SAMPLE_SCHEMA = {
    "tables": [
        {
            "id": "tblXxZtsavNuPBVKl",
            "name": "Events",
            "primaryFieldId": "fldXGoBeshAgNvTyI",
            "fields": [
                {
                    "type": "singleLineText",
                    "id": "fldXGoBeshAgNvTyI",
                    "name": "Event Title",
                    "description":
                        'eg "Holland - Girdwood FR" or "Eischeid - Potluck FR"',
                },
                {
                    "type": "multipleSelects",
                    "options": {
                        "choices": [
                            {
                                "id": "sel1iWoJu3CgReyAf",
                                "name": "With Digital",
                                "color": "tealLight1",
                            },
                            {
                                "id": "selYAknPWhpt2bgy0",
                                "name": "Cohost Recruitment",
                                "color": "blueLight2",
                            },
                            {
                                "id": "sel2L50rHqV4U4bRH",
                                "name": "Hannah Action Required",
                                "color": "orangeLight1",
                            },
                            {
                                "id": "selPagORmBvImutYw",
                                "name": "Waiting on Creative",
                                "color": "pinkLight1",
                            },
                            {
                                "id": "selHUjKKZuTL56RRU",
                                "name": "Kim Action Required",
                                "color": "purpleLight1",
                            },
                            {
                                "id": "selD6OFLplPt520Qz",
                                "name": "Waiting on Client",
                                "color": "cyanLight1",
                            },
                            {
                                "id": "selQlMccF8HE2gCL6",
                                "name": "On Track",
                                "color": "greenLight1",
                            },
                            {
                                "id": "selUoND6XACdKtBNH",
                                "name": "Complete",
                                "color": "grayLight1",
                            },
                            {
                                "id": "selyVILm5MUZcLRrO",
                                "name": "Cancelled",
                                "color": "grayLight1",
                            },
                        ],
                    },
                    "id": "fldNsGrW3JhS9ceQn",
                    "name": "Tags",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "flddAkvx7DVu2DSz3",
                    },
                    "id": "fldWNWquOwXPQkYaN",
                    "name": "Client(s)",
                },
                {
                    "type": "singleSelect",
                    "options": {
                        "choices": [
                            {
                                "id": "selP5uBC3P2jRAoi3",
                                "name": "Fundraiser",
                                "color": "tealLight2",
                            },
                            {
                                "id": "selO0NEtDx34wgYzf",
                                "name": "Meet & Greet",
                                "color": "orangeLight2",
                            },
                        ],
                    },
                    "id": "fldxjj28UXFcfytVZ",
                    "name": "Event Type",
                },
                {
                    "type": "dateTime",
                    "options": {
                        "dateFormat": {
                            "name": "local",
                            "format": "l",
                        },
                        "timeFormat": {
                            "name": "12hour",
                            "format": "h:mma",
                        },
                        "timeZone": "America/Anchorage",
                    },
                    "id": "fldMB7iO24wqe8cKt",
                    "name": "Guest Start Time",
                    "description":
                        "This is when the GUESTS should arrive. Only put CONFIRMED dates here; put tentative dates in the event description.",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "purpleBright",
                    },
                    "id": "fldBKTIoEAVFzppj5",
                    "name": "Date Confirmed?",
                    "description":
                        "The date is no longer tentative, it is locked in.",
                },
                {
                    "type": "number",
                    "options": {
                        "precision": 0,
                    },
                    "id": "fld7SXEjpe6fBFIFe",
                    "name": "Setup Duration (minutes)",
                    "description":
                        "How much earlier than guests should staff show up to the event?",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "DATEADD({fldMB7iO24wqe8cKt}, -{fld7SXEjpe6fBFIFe}, 'minute')",
                        "referencedFieldIds": [
                            "fldMB7iO24wqe8cKt",
                            "fld7SXEjpe6fBFIFe",
                        ],
                        "result": {
                            "type": "dateTime",
                            "options": {
                                "dateFormat": {
                                    "name": "local",
                                    "format": "l",
                                },
                                "timeFormat": {
                                    "name": "12hour",
                                    "format": "h:mma",
                                },
                                "timeZone": "America/Anchorage",
                            },
                        },
                    },
                    "id": "fldZSwrwEii6KVLAS",
                    "name": "Setup Time",
                    "description":
                        "Calculates the start time for hosts and SCG staff, which is {Setup Time (in minutes)} minutes before the guest start time.",
                },
                {
                    "type": "number",
                    "options": {
                        "precision": 0,
                    },
                    "id": "fldubx6tvXBJwKwDs",
                    "name": "Duration (minutes)",
                    "description":
                        "How long should the main event last (when guests are there)",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "DATEADD({fldMB7iO24wqe8cKt}, {fldubx6tvXBJwKwDs}, 'minute')",
                        "referencedFieldIds": [
                            "fldMB7iO24wqe8cKt",
                            "fldubx6tvXBJwKwDs",
                        ],
                        "result": {
                            "type": "dateTime",
                            "options": {
                                "dateFormat": {
                                    "name": "local",
                                    "format": "l",
                                },
                                "timeFormat": {
                                    "name": "12hour",
                                    "format": "h:mma",
                                },
                                "timeZone": "America/Anchorage",
                            },
                        },
                    },
                    "id": "fldm66mYGs4m2JCwP",
                    "name": "End Time",
                    "description":
                        "Calculates the end time as 3 hours after the guest start time.",
                },
                {
                    "type": "multipleAttachments",
                    "options": {
                        "isReversed": false,
                    },
                    "id": "fldhdz070CExkpuEZ",
                    "name": "Graphic",
                },
                {
                    "type": "richText",
                    "id": "fldscSAzjQVb9qZrK",
                    "name": "Notes",
                    "description":
                        "This is a logbook of operations and general communication.\n\nWith new additions, please add: \n\n1. Date\n2. Your name or initial with the new addition and names of anyone involved\n3. Additional to-do items with the note.\n\nExample:\n\n11/11/25\n1. Meeting with SCG personnel and candidate Last Name\n     -fill out survey by 11/13/25\n     -connect with host about food operations, H. will make contact by 11/12/25",
                },
                {
                    "type": "singleLineText",
                    "id": "fld6rR2Sm2CNju4N9",
                    "name": "Theme/Goal",
                    "description":
                        "Themes, slogans, or specific goals. Keep it brief, the rest goes in notes",
                },
                {
                    "type": "richText",
                    "id": "fldEuKJPW5SSdc4Qo",
                    "name": "Co-Host Expectations",
                    "description":
                        "Occasionally specific co-hosts will take on more responsibilities than others, eg donate, put name on event, invite their network\n\nIf necessary, include name, contact info, what they are providing.",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldQAV7nPl10GPXbE",
                    },
                    "id": "fldSHduGI2kjUZQvC",
                    "name": "Primary Host(s)",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldznboTEMlVDHG8U",
                    },
                    "id": "fld19SkpWEO5cOmx5",
                    "name": "Co-Hosts",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldmiZwl8SSYME631",
                    "name": "Co-Hosts Done?",
                    "description":
                        "Have we found all the co-hosts that we intend to?",
                },
                {
                    "type": "singleLineText",
                    "id": "fld0J1Cnyzq0Ky3pL",
                    "name": "Address",
                    "description":
                        'Full "Street, City" format, as this is used in the SCG google calendar for the location.',
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fld47TxcGAaz1iO03",
                    "name": "Fairbanks Google Cal",
                },
                {
                    "type": "singleSelect",
                    "options": {
                        "choices": [
                            {
                                "id": "selW6VK5lfsSyL8kQ",
                                "name": "Need to Request",
                                "color": "redLight2",
                            },
                            {
                                "id": "selP9RlNbJLVFBV3x",
                                "name": "Requested",
                                "color": "yellowLight2",
                            },
                            {
                                "id": "selztLRH0KqLDC6Dl",
                                "name": "Verified On Calendar",
                                "color": "greenLight2",
                            },
                            {
                                "id": "sel5KeJ7UQ6MinZR3",
                                "name": "Not Pursuing",
                                "color": "grayBright",
                            },
                        ],
                    },
                    "id": "fld7YcMgGbIDrY0Dw",
                    "name": "ADP Calendar Status",
                    "description":
                        "The AK Dem Party has a calendar of campaign events they maintain. We can get our event on their calendar. Request here: https://docs.google.com/forms/d/e/1FAIpQLSd1zFcJNRQGwETz_HKHIANCoLaCPHQ4xxTxQ9MVqpCQNOYYcA/viewform?usp=send_form\nCheck that it is on their calendar here: https://alaskademocrats.org/events ",
                },
                {
                    "type": "url",
                    "id": "fld4gY0V2nv57sJ1h",
                    "name": "Creative Brief Link",
                    "description":
                        "A link to the wrike task for the creative team to make an invite.",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldb9lwV2V6rOkTSj",
                    "name": "Creative Done?",
                    "description":
                        "The creative for the event invite is finalized and approved.",
                },
                {
                    "type": "url",
                    "id": "fldCM4o9V2GMLa1Hr",
                    "name": "Anedot Page Link",
                },
                {
                    "type": "url",
                    "id": "fldn3hn0a9207k4PM",
                    "name": "FB Event Link",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fldWNWquOwXPQkYaN",
                        "fieldIdInLinkedTable": "fldHGfFTKYQfbQ1BC",
                        "result": {
                            "type": "url",
                        },
                    },
                    "id": "fldJiAvB3Mdgm9GR0",
                    "name": "Client FB Page",
                },
                {
                    "type": "url",
                    "id": "fld6lvseZV9Xe06Bj",
                    "name": "Co-Host Tracker Link",
                    "description":
                        "something like https://docs.google.com/spreadsheets/d/1NmajJNHaGueacccrNYghGGQPb-Cfhr7nvZGj4TonSy8/edit?gid=0#gid=0",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldf9a3lfwjUzWBOH",
                    },
                    "id": "flde48JttVY6Ueg2U",
                    "name": "Guests",
                    "description":
                        "Gdrive folder of sign-in sheet scans: https://drive.google.com/drive/folders/1-ExZW07UWKucF1zG0_6hmdwpaAmYhNGp?usp=share_link",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldv9CTZIptnrq7j7",
                    "name": "Invitation Email Sent?",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldbAATVlVh9yQpO8",
                    "name": "Second Email Sent?",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldEQqjUSWEeAyVRy",
                    "name": "Reminder Email Sent?",
                    "description":
                        "We need to send a reminder email to all guests the day before/day of",
                },
                {
                    "type": "multipleSelects",
                    "options": {
                        "choices": [
                            {
                                "id": "sel8BWqyn0pcU30oo",
                                "name": "Creative",
                                "color": "greenLight2",
                            },
                            {
                                "id": "seledsbqIKchnYa3d",
                                "name": "Co-hosts",
                                "color": "greenLight1",
                            },
                            {
                                "id": "selvzbnIc5udOLq04",
                                "name": "Agenda",
                                "color": "greenBright",
                            },
                            {
                                "id": "selTepDQtwN0mS5Qw",
                                "name": "ADP Calendar",
                                "color": "purpleLight2",
                            },
                            {
                                "id": "selMRJb1x9fIzlOO0",
                                "name": "Anedot Page",
                                "color": "purpleLight1",
                            },
                            {
                                "id": "selVRvzfWwNWfUCRS",
                                "name": "FB Event",
                                "color": "purpleBright",
                            },
                            {
                                "id": "seldasqpSmirZUFwz",
                                "name": "Email: invite",
                                "color": "yellowLight2",
                            },
                            {
                                "id": "selHQWhMZzb3FMfeL",
                                "name": "Email: second",
                                "color": "yellowLight1",
                            },
                            {
                                "id": "selqFPQ81PqWNyESU",
                                "name": "Email: reminder",
                                "color": "yellowBright",
                            },
                            {
                                "id": "sel7DuwJcbGqagHVt",
                                "name": "Finalize",
                                "color": "grayLight1",
                            },
                        ],
                    },
                    "id": "fldbpfLyBwwpvm7gu",
                    "name": "Todos",
                    "description":
                        "This is calculated automatically from other fields, any edits you make will be overwritten. Please don't add extra options.",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldCGyxu9HSO0fXQe",
                    "name": "Agenda Done?",
                },
                {
                    "type": "richText",
                    "id": "fld0SWkZuoZ1tDTn0",
                    "name": "Expenses Reimbursed",
                    "description":
                        "Contact hosts, co-hosts, and SCG personnel if applicable for reimbursement.\n\nThe process of getting reimbursed is: \n\nEmail compliance\nTitle: Date of event, First and Last Name, Reimbursement\nDescription/Body: Employer of person getting reimbursed and their title at work. \nAttach screenshot of receipts \nWhen does someone get reimbursed?\n\nSCG: Typically will go towards your payment for the month.\nHosts/Co-hosts: Can take up to 3 weeks.",
                },
                {
                    "type": "richText",
                    "id": "fldcKmyciQYFCxWnA",
                    "name": "Expenses In-Kinded",
                    "description":
                        "Contact hosts, co-hosts, and SCG personnel if applicable for in-kind.\n\nIn-kind means that an individual has essentially made a personal donation to the campaign through food, activity, ect.\n\nThe process of getting in-kind is: \n\nEmail compliance\nTitle: Date of event, First and Last Name, In-Kind\nDescription/Body: Employer of person getting reimbursed and their title at work. \nAttach screenshot of receipts \n",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            'IF(\n  OR(\n    SEARCH("COMPLETE", UPPER({fldNsGrW3JhS9ceQn})) != 0,\n    SEARCH("CANCELLED", UPPER({fldNsGrW3JhS9ceQn})) != 0\n  ),\n  "", \nREGEX_REPLACE(\n  IF({fldb9lwV2V6rOkTSj}, "", "Creative,") &\n  IF({fldmiZwl8SSYME631}, "", "Co-hosts,") &\n  IF({fldCGyxu9HSO0fXQe}, "", "Agenda,") &\n  IF(\n    OR(UPPER({fld7YcMgGbIDrY0Dw}) = "NEED TO REQUEST", UPPER({fld7YcMgGbIDrY0Dw}) = "NOT PURSUING"),\n    "",\n    "ADP Calendar,"\n  ) &\n  IF({fldCM4o9V2GMLa1Hr} != "", "", "Anedot Page,") &\n  IF({fldn3hn0a9207k4PM} != "", "", "FB Event,") &\n  IF({fldv9CTZIptnrq7j7}, "", "Email: invite,") &\n  IF({fldbAATVlVh9yQpO8}, "", "Email: second,") &\n  IF(\n    AND(\n      NOT({fldEQqjUSWEeAyVRy}),\n      DATETIME_DIFF(TODAY(), {fldMB7iO24wqe8cKt}, "days") < 2\n    ),\n    "",\n    "Email: reminder,"\n  ),\n",$",\n""\n)\n)',
                        "referencedFieldIds": [
                            "fldNsGrW3JhS9ceQn",
                            "fldb9lwV2V6rOkTSj",
                            "fldmiZwl8SSYME631",
                            "fldCGyxu9HSO0fXQe",
                            "fld7YcMgGbIDrY0Dw",
                            "fldCM4o9V2GMLa1Hr",
                            "fldn3hn0a9207k4PM",
                            "fldv9CTZIptnrq7j7",
                            "fldbAATVlVh9yQpO8",
                            "fldEQqjUSWEeAyVRy",
                            "fldMB7iO24wqe8cKt",
                        ],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "flddfthd3Rmu4GE0y",
                    "name": "_needs_formula",
                    "description":
                        "Automatically generated list of tasks that need to be completed for the event.",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fldWNWquOwXPQkYaN",
                        "fieldIdInLinkedTable": "fldYFWpSg8stE0joX",
                        "result": {
                            "type": "multipleRecordLinks",
                            "options": {
                                "isReversed": false,
                                "prefersSingleRecordLink": false,
                            },
                        },
                    },
                    "id": "fldwfXJp5zwh8mTNJ",
                    "name": "Client's Team",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fld6PI39O5lxk0SCY",
                    },
                    "id": "fld2FFKne0HiccpRV",
                    "name": "Event Staffing",
                    "description":
                        "These are the people who will be included in the two gcal events: The setup event 30 minutes prior, and the event itself.\n\nThis will in general be at least\n- the client's personal email (and spouses)\n- the client's team email, eg team@simplerforstatehouse.com\n- some SCG lead (often Hannah)\n- someone to staff the donation table\n\nWhenever both 1. the client is set; and 2. this field is empty; then an automation pre-populates this with the Client's Team, but besides that, this list is hand-editable.",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fldWNWquOwXPQkYaN",
                        "fieldIdInLinkedTable": "fldZ0XMsBs1u3WOYs",
                        "result": {
                            "type": "email",
                        },
                    },
                    "id": "fld8mA6boEXdeXyRw",
                    "name": "_client_team_email",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fld2FFKne0HiccpRV",
                        "fieldIdInLinkedTable": "fldO6CQuyLidw7wTc",
                        "result": {
                            "type": "email",
                        },
                    },
                    "id": "fldcafIXIUN5AcXP5",
                    "name": "_event_staffing_emails",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "ARRAYJOIN({fldcafIXIUN5AcXP5}, \", \") \n& ',\\n\\n' \n& ARRAYJOIN({fld8mA6boEXdeXyRw}, \", \")\n& ',\\n\\n' \n& 'campaigns@shipcreekgroup.com'",
                        "referencedFieldIds": [
                            "fldcafIXIUN5AcXP5",
                            "fld8mA6boEXdeXyRw",
                        ],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "fldykEL8i88lxbp4m",
                    "name": "Setup GCal Attendees",
                    "description":
                        '- The emails of the people in the "Event Staffing" field.\n- The client\'s "Team Email" field.\n- campaigns@shipcreekgroup.com (for visibility)',
                },
                {
                    "type": "singleLineText",
                    "id": "fldEV5ynjad3mmcKh",
                    "name": "GCal Event Title",
                    "description":
                        "The pretty, public facing name of the event that appears on the gcal event that co-hosts are invited to.\n\nIf this is empty, then automation won't run, so you can use this as a psuedo on/off switch for the automation.",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "'This is set-up time for compliance, fundraising, food, and logistics for the fundraiser. Set-up includes tables, food organization, compliance set-up, etc.'\n& '\\n'\n& '\\n'\n& 'The most up-to-date info lives in AirTable here: https://airtable.com/appv9SZ8lqTqCoySO/tblXxZtsavNuPBVKl/viwZnLoXxmEdMPrTS/' & RECORD_ID()\n",
                        "referencedFieldIds": [],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "fldyRYFmM82X7e5LX",
                    "name": "Setup GCal Description",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "{fldykEL8i88lxbp4m}\n& ',\\n\\n' \n& ARRAYJOIN({fldUIWoAQ3HzXexy0}, \", \")\n& ',\\n\\nfrevents@shipcreekgroup.com'\n",
                        "referencedFieldIds": [
                            "fldykEL8i88lxbp4m",
                            "fldUIWoAQ3HzXexy0",
                        ],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "flduBtY7hAomR1RPy",
                    "name": "Main GCal Attendees",
                    "description":
                        '- Everyone in the "Setup GCal Attendees" field.\n- The emails of everyone in the "CoHosts" field.\n- The frevents@shipcreekgroup.com google group',
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "'We are excited to spend time with you! For any questions, please email ' & {fld8mA6boEXdeXyRw} & '.'\n\n& IF({fldCM4o9V2GMLa1Hr} = '', '', '\\n\\nSee the fundraising page for this event at ' & {fldCM4o9V2GMLa1Hr} & '.')\n\n& IF({fldn3hn0a9207k4PM} = '', '', '\\n\\nRSVP on the corresponding Facebook event at ' & {fldn3hn0a9207k4PM} & '.')\n\n",
                        "referencedFieldIds": [
                            "fld8mA6boEXdeXyRw",
                            "fldCM4o9V2GMLa1Hr",
                            "fldn3hn0a9207k4PM",
                        ],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "fldBxYzt9XlJRmVpH",
                    "name": "Main GCal Description",
                },
                {
                    "type": "number",
                    "options": {
                        "precision": 0,
                    },
                    "id": "flddjir9UsEkYuhjh",
                    "name": "Wrike Job #",
                },
                {
                    "type": "url",
                    "id": "fld3DySZTKTZAtL3U",
                    "name": "Main GCal Link",
                    "description":
                        "This is auto created by an automation. Do not edit by hand, message Nick if you need something.",
                },
                {
                    "type": "url",
                    "id": "fldKWxwm3vv50kR6D",
                    "name": "Setup GCal Link",
                    "description":
                        "This is auto created by an automation. Do not edit by hand, message Nick if you need something.",
                },
                {
                    "type": "currency",
                    "options": {
                        "precision": 0,
                        "symbol": "$",
                    },
                    "id": "fldMcLW8aHTfS5Fkc",
                    "name": "Raise Goal",
                    "description": "Leave blank if unsure",
                },
                {
                    "type": "currency",
                    "options": {
                        "precision": 2,
                        "symbol": "$",
                    },
                    "id": "fldcAFistxqjRZSEr",
                    "name": "Amount Raised",
                    "description":
                        "Found from the FR Summary tab of the relevant financials sheet",
                },
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            "DATETIME_DIFF(\n    NOW(),\n    LAST_MODIFIED_TIME(), \n    'minutes'\n) > 5",
                        "referencedFieldIds": [],
                        "result": {
                            "type": "number",
                            "options": {
                                "precision": 0,
                            },
                        },
                    },
                    "id": "fldX1A5sq2mZvpI3j",
                    "name": "_last_modified_at_least_5_min_ago",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fld19SkpWEO5cOmx5",
                        "fieldIdInLinkedTable": "fldO6CQuyLidw7wTc",
                        "result": {
                            "type": "email",
                        },
                    },
                    "id": "fldUIWoAQ3HzXexy0",
                    "name": "_cohost_emails",
                },
                {
                    "type": "singleSelect",
                    "options": {
                        "choices": [
                            {
                                "id": "selIWuDNNYcpyCxmf",
                                "name": "Ready to Sync",
                                "color": "greenBright",
                            },
                            {
                                "id": "sel3SZTu2shnKzt4C",
                                "name": "Needs Attention to Sync",
                                "color": "redBright",
                            },
                            {
                                "id": "seliAoUicYB0J88GU",
                                "name": "Won't Sync - Old or Cancelled Event",
                                "color": "grayLight1",
                            },
                        ],
                    },
                    "id": "fldKBruQA1XEikglM",
                    "name": "GCal Automation Status",
                    "description":
                        "The automation that keeps gcal in sync in airtable can be in one of 3 states:\n- The event already happened or was cancelled. We don't update these gcal events.\n- The event is ready to sync\n- The event needs some attention, eg the GCal Event Title or the Guest Start Time are unset, or the date is unconfirmed.",
                },
                {
                    "type": "createdTime",
                    "options": {
                        "result": {
                            "type": "dateTime",
                            "options": {
                                "dateFormat": {
                                    "name": "local",
                                    "format": "l",
                                },
                                "timeFormat": {
                                    "name": "12hour",
                                    "format": "h:mma",
                                },
                                "timeZone": "client",
                            },
                        },
                    },
                    "id": "fldCY0WkXxWbNNdWZ",
                    "name": "Created",
                },
            ],
            "views": [
                {
                    "id": "viwZnLoXxmEdMPrTS",
                    "name": "All Events",
                    "type": "grid",
                },
                {
                    "id": "viwkGyY2a5N6c08l4",
                    "name": "Active Events",
                    "type": "grid",
                },
                {
                    "id": "viwCoRBJgxat7JLzH",
                    "name": "Test Event",
                    "type": "grid",
                },
                {
                    "id": "viw0hXuLONPUUQM6v",
                    "name": "Future Events",
                    "type": "grid",
                },
                {
                    "id": "viwcpw98vhjpOiZU9",
                    "name": "Dibert FRs",
                    "type": "grid",
                },
                {
                    "id": "viwP34mROxBQ4SEuF",
                    "name": "Past Events",
                    "type": "grid",
                },
                {
                    "id": "viwbwMznHP7us0cFq",
                    "name": "Nick Scratchspace",
                    "type": "grid",
                },
                {
                    "id": "viwonRFaasjMzwg5P",
                    "name": "Event Analysis",
                    "type": "grid",
                },
                {
                    "id": "viwrrVY1yT831A2ek",
                    "name": "Calendar (using Set-up)",
                    "type": "calendar",
                },
                {
                    "id": "viwN3lXa4bt3nRQXK",
                    "name": "_needs_gcal_update",
                    "type": "grid",
                },
            ],
        },
        {
            "id": "tbl0aosXVRd88cW9z",
            "name": "People",
            "primaryFieldId": "fldByvv7JCax5dbU8",
            "fields": [
                {
                    "type": "formula",
                    "options": {
                        "isValid": true,
                        "formula":
                            '{fldsqZRgq33hxP9z5} & " " & {fldKFwJcFaJEwQqRc}',
                        "referencedFieldIds": [
                            "fldsqZRgq33hxP9z5",
                            "fldKFwJcFaJEwQqRc",
                        ],
                        "result": {
                            "type": "singleLineText",
                        },
                    },
                    "id": "fldByvv7JCax5dbU8",
                    "name": "Name",
                },
                {
                    "type": "email",
                    "id": "fldO6CQuyLidw7wTc",
                    "name": "Email",
                },
                {
                    "type": "phoneNumber",
                    "id": "fldQmn9gg9EBuzMEX",
                    "name": "Phone",
                },
                {
                    "type": "url",
                    "id": "fldHGfFTKYQfbQ1BC",
                    "name": "Facebook Page",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldWHNM3TWq8jbaNv",
                    "name": "Is Client?",
                    "description": "Is this person a client of SCG?",
                },
                {
                    "type": "singleLineText",
                    "id": "fldsqZRgq33hxP9z5",
                    "name": "First Name",
                },
                {
                    "type": "singleLineText",
                    "id": "fldKFwJcFaJEwQqRc",
                    "name": "Last Name",
                },
                {
                    "type": "multilineText",
                    "id": "fldxV3pWOpPXoN3qw",
                    "name": "Notes",
                    "description":
                        "For guests, whatever you see fit.\n\nFor clients:\n- How many FR we have committed to in the contract.\n- Preferences, eg Cliff Groh doesn’t like non-cohost fundraisers.",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                    },
                    "id": "fldlTk4L780p4LcGC",
                    "name": "Could Host For",
                    "description": "The campaign(s) this person might host",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblXxZtsavNuPBVKl",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldSHduGI2kjUZQvC",
                    },
                    "id": "fldQAV7nPl10GPXbE",
                    "name": "Events Hosted",
                    "description":
                        "All the events this person is hosting/has hosted",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblXxZtsavNuPBVKl",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fld19SkpWEO5cOmx5",
                    },
                    "id": "fldznboTEMlVDHG8U",
                    "name": "Events Co-Hosted",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblXxZtsavNuPBVKl",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldWNWquOwXPQkYaN",
                    },
                    "id": "flddAkvx7DVu2DSz3",
                    "name": "Events Funded By",
                    "description":
                        "If this person is a candidate, all the events that are for them",
                },
                {
                    "type": "checkbox",
                    "options": {
                        "icon": "check",
                        "color": "greenBright",
                    },
                    "id": "fldnTIDsXTSbeOXIg",
                    "name": "Is Archived Client?",
                    "description":
                        "This person USED to be an active client, but no longer.",
                },
                {
                    "type": "url",
                    "id": "flda6uKza478QYTve",
                    "name": "Finance Sheet URL",
                    "description":
                        "If this is a client, the GSheet URL of their financial sheet",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblXxZtsavNuPBVKl",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "flde48JttVY6Ueg2U",
                    },
                    "id": "fldf9a3lfwjUzWBOH",
                    "name": "Events Attended as Guest",
                },
                {
                    "type": "number",
                    "options": {
                        "precision": 0,
                    },
                    "id": "fldz8Ga4bGuV3R0iE",
                    "name": "Ascension ID",
                    "description":
                        "The numeric ID assigned by the AK Dept of Elections to each registered voter. This is stable throughout someones registration. If someone de-registers, and registers again, they MAY end up with the same ID, or they may get a new one. You can use this to look up someone in VAN",
                },
                {
                    "type": "multipleSelects",
                    "options": {
                        "choices": [
                            {
                                "id": "selwzKQTberbd2SJg",
                                "name": "can close",
                                "color": "blueLight2",
                            },
                            {
                                "id": "selgj2VHpKGCxyQpG",
                                "name": "can open",
                                "color": "cyanLight2",
                            },
                        ],
                    },
                    "id": "fldPxENKjvnDxz8UW",
                    "name": "Tags",
                },
                {
                    "type": "email",
                    "id": "fldZ0XMsBs1u3WOYs",
                    "name": "Client Team Email",
                    "description": "eg team@blakesleeforschoolboard.com",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldeePUcoFofhLRYM",
                    },
                    "id": "fldYFWpSg8stE0joX",
                    "name": "Client's Team",
                    "description":
                        "If this is a client, the people who normally staff the events.\n\nThese people will be included as guests on the GCal invites, etc",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tbl0aosXVRd88cW9z",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fldYFWpSg8stE0joX",
                    },
                    "id": "fldeePUcoFofhLRYM",
                    "name": "Clients working for",
                    "description": "The Clients this person is on the team of.",
                },
                {
                    "type": "multipleRecordLinks",
                    "options": {
                        "linkedTableId": "tblXxZtsavNuPBVKl",
                        "isReversed": false,
                        "prefersSingleRecordLink": false,
                        "inverseLinkFieldId": "fld2FFKne0HiccpRV",
                    },
                    "id": "fld6PI39O5lxk0SCY",
                    "name": "Events",
                },
                {
                    "type": "multipleLookupValues",
                    "options": {
                        "isValid": true,
                        "recordLinkFieldId": "fldznboTEMlVDHG8U",
                        "fieldIdInLinkedTable": "fldWNWquOwXPQkYaN",
                        "result": {
                            "type": "multipleRecordLinks",
                            "options": {
                                "isReversed": false,
                                "prefersSingleRecordLink": false,
                            },
                        },
                    },
                    "id": "fldEDcAUkYJs5Ev1t",
                    "name": "Clients Co-Hosted For",
                },
                {
                    "type": "createdTime",
                    "options": {
                        "result": {
                            "type": "dateTime",
                            "options": {
                                "dateFormat": {
                                    "name": "local",
                                    "format": "l",
                                },
                                "timeFormat": {
                                    "name": "12hour",
                                    "format": "h:mma",
                                },
                                "timeZone": "client",
                            },
                        },
                    },
                    "id": "fldCethiFLtLEvHk2",
                    "name": "Created",
                },
            ],
            "views": [
                {
                    "id": "viwXPzrprUr3UdOe6",
                    "name": "All People",
                    "type": "grid",
                },
                {
                    "id": "viwr2Vz7Z0LgsgVn7",
                    "name": "All People copy",
                    "type": "grid",
                },
                {
                    "id": "viwZoAyPW9qQIWWvy",
                    "name": "Clients",
                    "type": "grid",
                },
                {
                    "id": "viwIv7PPABLvt0rba",
                    "name": "Hosts, Co-hosts, or Attendees",
                    "type": "grid",
                },
                {
                    "id": "viwV1t7GiE75o9i40",
                    "name": "Dibert Hosts, co-hosts, attendees",
                    "type": "grid",
                },
                {
                    "id": "viwMvpRbk7CbvOwLE",
                    "name": "Needing Ascension IDs",
                    "type": "grid",
                },
                {
                    "id": "viwCTq2dEP9HxqZR3",
                    "name": "for input from FR attendees",
                    "type": "grid",
                },
                {
                    "id": "viwr7fupQNkAwIje3",
                    "name": "Co-host finder",
                    "type": "grid",
                },
            ],
        },
    ],
} as const;
