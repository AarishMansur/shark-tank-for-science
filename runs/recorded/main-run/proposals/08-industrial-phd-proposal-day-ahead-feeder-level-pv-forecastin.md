# Industrial PhD Proposal: Day-Ahead Feeder-Level PV Forecasting Models for Distribution Networks

**Type:** Industrial PhD topic
**Company:** GridSense Analytics [C047], Energy software, 31 employees, NTP Novi Sad
**Challenge:** [C047-CH2] Rooftop PV is changing feeder loads; operators need a day-ahead forecast per feeder.
**Researcher:** Tamara Simić [R0904], Associate Professor, Department of Power, Electronics and Telecommunications, Faculty of Technical Sciences
**Found by:** First Contact (lens: untapped)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 8/10

GridSense Analytics and Dr. Tamara Simić will develop, containerize, and deploy day-ahead PV forecasting models for distribution network feeders to resolve inaccurate load profiles caused by rooftop solar penetration. The three-year industrial PhD will translate advanced satellite cloud data methodologies into a production-grade Azure environment. Both parties will jointly bridge the gap between academic forecasting models and scalable energy software architecture.

## The problem
Rooftop solar installations are growing rapidly in the areas GridSense Analytics customers serve, meaning standard load profiles no longer reflect actual feeder flows at midday on sunny days. Some feeders now show reverse power flow in the afternoon, causing switching and maintenance decisions to be off by thirty percent or more. Although the company possesses half-hourly smart meter reads, airport weather station data, and licensed satellite irradiance estimates, they lack a model that produces a per-feeder load forecast twenty-four hours ahead, updated each evening and capable of running on a small Azure virtual machine within their existing FastAPI and Docker stack.

## Research questions
1. How can hybrid convolutional-recurrent neural network architectures processing satellite cloud motion imagery and numerical weather data be optimized to run within the computational limits of a small Azure virtual machine?
2. To what extent can day-ahead per-feeder load forecasting errors driven by reverse power flow from rooftop PV be reduced compared to baseline standard load profiles?
3. What model compression and feature reduction techniques maintain day-ahead forecast accuracy while meeting the operational evening update schedule of GridSense Analytics?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Year 1 | Data ingestion pipeline development and baseline model adaptation using historical smart meter reads, airport weather data, and satellite irradiance estimates. | A validated core forecasting prototype running in a local Python environment that predicts per-feeder loads twenty-four hours ahead. |
| Year 2 | Model containerization, optimization, and integration into the GridSense Analytics FastAPI and Docker stack for deployment on a small Azure virtual machine. | A lightweight, containerized machine learning service that executes the evening update schedule without exceeding Azure compute budgets. |
| Year 3 | Field testing on live distribution feeder datasets, performance benchmarking against operator requirements, and thesis finalization. | A fully evaluated production-ready forecasting module, an industrial PhD dissertation, and co-authored technical publications. |

## What each side brings
**Company**
- Access to proprietary smart meter reads, airport weather station data, and licensed satellite irradiance estimates [C047-CH2].
- An established commercial software stack including Python, FastAPI, Docker, and Azure infrastructure [C047].
- Engineering guidance and co-supervision from internal technical staff with prior experience in joint academic collaborations [C047].

**Faculty**
- World-class research expertise in day-ahead photovoltaic power forecasting for distribution feeders using satellite cloud data [R0904, SYN-PUB-09619].
- Academic supervision for a dedicated industrial PhD candidate at the Faculty of Technical Sciences, University of Novi Sad [R0904].
- Extensive knowledge in smart grids, renewable energy integration, and power system forecasting methodologies [R0904].

## Why this pair (every line checked by the critic)
- Tamara Simić is an Associate Professor at the Faculty of Technical Sciences whose research focuses on smart grids, renewable energy integration, and power system forecasting [R0904]. [R0904]
- Tamara Simić published work on day-ahead PV forecasting for distribution feeders with satellite cloud data [SYN-PUB-09619]. [SYN-PUB-09619]
- GridSense Analytics builds energy software and needs to solve the challenge of day-ahead forecasts per feeder due to rooftop PV integration [C047, C047-CH2]. [C047, C047-CH2]
- GridSense Analytics has an R&D team of thirty-one employees, including five engineers with one holding a PhD, and has past experience supervising two master's theses jointly [C047]. [C047]

## Risks and rebuttals
- **CTO Shark:** GridSense Analytics has an R&D capacity of only five engineers with one PhD, which may stretch thin when implementing and maintaining production-grade machine learning models on Azure.
  **Rebuttal:** The industrial PhD structure places primary research execution on the doctoral candidate under Dr. Tamara Simić's supervision, minimizing the load on the five-person engineering team. GridSense Analytics engineers will act primarily in an architectural and integration advisory role, leveraging their prior experience of co-supervising two master's theses.
- **Professor Shark:** The company has five engineers with only one holding a PhD, which might stretch internal R&D capacity for a full three-year industrial thesis without careful framing.
  **Rebuttal:** The project scope is tightly bounded around containerizing and deploying a specific existing research methodology rather than exploratory open-ended development. The academic supervisor will handle formal doctoral milestones, ensuring internal company resources remain focused solely on software integration.

## The sharks' questions for the first meeting
- **CTO Shark:** Can this research prototype be containerized to run efficiently on a small Azure virtual machine within your existing FastAPI and Docker stack without blowing up our cloud compute budget?
- **Professor Shark:** Can this day-ahead forecasting framework be packaged efficiently enough to run within the constraints of a small Azure virtual machine while meeting the operational update schedule?

## Agreed up front
- Background intellectual property remains with the respective originating party.
- Foreground intellectual property developed jointly during the industrial PhD will be co-owned, with commercial exploitation rights granted to GridSense Analytics and academic publication rights secured for the researcher.
- All publications will be reviewed prior to submission to ensure proprietary commercial data of GridSense Analytics is protected.

## First meeting agenda
1. Review sample smart meter and satellite data formats available within the Azure environment.
2. Define exact computational resource constraints and memory limits for the target Azure virtual machine.
3. Establish the governance framework and meeting cadence between Faculty of Technical Sciences and GridSense Analytics engineers.

## Claims the critic removed on the way
- ~~Tamara Simić has no industry experience on record and is open to joint projects and industrial PhD supervision.~~ (First Contact, cited K3): cites K3, which does not exist in the dataset

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
