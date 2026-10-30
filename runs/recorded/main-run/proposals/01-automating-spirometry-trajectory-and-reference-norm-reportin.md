# Automating Spirometry Trajectory and Reference Norm Reporting for Occupational Health Clients

**Type:** Joint project
**Company:** Pulmoteh d.o.o. [C102], Medtech and digital health, 27 employees, Zrenjanin
**Challenge:** [C102-CH2] Our occupational health clients want an automated report comparing a worker's spirometry trend over three years against age- and height-adjusted reference norms; right now a technician does this manually for each patient and it takes about 12 minutes per report, adding up to nearly 30 hours of labour per week.
**Researcher:** Nebojša Crnković [R0209], Assistant Professor, Department of Physiology, Faculty of Medicine
**Found by:** Bridge Builder (lens: bridges)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 9/10

Pulmoteh d.o.o. and the Faculty of Medicine will collaborate to automate manual spirometry trend reports that currently require twelve minutes per patient and nearly 30 hours of labor per week. Nebojša Crnković will supply validated longitudinal trajectory algorithms and reference specifications that integrate directly into the PulmoTrack software. This joint project establishes an automated module for occupational health clients, eliminating manual spreadsheet calculations.

## The problem
Occupational health regulations require employers to track lung function trends for workers exposed to dust, fumes, or chemicals. Pulmoteh d.o.o. faces an operational bottleneck where technicians spend about twelve minutes manually creating spirometry trend reports comparing worker data against reference norms, totaling nearly 30 hours of labor per week. PulmoTrack stores raw measurement data but lacks an automated module to calculate three-year trajectories and compare them against age- and height-adjusted reference norms.

## Research questions
1. How can longitudinal linear mixed-effects models for FEV1 and FVC decline be efficiently implemented within a Java and SQLite software environment without compromising desktop execution speed?
2. What parametrization of reference equations and anthropometric stratification curves can be pre-compiled into lookup specifications to automate reporting within the PulmoTrack architecture?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Phase 1 | Define the mathematical specification for longitudinal trajectory calculations and reference norm comparison, adapting existing mixed-effects models for automated execution. | A finalized algorithm specification document and validated reference table lookup library for FEV1, FVC, and ratio trends. |
| Phase 2 | Translate the statistical specification into software integration guidelines and test the algorithms against historical occupational health datasets. | A pre-packaged algorithm and reference table specification ready for integration by the Pulmoteh software developer into PulmoTrack. |
| Phase 3 | Validate the automated reports in a clinical or occupational health setting and verify output accuracy against manual calculations. | A fully functional automated reporting module integrated into the PulmoTrack software release, reducing report generation time to zero manual intervention. |

## What each side brings
**Company**
- PulmoTrack desktop application built on Java with SQLite local database architecture [C102]
- Software and firmware development resources to wire the delivered specifications into the product [C102]
- Access to occupational health client networks and operational workflow data for validation [C102-CH2]

**Faculty**
- Expertise in respiratory physiology, biostatistics, and longitudinal trajectory modelling from the Faculty of Medicine [R0209]
- Published research experience with linear mixed-effects models and longitudinal FEV1 trajectories in occupational cohorts [SYN-PUB-02674]
- Practical industry experience advising regional occupational health service providers on spirometric surveillance protocols [R0209]

## Why this pair (every line checked by the critic)
- Pulmoteh d.o.o. faces a challenge where technicians spend about twelve minutes manually creating spirometry trend reports comparing worker data against reference norms [C102-CH2]. [C102-CH2]
- Nebojša Crnković is an Assistant Professor at the Department of Physiology, Faculty of Medicine, with fields in respiratory physiology and biostatistics [R0209]. [R0209]
- Crnković has published research on occupational dust exposure and accelerated FEV1 decline in grain elevator workers [SYN-PUB-02674]. [SYN-PUB-02674]
- Crnković has also published work on penalised spline modelling of height-for-age effects on spirometric reference values [SYN-PUB-02675]. [SYN-PUB-02675]
- Crnković provided consultancy services to a regional occupational health service provider, MedWork d.o.o., advising on spirometry [R0209]. [R0209]

## Risks and rebuttals
- **CTO Shark:** The project risks straying into a custom software contractor job rather than a core R&D collaboration, given that standard reference equations and automated reporting logic are well-established engineering tasks.
  **Rebuttal:** While standard reference norms exist, translating longitudinal mixed-effects models and adjusting for complex occupational exposure trajectories requires domain-specific biostatistical expertise that bridges clinical physiology and software engineering, ensuring scientific validity rather than simple spreadsheet automation.
- **Professor Shark:** Pulmoteh d.o.o. lacks a dedicated research function and relies on a very lean software and firmware team, which may create a bandwidth bottleneck for integrating advanced longitudinal models into their PulmoTrack software.
  **Rebuttal:** The collaboration is scoped precisely to avoid overwhelming the lean team by delivering a pre-packaged algorithm and pre-compiled reference table specification that requires minimal wiring rather than ongoing statistical research during integration.

## The sharks' questions for the first meeting
- **CTO Shark:** Can Nebojša deliver this as a pre-packaged algorithm and reference table specification that your single software developer can wire into PulmoTrack within one month, or will this require ongoing statistical research that your team cannot absorb?
- **Professor Shark:** Given that Pulmoteh relies on a small software team for their desktop application, how do you plan to deploy your mixed-effects trajectory algorithms into their Java and SQLite environment without disrupting their current release cycle?

## Agreed up front
- Intellectual property generated from the algorithm design remains jointly protected, with Pulmoteh holding exclusive commercial rights to embed the module within PulmoTrack.
- Both parties retain the right to publish academic findings on the anonymized statistical methodology and occupational trajectory analyses.

## First meeting agenda
1. Review current data structures within the PulmoTrack SQLite database for storing multi-year spirometry records [C102].
2. Confirm the exact format of the manual spreadsheet template currently used by clinic technicians [C102-CH2].
3. Agree on the milestone schedule for delivering the algorithm specification to Pulmoteh's software developer.

## Claims the critic removed on the way
- ~~Pulmoteh has only one software developer and one embedded firmware developer on staff, meaning they lack dedicated internal R&D capacity to integrate a complex statistical module into their Java and SQLite based PulmoTrack desktop application without contractor help.~~ (CTO Shark, cited C102, C102-CH2): Record C102-CH2 states they have one in-house software developer, but does not mention an embedded firmware developer on staff, nor does C102 mention both roles or SQLite specifically in connection with staffing limitations.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
