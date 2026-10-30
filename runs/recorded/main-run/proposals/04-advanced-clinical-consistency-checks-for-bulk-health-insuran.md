# Advanced Clinical Consistency Checks for Bulk Health-Insurance Claims

**Type:** Joint project
**Company:** Kognitiva a.d. [C110], AI and data consultancies, 210 employees, Novi Sad
**Challenge:** [C110-CH2] We process health-insurance claims in bulk and about 3.2% of records contain diagnosis codes that don't match the procedure codes, our rules catch the obvious ones but nuanced clinical inconsistencies slip through and cost one client €420,000 in reimbursements last year.
**Researcher:** Róbert Fehér [R0511], Assistant Professor, Department of Internal Medicine, Faculty of Medicine
**Found by:** Bridge Builder (lens: bridges)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 8/10

This one-year joint project integrates deterministic clinical rules into Kognitiva's Python and Spark stack to detect nuanced medical coding inconsistencies. By combining Kognitiva's bulk commercial insurance dataset with Róbert Fehér's clinical informatics expertise, the project addresses the 3.2 percent error rate causing significant reimbursement losses. The collaboration establishes a transparent audit workflow featuring automated flagging alongside mandatory human oversight.

## The problem
Kognitiva a.d. processes bulk health-insurance claims where approximately 3.2 percent of records contain mismatched diagnosis and procedure codes. While basic rules catch obvious errors, nuanced clinical inconsistencies slip past the current engine and caused one client €420,000 in annual reimbursement losses.

## Research questions
1. How can deterministic clinical rules from past academic work be mapped directly into Kognitiva's existing Python and Spark stack to flag diagnostic and therapeutic inconsistencies in bulk insurance claims?
2. What threshold of probabilistic scoring combined with deterministic rules minimizes false positives while retaining mandatory human audit oversight for clinical data reviewers?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Phase 1: Rule Mapping and Data Alignment | Translate academic rule sets into vectorized Python and Spark logic, aligning historical claim attributes with standardized classification taxonomies. | A core validation library integrated into Kognitiva's data pipeline capable of executing initial consistency checks on historical datasets. |
| Phase 2: Model Calibration and Pipeline Integration | Test rule performance against labelled historical claim records, fine-tuning flags to account for multi-variable clinical profiles. | An optimized detection module deployed in a staging environment with automated performance monitoring dashboards. |
| Phase 3: Human-in-the-Loop Workflow and Evaluation | Design and validate the review interface and audit workflows for clinical specialists to inspect flagged claims efficiently. | A fully documented production-ready anomaly detection module with integrated human review protocols and a final impact assessment report. |

## What each side brings
**Company**
- A production-grade Python and Apache Spark data processing stack
- A labelled dataset of approximately 240,000 historical claims reviewed by human coders
- Engineering support from internal analysts and infrastructure for secure data deployment

**Faculty**
- Deep expertise in clinical informatics, medical coding, and diagnostic-therapeutic pathways
- Validated methodological frameworks for clinical audit workflows
- Domain guidance on ICD-10 and ICD-11 classification standards

## Why this pair (every line checked by the critic)
- Kognitiva a.d. processes bulk health-insurance claims where about 3.2 percent of records contain mismatched diagnosis and procedure codes. [C110-CH2]
- Róbert Fehér is an Assistant Professor at the Department of Internal Medicine, Faculty of Medicine, with expertise in clinical informatics and medical coding. [R0511]
- Fehér published research on rule-based detection of diagnostic-therapeutic inconsistencies in coded hospital records. [SYN-PUB-06002]
- Fehér studied the frequency and pattern of principal diagnosis coding errors in a tertiary hospital in Vojvodina. [SYN-PUB-06000]
- Fehér provided a three-month consulting engagement to a regional hospital software vendor to advise on the design of a coding plausibility module. [R0511]

## Risks and rebuttals
- **CTO Shark:** Fehér has a strong preference for collaborations that involve access to real, anonymised hospital discharge data rather than purely synthetic datasets, which may create data governance hurdles.
  **Rebuttal:** The project utilizes Kognitiva's existing labelled dataset of 240,000 historical claims that have been reviewed by human clinical coders, providing authentic clinical complexity while satisfying privacy requirements through strict anonymisation protocols.
- **Professor Shark:** The proposed collaboration relies on bulk commercial insurance claims data, whereas Fehér has a strong preference for actual hospital discharge records and is cautious about automated tools lacking human audit oversight.
  **Rebuttal:** The architecture explicitly mandates human audit oversight by integrating a review workflow where clinical specialists examine every flagged anomaly, ensuring automated tools serve as decision support rather than unsupervised arbiters.

## The sharks' questions for the first meeting
- **CTO Shark:** Can we map your 214 deterministic rules from past academic work directly into our existing Python and Spark stack to protect our client's €420,000 annual reimbursement losses?
- **Professor Shark:** How will we bridge the gap between Kognitiva's commercial insurance dataset and your requirement for clinical audit workflows that retain mandatory human oversight?

## Agreed up front
- All background intellectual property remains with the respective party, and foreground intellectual property developed jointly will be shared for commercial deployment within Kognitiva's platform.
- Both parties agree to publish non-proprietary methodological findings in academic venues following review to protect commercial confidentiality.

## First meeting agenda
1. Review data governance protocols for accessing and anonymising the historical claims dataset.
2. Inspect the existing Python and Spark pipeline architecture alongside the legacy rule definitions.
3. Define the specific interface requirements for human-in-the-loop clinical auditing workflows.

## Claims the critic removed on the way
- None.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
