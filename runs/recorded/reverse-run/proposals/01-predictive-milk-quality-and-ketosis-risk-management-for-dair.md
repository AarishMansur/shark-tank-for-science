# Predictive Milk Quality and Ketosis Risk Management for Dairy Processing

**Type:** Joint project
**Company:** Company using reverse search [USER], not stated
**Challenge:** [Q-1] We run a mid-sized dairy in Vojvodina. Our yoghurt and cheese lines lose product when milk quality changes from farm to farm, and we only find out after lab tests the next day. We want to predict whic
**Researcher:** Ivona Jovanović [R0774], Full Professor, Department of Veterinary Medicine, Faculty of Agriculture
**Found by:** Fresh Ink (lens: fresh-papers)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 8/10

A joint project between a mid-sized dairy in Vojvodina and academic veterinary experts to predict milk quality variations and ketosis risk before processing. By bridging cow-level metabolic models with intake-level data streams, the project aims to eliminate product losses in yoghurt and cheese lines. The collaboration combines dairy processing intake data with machine learning classification to achieve real-time batch quality prediction.

## The problem
The company runs a mid-sized dairy in Vojvodina and faces product losses in yoghurt and cheese lines due to farm-to-farm milk quality variations detected only after next-day lab tests [Q-1]. The central bottleneck is the lack of a predictive pipeline capable of utilizing daily intake data such as temperature, somatic cell counts, and fat and protein readings to flag problematic batches prior to processing [Q-1].

## Research questions
1. Can daily intake parameters such as temperature, somatic cell counts, and fat and protein readings accurately predict milk batch quality variations before next-day laboratory results?
2. How can cow-level subclinical ketosis risk and metabolic biomarker models be scaled and bridged to truck-tank and intake-level data streams at the dairy processing plant?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Phase 1 | Harmonize historical intake data parameters including temperature, somatic cell counts, fat, and protein readings with farm management datasets. | A validated data pipeline linking intake parameters to historical batch quality outcomes. |
| Phase 2 | Adapt and train machine learning classification algorithms to predict subclinical disease risk and milk quality variations using intake-level data streams. | A working predictive classification model operationalized for intake testing. |
| Phase 3 | Pilot the predictive model in the dairy processing plant to evaluate real-time batch screening efficacy and minimize yoghurt and cheese line losses. | A deployed decision support tool at the plant intake station accompanied by a joint validation report. |

## What each side brings
**Company**
- Intake-level data streams including temperature, somatic cell counts, and fat and protein readings
- Engineering and data pipeline capacity from its 60-person organization
- Dairy processing plant environment and operational testing ground

**Faculty**
- Expertise in dairy cattle metabolic health and disease classification
- Experience in machine learning classification of subclinical ketosis using farm management data
- Academic supervision and research methodology in precision livestock farming

## Why this pair (every line checked by the critic)
- Ivona Jovanovic is a Full Professor at the Department of Veterinary Medicine, Faculty of Agriculture. [R0774]
- Ivona Jovanovic published research on machine learning classification of subclinical ketosis risk using routinely collected farm management data in 2025. [SYN-PUB-08506]
- The company runs a mid-sized dairy in Vojvodina and faces product losses in yoghurt and cheese lines due to farm-to-farm milk quality variations detected only after next-day lab tests. [Q-1]
- Ivona Jovanovic is open to joint research projects on precision livestock farming and metabolic disease diagnostics. [R0774]

## Risks and rebuttals
- **CTO Shark:** Jovanovic notes she does not have engineering expertise in-house and is actively looking for a complementary partner in that area, meaning our 60-person company must provide the engineering and data pipeline capacity.
  **Rebuttal:** The company provides the required engineering and data pipeline capacity while the researcher supplies the domain expertise and validated machine learning classification frameworks.
- **Professor Shark:** How do we bridge the gap between your cow-level metabolic and biomarker models and our truck-tank and intake-level data streams at the dairy processing plant?
  **Rebuttal:** Phase 1 of the project plan is specifically dedicated to mapping and harmonizing intake-level parameters with farm-level variables to bridge cow-level models with plant intake data.

## The sharks' questions for the first meeting
- **CTO Shark:** Can we operationalize your random forest classifier using our daily intake data like temperature, somatic cell counts, and fat and protein readings to predict batch issues before the next-day lab results come in?
- **Professor Shark:** How do we bridge the gap between your cow-level metabolic and biomarker models and our truck-tank and intake-level data streams at the dairy processing plant?

## Agreed up front
- Background intellectual property remains with the respective institution and company.
- Results of the joint project can be published in academic literature provided proprietary commercial data is anonymized.
- Commercial exploitation rights for the final decision support tool at the dairy plant are held by the company, with research credit acknowledged.

## First meeting agenda
1. Review available data formats for temperature, somatic cell counts, and fat and protein readings at the dairy plant intake.
2. Define data security and sharing protocols between the dairy facility and the university research group.
3. Establish project timeline milestones for Phase 1 data harmonization.

## Claims the critic removed on the way
- None.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
