# Spec Delta

## Purpose

Gives students and the school a bilingual draft of the Law 25 notice so it can be reviewed before any real personal information is collected in the database.

## ADDED Requirements

### Requirement: Draft privacy page is public and bilingual
The site MUST serve a privacy notice at `/privacy` in English and French, following the existing language toggle. The notice MUST be labeled as a draft for the school to review and MUST state that it is not legal advice.

#### Scenario: English draft
- **WHEN** a visitor opens `/privacy` with English selected
- **THEN** the page shows an English draft banner
- **AND** it describes purpose, consent, retention, access, and deletion in English

#### Scenario: French draft
- **WHEN** a visitor opens `/privacy` with French selected
- **THEN** the page shows a French draft banner
- **AND** the same topics are in French

### Requirement: Notice matches what the product actually does
The notice MUST distinguish the browser demo from the production database. It MUST say that production payments will not store card numbers. It MUST NOT claim a hosting region or name a privacy officer the school has not appointed.

#### Scenario: Demo versus database
- **WHEN** a visitor reads the draft
- **THEN** they can see that the current desk stores demo files in the browser
- **AND** they can see that a future database is server-side only

#### Scenario: Cards and region
- **WHEN** a visitor reads the payment and hosting sections
- **THEN** the page says card numbers are not stored by the school in production
- **AND** the page says the hosting region is not confirmed yet
