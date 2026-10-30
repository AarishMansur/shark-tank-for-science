# Pitch room run

- Mode: **live**
- Models: gemini-3.5-flash-lite (scouts, sharks, critic), gemini-3.5-flash-lite (writer)
- Command: `npm start -- --problem We run a mid-sized dairy in Vojvodina. Our yoghurt and cheese lines lose product when milk quality changes from farm to farm, and we only find out after lab tests the next day. We want to predict which batches will cause problems from data we already collect at intake: temperature, somatic cell counts, fat and protein readings. --pitches 2 --out runs/reverse-run --record recordings/reverse-run.json`
- Scope: reverse search for: "We run a mid-sized dairy in Vojvodina. Our yoghurt and cheese lines lose product when milk quality changes from farm to farm, and we only find out after lab tests the next day. We want to predict which batches will cause problems from data we already collect at intake: temperature, somatic cell counts, fat and protein readings."
- Wall time: 153.6 s
- Pairs pitched: 6, proposals written: 2, killed: 4
- Critic interventions: 3 claims killed (3 by hard rules, 0 by the model check)

## Board
| Pair | Scout | Fate | Why |
| --- | --- | --- | --- |
| Vladimir Radulović [R0792] x Company using reverse search [Q-1] | Problem Hunter | killed | CTO Shark: dealbreaker: Vladimir Radulović is currently fully engaged in the THERMADAPT project through 2026 and prefers industry partnerships connected to that work or his lab, meaning this may not be a near-term engineering fix for next-day plant losses. |
| Nevena Bošković [R0893] x Company using reverse search [Q-1] | Problem Hunter | killed | CTO Shark: dealbreaker: The company challenges focus on intake data such as temperature, somatic cell counts, fat and protein readings, whereas the researcher specializes in wearable sensor data like activity and rumination collars. |
| Ivona Jovanović [R0774] x Company using reverse search [Q-1] | Fresh Ink | proposal: [01-predictive-milk-quality-and-ketosis-risk-management-for-dair.md](proposals/01-predictive-milk-quality-and-ketosis-risk-management-for-dair.md) | CTO Shark invest 8/10, Professor Shark invest 8/10 |
| Ana Todić [R0863] x Company using reverse search [Q-1] | Fresh Ink | proposal: [02-industrial-phd-proposal-real-time-soft-sensors-for-milk-qual.md](proposals/02-industrial-phd-proposal-real-time-soft-sensors-for-milk-qual.md) | CTO Shark invest 8/10, Professor Shark invest 9/10 |
| Aleksandra Vranješ [R0417] x Company using reverse search [Q-1] | Bridge Builder | killed | CTO Shark: dealbreaker: The challenge requires predicting problematic batches at intake using existing data like temperature, somatic cell counts, fat, and protein readings, which is a predictive modeling or data integration problem rather than a starter culture or biopolymer functionality research problem. |
| Đurđica Žigić [R0289] x Company using reverse search [Q-1] | Bridge Builder | killed | Professor Shark: dealbreaker: The availability notes state that Đurđica Žigić is currently engaged on the FERMSIM project until the end of 2026 and is only available for shorter consulting engagements, which makes an industrial PhD thesis commitment impossible. |

## Critic interventions
- **R0417xQ-1** Professor Shark: "Aleksandra Vranješ is a Full Professor at the Department of Carbohydrate Food Engineering, Faculty of Technology." [R0417, c1]: cites c1, which does not exist in the dataset
- **R0417xQ-1** Professor Shark: "Aleksandra Vranješ published research on in situ exopolysaccharide formation and its influence on syneresis and water-holding capacity in stirred fermented milk." [SYN-PUB-05010, c2]: cites c2, which does not exist in the dataset
- **R0417xQ-1** Professor Shark: "Aleksandra Vranješ has provided technical consulting to two regional dairy processors on starter culture selection and syneresis reduction in low-fat yoghurt." [R0417, c3]: cites c3, which does not exist in the dataset

## Tokens per agent
| Agent | Model calls | Input tokens | Output tokens | Errors |
| --- | ---: | ---: | ---: | ---: |
| Bridge Builder | 1 | 1234 | 738 | 0 |
| Critic | 14 | 21622 | 5175 | 0 |
| CTO Shark | 6 | 11372 | 2158 | 0 |
| Fresh Ink | 1 | 3668 | 677 | 0 |
| Problem Hunter | 1 | 3389 | 698 | 0 |
| Professor Shark | 6 | 11366 | 2443 | 0 |
| Writer | 2 | 5079 | 2415 | 0 |
| **Total** | **31** | **57730** | **14304** | |

Gemini free tier: no charge. The full event log is in `trace.jsonl`; open `pitch-room.html` to watch the run.
