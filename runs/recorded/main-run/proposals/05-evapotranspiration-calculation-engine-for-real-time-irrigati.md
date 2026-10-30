# Evapotranspiration Calculation Engine for Real-Time Irrigation Scheduling

**Type:** Joint project
**Company:** Njivomer Agro d.o.o. [C022], Agri-tech (farm software, sensing, drones), 61 employees, Sombor
**Challenge:** [C022-CH3] We want to add a water-balance module so farmers can plan irrigation scheduling, but none of our staff understands evapotranspiration modelling or how to couple it with our existing soil-type maps; we need someone to build and validate that calculation engine.
**Researcher:** Nenad Ilić [R0662], Associate Professor, Department of Field and Vegetable Crops, Faculty of Agriculture
**Found by:** First Contact (lens: untapped)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 8/10

Njivomer Agro d.o.o. needs to add a water-balance module and evapotranspiration modeling for irrigation scheduling, which matches Nenad Ilić's academic expertise in evapotranspiration-based irrigation and decision support applications. This joint project connects academic evapotranspiration modeling with commercial farm management software to deliver actionable water-balance advice. Both sides will collaborate to integrate, validate, and test the calculation engine within NjivaManager.

## The problem
Njivomer Agro d.o.o. has been asked by several larger farm clients to add irrigation scheduling advice to NjivaManager, but calculating evapotranspiration properly requires knowledge the company does not have in-house [C022-CH3]. Specifically, the company lacks the calculation engine that converts weather station inputs and spatial soil data into a daily water-balance estimate for a given crop and growth stage [C022-CH3].

## Research questions
1. How can the Penman-Monteith evapotranspiration model be coupled with spatial soil-type maps to compute daily water-balance estimates in NjivaManager?
2. What is the validation accuracy of the integrated evapotranspiration engine when tested against field soil moisture sensor data across target crops?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Phase 1 | Define algorithm architecture and data integration pipelines connecting agrometeorological station inputs and soil-type map layers to the evapotranspiration model. | A tested prototype calculation engine delivering daily water-balance estimates. |
| Phase 2 | Integrate the calculation engine into the NjivaManager software environment and conduct initial calibration using historical agronomic data. | An embedded water-balance module ready for internal testing. |
| Phase 3 | Perform on-farm validation of the irrigation scheduling module and establish operational protocols for smallholder and commercial farm deployment. | A fully validated irrigation scheduling module ready for commercial release. |

## What each side brings
**Company**
- Daily weather station data from three agrometeorological stations maintained near Sombor, Kula, and Odžaci [C022-CH3]
- Spatial soil-type map layers built from legacy Yugoslav soil surveys and own sampling [C022-CH3]
- Two in-house developers and one GIS analyst for software integration and data processing [C022]

**Faculty**
- Academic expertise in evapotranspiration-based irrigation scheduling [SYN-PUB-07490]
- Direct experience with decision support applications and mobile irrigation scheduling tools [SYN-PUB-07493]
- Methodologies from applied research projects focused on low-cost irrigation advice [SYN-PRJ-0003]

## Why this pair (every line checked by the critic)
- Nenad Ilić is an Associate Professor at the Faculty of Agriculture, University of Novi Sad, focusing on irrigation management and decision support systems. [R0662]
- Nenad Ilić published research on evapotranspiration-based irrigation scheduling for sugar beet on chernozem. [SYN-PUB-07490]
- Nenad Ilić has experience with smartphone-based decision support applications for real-time irrigation scheduling. [SYN-PUB-07493]
- Njivomer Agro d.o.o. maintains agrometeorological stations and spatial soil-type map layers needed as inputs for the calculation engine. [C022-CH3]
- Njivomer Agro d.o.o. has software development capacity through in-house developers and GIS analysts to support integration. [C022]

## Risks and rebuttals
- **CTO Shark:** How will we package this calculation engine into NjivaManager using your existing two developers and one GIS analyst without disrupting their current feature roadmap?
  **Rebuttal:** Development will be structured into distinct milestones where the researcher provides the tested mathematical algorithms and Python logic, allowing company developers to handle API integration and UI wrappers with minimal time allocation.
- **Professor Shark:** How will you structure the intellectual property and development milestones so that Nenad Ilić can pursue rigorous academic validation while Njivomer Agro d.o.o. integrates the engine into NjivaManager without compromising commercial release timelines?
  **Rebuttal:** Milestones will decouple core scientific algorithm validation from commercial UI release, allowing academic publication on model performance while granting the company exclusive commercial rights to the embedded software module.

## The sharks' questions for the first meeting
- **CTO Shark:** How will we package this calculation engine into NjivaManager using your existing two developers and one GIS analyst without disrupting their current feature roadmap?
- **Professor Shark:** How will you structure the intellectual property and development milestones so that Nenad Ilic can pursue rigorous academic validation while Njivomer Agro d.o.o. integrates the engine into NjivaManager without compromising commercial release timelines?

## Agreed up front
- Njivomer Agro d.o.o. retains commercial exploitation rights for the NjivaManager software integration.
- Nenad Ilić retains the right to publish academic findings regarding model validation and scientific performance.
- Data sharing protocols and input formats are defined prior to project kickoff.

## First meeting agenda
1. Review available data formats from the Sombor, Kula, and Odžaci weather stations.
2. Assess existing soil-type map layer structures in PostGIS.
3. Define technical milestones and resource allocation for the two in-house developers and GIS analyst.

## Claims the critic removed on the way
- ~~Nenad Ilić has no industry experience listed and is open to joint projects and industrial PhD supervision.~~ (First Contact, cited K2): cites K2, which does not exist in the dataset
- ~~Njivomer Agro d.o.o. does not have a dedicated R&D budget line and requires all work to connect directly to existing software or field services.~~ (CTO Shark, cited C022): Record C022 mentions company details, services, and plans, but does not state that the company lacks a dedicated R&D budget line or requires work to connect to existing software or field services.
- ~~Njivomer Agro d.o.o. lacks a dedicated R&D budget line, meaning all practical work must directly connect to their existing software or field services.~~ (Professor Shark, cited C022): Record C022 does not mention anything about lacking a dedicated R&D budget line or requiring work to connect directly to existing software or field services.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
