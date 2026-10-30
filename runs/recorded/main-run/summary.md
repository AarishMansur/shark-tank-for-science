# Pitch room run

- Mode: **live**
- Models: gemini-3.5-flash-lite (scouts, sharks, critic), gemini-3.5-flash-lite (writer)
- Command: `npm start -- --resume recordings/main-run.json --out runs/main-run`
- Scope: 489 challenges, 1047 researchers, 10779 publications indexed
- Wall time: 216.7 s
- Pairs pitched: 11, proposals written: 9, killed: 2
- Critic interventions: 11 claims killed (3 by hard rules, 8 by the model check)

## Board
| Pair | Scout | Fate | Why |
| --- | --- | --- | --- |
| Emilija Ostojić [R0671] x KreditNova d.o.o. [C151-CH3] | Problem Hunter | proposal: [06-separating-macro-and-micro-default-drivers-in-retail-lending.md](proposals/06-separating-macro-and-micro-default-drivers-in-retail-lending.md) | CTO Shark invest 9/10, Professor Shark invest 9/10 |
| Aleksandar Ristić [R0473] x EkoGradnja Sistem a.d. [C029-CH3] | Problem Hunter | proposal: [03-industrial-phd-proposal-life-cycle-assessment-inventory-and-.md](proposals/03-industrial-phd-proposal-life-cycle-assessment-inventory-and-.md) | CTO Shark invest 9/10, Professor Shark invest 9/10 |
| Ivona Bogdanović [R0269] x Ferment-Pro d.o.o. [C144-CH2] | Problem Hunter | proposal: [02-industrial-phd-proposal-mitigation-of-biomass-fouling-in-spi.md](proposals/02-industrial-phd-proposal-mitigation-of-biomass-fouling-in-spi.md) | CTO Shark pass 8/10, Professor Shark invest 9/10 |
| Jovan Puzović [R0484] x PravniPilot a.d. [C006-CH1] | Fresh Ink | killed | Professor Shark: dealbreaker: Puzović is co-supervising two PhD students whose dissertations are expected in 2026 to 2027, limiting availability for large new commitments until mid-2026. |
| Predrag Jakovljević [R0957] x Paleta Kreativa preduzetnik [C016-CH1] | Fresh Ink | killed | CTO Shark: dealbreaker: Paleta Kreativa has no in-house developer or data analyst to integrate or maintain software tools [C016], meaning this requires ongoing custom contractor work rather than a standard product deployment. |
| Maja Popović [R0906] x CardioTrack d.o.o. [C091-CH1] | First Contact | proposal: [09-motion-aware-filtering-to-reduce-false-atrial-fibrillation-a.md](proposals/09-motion-aware-filtering-to-reduce-false-atrial-fibrillation-a.md) | CTO Shark invest 8/10, Professor Shark invest 9/10 |
| Nenad Ilić [R0662] x Njivomer Agro d.o.o. [C022-CH3] | First Contact | proposal: [05-evapotranspiration-calculation-engine-for-real-time-irrigati.md](proposals/05-evapotranspiration-calculation-engine-for-real-time-irrigati.md) | CTO Shark invest 8/10, Professor Shark invest 8/10 |
| Tamara Simić [R0904] x GridSense Analytics [C047-CH2] | First Contact | proposal: [08-industrial-phd-proposal-day-ahead-feeder-level-pv-forecastin.md](proposals/08-industrial-phd-proposal-day-ahead-feeder-level-pv-forecastin.md) | CTO Shark invest 8/10, Professor Shark invest 8/10 |
| Nebojša Crnković [R0209] x Pulmoteh d.o.o. [C102-CH2] | Bridge Builder | proposal: [01-automating-spirometry-trajectory-and-reference-norm-reportin.md](proposals/01-automating-spirometry-trajectory-and-reference-norm-reportin.md) | CTO Shark invest 8/10, Professor Shark invest 9/10 |
| Đuro Đorđević [R0680] x Polje360 d.o.o. [C111-CH2] | Bridge Builder | proposal: [07-integrating-in-season-plant-sensing-data-into-variable-rate-.md](proposals/07-integrating-in-season-plant-sensing-data-into-variable-rate-.md) | CTO Shark invest 8/10, Professor Shark invest 9/10 |
| Róbert Fehér [R0511] x Kognitiva a.d. [C110-CH2] | Bridge Builder | proposal: [04-advanced-clinical-consistency-checks-for-bulk-health-insuran.md](proposals/04-advanced-clinical-consistency-checks-for-bulk-health-insuran.md) | CTO Shark invest 8/10, Professor Shark invest 8/10 |

## Critic interventions
- **R0906xC091-CH1** First Contact: "Maja Popović has no industry experience on record and is open to industrial PhD supervision and joint projects." [K1]: cites K1, which does not exist in the dataset
- **R0662xC022-CH3** First Contact: "Nenad Ilić has no industry experience listed and is open to joint projects and industrial PhD supervision." [K2]: cites K2, which does not exist in the dataset
- **R0904xC047-CH2** First Contact: "Tamara Simić has no industry experience on record and is open to joint projects and industrial PhD supervision." [K3]: cites K3, which does not exist in the dataset
- **R0671xC151-CH3** CTO Shark: "The company has limited R&D capacity and can only dedicate one senior data engineer and the head of risk to this project. [C151]" [C151]: C151 states the company has 34 people and does not state it has limited R&D capacity or can only dedicate one senior data engineer and the head of risk.
- **R0269xC144-CH2** CTO Shark: "Ferment-Pro has only one process development technologist, Ana Vuković, who splits her time between production troubleshooting and 5-litre bench trials, leaving the company with zero internal R&D capacity to absorb, test, and implement complex membrane protocol changes [C144]." [C144]: Record C144 does not mention Ana Vuković or her splitting time between production and bench trials.
- **R0269xC144-CH2** Professor Shark: "The company relies on a single process development technologist, Ana Vukovic, who splits her time between production and small-scale trials, which might constrain the industrial workload required for a three-year industrial PhD thesis." [C144]: Record C144 does not mention Ana Vukovic or her schedule, nor anything about a three-year industrial PhD thesis workload constraint.
- **R0484xC006-CH1** CTO Shark: "PravniPilot a.d. is a legal tech company based in Subotica with 78 employees, featuring an R&D capacity of 14 engineers and two data scientists." [C006]: C006 states PravniPilot has 78 employees and a development office in NTP Novi Sad and headquarters in Subotica, but does not state it has an R&D capacity of 14 engineers and two data scientists.
- **R0662xC022-CH3** CTO Shark: "Njivomer Agro d.o.o. does not have a dedicated R&D budget line and requires all work to connect directly to existing software or field services." [C022]: Record C022 mentions company details, services, and plans, but does not state that the company lacks a dedicated R&D budget line or requires work to connect to existing software or field services.
- **R0662xC022-CH3** Professor Shark: "Njivomer Agro d.o.o. lacks a dedicated R&D budget line, meaning all practical work must directly connect to their existing software or field services." [C022]: Record C022 does not mention anything about lacking a dedicated R&D budget line or requiring work to connect directly to existing software or field services.
- **R0209xC102-CH2** CTO Shark: "Pulmoteh has only one software developer and one embedded firmware developer on staff, meaning they lack dedicated internal R&D capacity to integrate a complex statistical module into their Java and SQLite based PulmoTrack desktop application without contractor help." [C102, C102-CH2]: Record C102-CH2 states they have one in-house software developer, but does not mention an embedded firmware developer on staff, nor does C102 mention both roles or SQLite specifically in connection with staffing limitations.
- **R0269xC144-CH2** Writer: "Ferment-Pro experiences low nominal throughput during downstream ultrafiltration because membranes foul with residual biomass within 36 hours, adding 11% to total production cost [C144-CH2]." [C144-CH2]: Record C144-CH2 states the throughput is at 55% of nominal throughput, not low nominal throughput.

## Tokens per agent
| Agent | Model calls | Input tokens | Output tokens | Errors |
| --- | ---: | ---: | ---: | ---: |
| Bridge Builder | 1 | 3909 | 1272 | 0 |
| Critic | 32 | 67333 | 12142 | 0 |
| CTO Shark | 11 | 24233 | 4416 | 0 |
| First Contact | 1 | 2668 | 849 | 0 |
| Fresh Ink | 1 | 3760 | 1062 | 0 |
| Problem Hunter | 1 | 3752 | 1200 | 0 |
| Professor Shark | 11 | 24222 | 4339 | 0 |
| Writer | 10 | 28315 | 14116 | 0 |
| **Total** | **68** | **158192** | **39396** | |

Gemini free tier: no charge. The full event log is in `trace.jsonl`; open `pitch-room.html` to watch the run.
