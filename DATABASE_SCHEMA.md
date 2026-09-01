# New Horizon Information System
## Database Schema v1.0

**Status:** Development  
**Version:** 1.0  
**Purpose:** Technical source of truth for the NHIS database architecture.

---

# 1. Database Design Principles

NHIS is designed as a cross-reference information system rather than a collection of isolated records.

Major records should be linked whenever a logical relationship exists.

Examples:

Member → Team → Case → Investigation → Evidence

Location → Cases

Spirit → Cases → Evidence

Cult → Incidents

Equipment → Investigations

Forms → Records they document

The system should avoid unnecessary duplication of information.

Relationships should generally use permanent record IDs rather than manually entered names.

---

# 2. Identifier Standards

NHIS identifiers are system-generated and should not normally be editable by users.

| Record | Format | Example |
|---|---|---|
| Member | MEM-#### | MEM-0001 |
| Case | CASE-YYYY-#### | CASE-2026-0001 |
| Investigation | INV-YYYY-####-## | INV-2026-0001-01 |
| Location | LOC-#### | LOC-0001 |
| Evidence | EVD-YYYY-#### | EVD-2026-0001 |
| Incident | INC-YYYY-#### | INC-2026-0001 |
| Haunted/Cursed Object | OBJ-#### | OBJ-0001 |
| Equipment | EQP-#### | EQP-0001 |
| Cult | CULT-#### | CULT-0001 |
| Spirit Individual | SPI-#### | SPI-0001 |
| Resource | RES-#### | RES-0001 |
| Training Course | TRN-#### | TRN-0001 |

---

# 3. Organizational Structure

## 3.1 Positions

**Firestore collection:** `positions`

Positions define organizational roles.

### Initial Positions

1. Director
2. Team Lead
3. Assistant Team Lead
4. Investigator
5. Specialist

Positions must be database records rather than hard-coded application values so Administration can create additional positions later.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| positionId | string | Yes | Permanent position identifier |
| name | string | Yes | Position name |
| description | string | No | Description of role |
| teamType | string | Yes | Administration or Investigation |
| clearanceLevel | number | Yes | Information clearance level |
| permissions | array | Yes | Permission identifiers assigned to position |
| active | boolean | Yes | Whether position is currently active |
| createdAt | timestamp | Yes | Creation timestamp |
| createdBy | string | Yes | Member ID of creator |
| updatedAt | timestamp | Yes | Last modification timestamp |

---

# 4. Permissions

Permissions determine what actions a member is allowed to perform.

Permissions are tied to positions, not individual members.

## Example Permission Categories

### Cases

- cases.view
- cases.create
- cases.edit
- cases.close

### Investigations

- investigations.view
- investigations.create
- investigations.edit
- investigations.assign

### Evidence

- evidence.view
- evidence.upload
- evidence.review
- evidence.approve

### Members

- members.view
- members.edit
- members.manage

### Incidents

- incidents.view
- incidents.create
- incidents.review
- incidents.approve

### Forms

- forms.view
- forms.create
- forms.edit
- forms.publish
- forms.submit

### Training

- training.view
- training.manage

### Equipment

- equipment.view
- equipment.manage

### Objects

- objects.view
- objects.manage

### Cult Registry

- cults.view
- cults.manage

### Resources

- resources.view
- resources.manage

### Administration

- administration.manage
- personnel.manage
- positions.manage

This permission list is an initial architecture and will be refined before implementation.

---

# 5. Clearance

Clearance is separate from permissions.

**Permissions determine what a member can do.**

**Clearance determines what information a member can see.**

Sensitive information may therefore display as:

> REDACTED

until the viewer possesses sufficient clearance.

Examples of potentially restricted information include:

- Member home address
- Emergency contact information
- Sensitive personnel information
- Other information designated as restricted

Clearance should be evaluated by the application and enforced through database security rules where appropriate.

---

# 6. Teams

**Firestore collection:** `teams`

Teams organize members operationally.

## Initial Team Types

- Administration
- Investigation

Additional investigation teams may be created later.

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| teamId | string | Yes | Permanent team identifier |
| name | string | Yes | Team name |
| teamType | string | Yes | Administration or Investigation |
| description | string | No | Team description |
| teamLeadId | string | No | Member ID of Team Lead |
| assistantTeamLeadId | string | No | Member ID of Assistant Team Lead |
| status | string | Yes | Active/inactive status |
| createdAt | timestamp | Yes | Creation timestamp |
| createdBy | string | Yes | Creator member ID |
| updatedAt | timestamp | Yes | Last update |

Members reference their team through `teamId`.

---

# 7. Members

**Firestore collection:** `members`

Members are employees/personnel of New Horizon.

Random public users do not receive NHIS member records.

### Identifier

Example:

`MEM-0001`

### Fields

| Field | Type | Required | Description |
|---|---|---:|---|
| memberId | string | Yes | Permanent member identifier |
| firstName | string | Yes | First name |
| lastName | string | Yes | Last name |
| displayName | string | Yes | Display name |
| positionId | string | Yes | Reference to position |
| teamId | string | Yes | Reference to team |
| dateJoined | date | Yes | Date joined New Horizon |
| status | string | Yes | Current personnel status |
| phone | string | Depends on finalized form | Contact number |
| email | string | Depends on finalized form | Email |
| address | string | Depends on finalized form | Sensitive address information |
| certifications | array | No | Certifications |
| beliefs | string | Depends on finalized form | Member belief information |
| emergencyContact | object | Depends on finalized form | Sensitive emergency contact |
| firebaseUserId | string | Yes | Firebase Authentication UID |
| createdAt | timestamp | Yes | Record creation |
| updatedAt | timestamp | Yes | Last modification |

### Member Status

Initial controlled values:

- Active
- Inactive
- Suspended
- Terminated

### Derived Information

The following should preferably be calculated from relationships rather than manually maintained:

- Cases participated in
- Investigations participated in
- Training completion status
- Reports authorized

---

# 8. Personnel Actions

**Firestore collection:** `personnelActions`

Personnel actions preserve organizational history.

Actions include:

- Written warning
- Promotion
- Demotion
- Suspension
- Termination
- Other authorized personnel actions

### Fields

| Field | Type | Required |
|---|---|---:|
| actionId | string | Yes |
| memberId | string | Yes |
| actionType | string | Yes |
| previousPositionId | string | No |
| newPositionId | string | No |
| reason | string | Yes |
| notes | string | No |
| submittedBy | string | Yes |
| approvedBy | string | No |
| date | timestamp | Yes |
| attachments | array | No |
| createdAt | timestamp | Yes |

Personnel actions should not simply overwrite historical information.

The member's current record reflects their current status, while personnel actions preserve the history.

---

# 9. Locations

**Firestore collection:** `locations`

Locations are permanent records.

A location may have multiple cases.

Example:

LOC-0001

may be associated with:

- CASE-2026-0001
- CASE-2027-0004
- CASE-2028-0011

This prevents duplicate location records and creates a historical record of New Horizon activity at a location.

### Location Types

Initial values:

- Residential
- Commercial
- Cemetery
- Lake
- Park
- Other

### Fields

| Field | Type | Required |
|---|---|---:|
| locationId | string | Yes |
| name | string | Yes |
| locationType | string | Yes |
| address | string | Depends on location |
| coordinates | object | No |
| propertyOwner | object/reference | No |
| history | reference/data | No |
| notes | string | No |
| createdAt | timestamp | Yes |
| createdBy | string | Yes |
| updatedAt | timestamp | Yes |

Location records should maintain relationships to associated cases.

---

# 10. Cases

**Firestore collection:** `cases`

Cases are the central operational records of NHIS investigations.

### Identifier

Example:

`CASE-2026-0001`

### Fields

| Field | Type | Required |
|---|---|---:|
| caseId | string | Yes |
| caseName | string | Yes |
| status | string | Yes |
| priority | string | Yes |
| locationId | string | Yes |
| client | reference/restricted record | Depends on case |
| assignedTeamId | string | Yes |
| investigationDates | array | No |
| dateCreated | timestamp | Yes |
| createdBy | string | Yes |
| description | string | Yes |
| createdAt | timestamp | Yes |
| updatedAt | timestamp | Yes |

### Case Status

Controlled values:

- Unscheduled
- Active
- Closed

### Case Priority

Controlled values will be established during implementation.

---

# 11. Case Relationships

A case may reference:

- Location
- Client
- Assigned team
- Members participating
- Location History form
- Witness Reports
- Property Access form
- Investigations
- Evidence
- Incident Reports
- Final Assessment
- Related spirits
- Related cults
- Related objects
- Other relevant records

The case should function as the central hub for these records.

---

# 12. Investigations

**Firestore collection:** `investigations`

Each case may contain between **1 and 4 investigations**.

### Identifier

Example:

`INV-2026-0001-01`

Where:

- `2026` = year
- `0001` = case number
- `01` = investigation number

### Fields

| Field | Type | Required |
|---|---|---:|
| investigationId | string | Yes |
| caseId | string | Yes |
| investigationNumber | number | Yes |
| date | date | Yes |
| assignedMembers | array | Yes |
| teamId | string | Yes |
| status | string | Yes |
| ipoSubmissionId | string | No |
| investigationReportSubmissionId | string | No |
| evidenceIds | array/reference | No |
| incidentIds | array/reference | No |
| equipmentIds | array/reference | No |
| createdAt | timestamp | Yes |
| updatedAt | timestamp | Yes |

### Investigation Limit

The application must enforce:

```text
Minimum: 1
Maximum: 4