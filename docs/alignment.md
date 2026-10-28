# DGA alignment and compliance evidence

Search terms: **DGA compliance**, **Platforms Code**, **Saudi Digital Government Authority**, **هيئة الحكومة الرقمية**, **كود المنصات**, **نسق**.

Nasaq is independently designed and DGA-informed. It can support products that need to evaluate Platforms Code alignment, while also supporting independent visual identities and components beyond the official examples. A theme choice does not certify an application. No official endorsement, certification, or complete conformance is claimed.

## Separate three kinds of decisions

| Classification | Meaning | Required record |
|---|---|---|
| Verified requirement | A primary source states an obligation applicable to the target product | Source, version, exact section, applicability, implementation, and verification evidence |
| Recommended guidance | A primary source recommends a pattern or supplies a reference | Source, rationale for adoption or adaptation, and relevant evaluation |
| Nasaq design choice | An original behavior, visual choice, extension, or quality target | Rationale, public contract, and tests appropriate to the change |

An observed pattern on another platform is inspiration, not evidence of permission or compliance. A component catalog entry is not an audited requirement.

## What the research establishes

| Source | Supported fact | Limits |
|---|---|---|
| [DGA Platforms Code overview](https://dga.gov.sa/ar/digital-knowledge/national-design-system-of-Saudi-Arabia) | Platforms Code is a national reference for government platform interfaces, reusable components, and implementation guidance | Does not establish a current exhaustive component inventory or package license |
| [Digital Transformation Basic Standards V4.0](https://dga.gov.sa/sites/default/files/2025-12/Digital%20Transformation%20Basic%20Standards%20-%20V4.0.pdf), §5.13.8 | The government-agency compliance requirements include preparing an implementation plan for Platforms Code across the agency's platforms, applications, and websites | Does not establish that every example or implementation technique is mandatory |
| [DGA accessibility guide V1.0](https://dga.gov.sa/sites/default/files/2022-12/The%20Guideline%20for%20Web%20Accessibility%20of%20Government%20Websites%20%E2%80%93%20V1.0_1.pdf), §5.1 | This published guide identifies WCAG 2.1 AA as the minimum level for government agencies | Current applicability must be checked for a specific government deployment; Nasaq's WCAG 2.2 AA target is a project decision |
| [Official National Day 95 announcement](https://www.spa.gov.sa/en/N2402528) | DGA and GEA released an official themed variation of Platforms Code | Does not grant unrestricted agency rebranding while preserving a compliance claim |

The [official design portal](https://design.dga.gov.sa/) remains the intended reference for detailed design guidance. During the initial research, direct portal requests timed out or were unavailable, and some DGA documents were readable only through indexed primary-source excerpts. The current detailed component inventory, token values, and customization rules have not been fully verified. Do not convert these gaps into assumed rules.

## Evidence from Saudi platforms

These primary statements explain why service discovery, requirements, requests, feedback, and portal structure matter in the expanded Nasaq scope. They establish what the named organizations report, not approval of Nasaq or a universal rule for every screen.

| Primary statement | Evidence supported | Boundary |
|---|---|---|
| [Musaned platform announcement](https://musaned.gov.sa/ar/news/3) | Reports launching a new version using Platforms Code | The announcement explicitly describes application to some pages/services and gradual expansion to the rest; it is not a whole-platform certification statement |
| [GASTAT announcement](https://www.stats.gov.sa/ar/w/الهيئة-العامة-للإحصاء-تحصل-على-شهادة-تطبيق-كود-ال) | GASTAT reports receiving DGA's Platforms Code implementation certificate | The indexed official announcement supports that organization's reported award, not transferable certification |
| [Qassim Emirate website announcement](https://www.alqassim.gov.sa/Home/News/28) | Reports a renewed website according to unified Platforms Code requirements | An agency-reported adoption statement; no certificate is inferred |
| [ZATCA annual report 2025](https://zatca.gov.sa/ar/HelpCenter/Documents/ZATCA%20report%202025.pdf), p. 129, “إطلاق موقع الهيئة الجديد” | Reports a new website aligned with unified Platforms Code | An annual-report alignment statement; no exhaustive page or component audit is inferred |

Musaned's article was directly accessible during research. The other three statements were available through indexed excerpts from their primary domains when direct requests failed. Current detailed screenshots and component inventories were not audited. Patterns seen on live platforms are useful product references; they do not establish that deviation from official guidance is permitted, or that their assets may be redistributed.

## Nasaq's current alignment position

| Area | Planned | Built | Verified |
|---|---|---|---|
| Independent Nasaq visual identity | Yes | Woven Rhythm brand kit and component theme | Focused brand rendering and selected contrast checks recorded |
| DGA reference theme | Yes | Token and style implementation exists | Selected contrast pairs checked; full source/version comparison pending |
| Arabic/English and RTL/LTR | Required project baseline | Expanded 77-entry catalog and examples have implementations | Only the scopes recorded in validation and catalog evidence are verified; exhaustive matrix pending |
| Accessible semantics and interaction | Required project baseline | Expanded catalog uses native semantics and explicit behavior contracts | Selected automated/keyboard checks are recorded; expansion coverage, manual screen-reader work, and full audit are separate gates |
| Exact official component parity | Coverage audit planned | Not established | Not established |
| Government certification or endorsement | Not claimed | Not applicable | Not established |

Use [components.json](../components.json) for per-component build and verification status, [coverage](coverage.md) for the 77-entry scope and national input recipes, and [the roadmap](roadmap.md) for release gates. This table concerns alignment evidence rather than a claim that every framework is complete. Phone, IBAN, identity, address, consent, and service-page patterns collect or present application data; they do not verify identity, supply government integrations, or issue digital stamps.

The [validation record](validation.md) describes the actual checks. Passing runtime, contrast, or axe tests does not establish alignment with every DGA requirement.

## The reference theme

`data-nq-theme="dga"` selects a reference-oriented appearance; it is not a compliance switch. Document verified token sources and any adaptations alongside that theme. Dark mode, compact density, original components, and alternative compositions need their own evaluation rather than inheriting a compliance claim from the selector.

Applications remain responsible for their content, integrations, complete user journeys, identity, and any deployment-specific obligations. Public compliance statements should name the reference version, assessed scope, known deviations, and evidence.

## Assets and publication

Keep source-code licensing separate from the permissions attached to fonts, icons, logos, marks, and reference assets. An official description of Platforms Code as open source does not identify the terms for every individual asset. Record provenance and verify redistribution terms before bundling assets into public packages. A demo must not imply a valid government digital stamp or use invented certification details.

## Updating the evidence

For each evaluated guideline, record an identifier, primary URL, source version/date, classification, product applicability, affected components, verification method, outcome, and unresolved gaps. Retain previous evidence when updating a reference so consumers can understand what changed. Broader claims require broader evaluation; do not infer whole-product compliance from a component test.
