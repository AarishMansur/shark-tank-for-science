# Integrating In-Season Plant Sensing Data Into Variable-Rate Nutrient Prescription Algorithms

**Type:** Joint project
**Company:** Polje360 d.o.o. [C111], Agri-tech (farm software, sensing, drones), 61 employees, Novi Sad
**Challenge:** [C111-CH2] Our variable-rate application maps are built from soil sampling data that is often two to three years old, and the actual within-season crop response to fertiliser varies a lot, we want to incorporate current-season plant sensing data so the controller adjusts rates based on what the crop actually needs right now.
**Researcher:** Đuro Đorđević [R0680], Senior Research Associate, Department of Field and Vegetable Crops, Faculty of Agriculture
**Found by:** Bridge Builder (lens: bridges)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 9/10

Polje360 d.o.o. relies on soil sampling data that is often two to three years old for generating variable-rate application maps [C111-CH2]. To overcome this bottleneck, the company will collaborate with Đuro Đorđević from the Faculty of Agriculture to incorporate current-season plant sensing data into their controllers [C111-CH2]. Together, they will build and validate automated workflows that translate drone-acquired canopy reflectance calibration pipelines into dynamic fertilizer adjustments [SYN-PUB-02668].

## The problem
Polje360 builds variable-rate application maps using soil sampling data that is often two to three years old, meaning controllers miss actual within-season crop responses and shifts in nutrient availability [C111-CH2]. Without incorporating current-season plant sensing data, the system cannot dynamically adjust fertilizer applications based on what the crop actually needs right now [C111-CH2].

## Research questions
1. How can drone-acquired canopy reflectance indices be operationalized as automated in-season nitrogen status proxies that feed directly into the VRS-7 controller without manual data analyst intervention?
2. What calibration methods reliably link multi-spectral vegetation indices across different growth stages to variable nitrogen top-dressing requirements under Pannonian field conditions?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Year 1 | Establish data pipelines connecting drone multispectral imagery processing routines with Polje360 spatial data infrastructure, and define initial vegetation index calibration thresholds for winter wheat trials. | A tested data ingestion pipeline that ingests raw multispectral flights and outputs standardized variable-rate prescription maps in ISOXML format. |
| Year 2 | Execute multi-field validation trials across commercial farms in Vojvodina comparing dynamic in-season prescription outputs against historical soil-only baselines. | Validated crop-response calibration curves and a measured reduction in nitrogen surplus across trial hectarage. |
| Year 3 | Finalize the automated near real-time recommendation workflow for the VRS-7 controller and complete documentation and training for field agronomists. | A commercial-ready software module capable of generating real-time in-season plant-sensing-driven prescription maps. |

## What each side brings
**Company**
- ISOBUS-compatible cab terminals and VRS-7 controller hardware architecture for field testing [C111, C111-CH2].
- PostgreSQL with PostGIS spatial data infrastructure and Python-based back-end integration support [C111].
- Field agronomists and embedded engineers to support commercial trial logistics and hardware integration [C111].

**Faculty**
- Expertise in precision agriculture, crop protection modelling, and geostatistical calibration [R0680].
- Established methodologies for drone-acquired canopy reflectance indices as in-season nitrogen proxies [SYN-PUB-02668].
- Academic research capacity for experimental design and spatial variability analysis [R0680].

## Why this pair (every line checked by the critic)
- Polje360 d.o.o. builds variable-rate application maps using soil sampling data that is often two to three years old [C111-CH2]. [C111-CH2]
- Polje360 d.o.o. wants to incorporate current-season plant sensing data so controllers can adjust fertilizer applications dynamically [C111-CH2]. [C111-CH2]
- Đuro Đorđević is a Senior Research Associate at the Department of Field and Vegetable Crops, Faculty of Agriculture, focusing on precision agriculture and agronomy [R0680]. [R0680]
- Đorđević published a study on drone-acquired canopy reflectance indices as in-season proxies for crop nitrogen status in winter wheat [SYN-PUB-02668]. [SYN-PUB-02668]
- Đorđević has integrated historical yield maps into phosphorus prescription models in sunflower production [SYN-PUB-07652]. [SYN-PUB-07652]

## Risks and rebuttals
- **CTO Shark:** Polje360 lacks a dedicated R&D budget line, relying instead on shared capacity between embedded engineers, data analysts, and field agronomists.
  **Rebuttal:** The project will leverage existing commercial field operations and ring-fence specific staff hours from the data analyst and field agronomists to ensure dedicated execution without needing a standalone corporate R&D department.
- **Professor Shark:** The company has no separate R&D budget line, which might limit the execution of a multi-year academic collaboration without proper commercial project ring-fencing.
  **Rebuttal:** We will structure the collaboration through a formal joint project agreement with defined milestones and shared access to commercial farm trial sites, matching Đorđević's preference for practical field-access arrangements.

## The sharks' questions for the first meeting
- **CTO Shark:** How will Đuro translate his drone canopy reflectance calibration pipeline into a near real-time automated workflow that feeds directly into the VRS-7 controller without requiring manual post-processing by your data analyst?
- **Professor Shark:** Given that Polje360 operates without a dedicated R&D budget line, how will you secure the necessary field trial logistics and hardware testing time across commercial farms for the three-year duration required to validate these in-season prescription algorithms?

## Agreed up front
- Joint data-use agreement allowing the academic team to utilize anonymized commercial field data for research validation.
- Clear intellectual property terms ensuring Polje360 retains commercial rights to the embedded controller software modules while the academic team retains publication rights for underlying calibration algorithms.
- Mutual agreement on trial site selection and farmer consent protocols across Vojvodina commercial holdings.

## First meeting agenda
1. Review existing data schema compatibility between Đorđević's drone reflectance processing pipeline and Polje360 PostGIS database architecture.
2. Agree on specific winter wheat pilot fields for the first season of in-season sensing trials.
3. Define exact roles and time allocations for the company data analyst and faculty researchers.

## Claims the critic removed on the way
- None.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
