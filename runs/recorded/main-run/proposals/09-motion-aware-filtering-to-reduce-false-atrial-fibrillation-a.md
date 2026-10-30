# Motion-Aware Filtering to Reduce False Atrial Fibrillation Alarms in Patch ECG Devices

**Type:** Industrial PhD topic
**Company:** CardioTrack d.o.o. [C091], Medical devices, 12 employees, NTP Novi Sad
**Challenge:** [C091-CH1] Too many false atrial fibrillation alarms when patients move.
**Researcher:** Maja Popović [R0906], Associate Professor, Department of Biomedical Engineering, Faculty of Technical Sciences
**Found by:** First Contact (lens: untapped)
**Room verdict:** CTO Shark invest 8/10, Professor Shark invest 9/10

CardioTrack d.o.o. faces a significant clinical bottleneck where roughly one in four atrial fibrillation alerts in their clinician portal turn out to be motion artifacts. To solve this, Associate Professor Maja Popović will supervise a three-year industrial PhD candidate to integrate her motion-aware filtering framework into CardioTrack's resource-constrained wearable patch. The collaboration leverages CardioTrack's existing three-axis accelerometer data logging at 50 Hz and the researcher's published expertise in false alarm reduction.

## The problem
CardioTrack d.o.o. deals with too many false atrial fibrillation alarms when patients move. When a patient walks fast, reaches overhead, or rolls over in bed, electrode contact changes momentarily and the raw signal looks enough like atrial fibrillation that the current classifier flags it. Right now, roughly one in four AF alerts that land in the clinician portal turns out to be a motion artifact once the cardiologist looks at the raw trace. Clinicians are starting to ignore low-confidence flags entirely, which defeats the purpose of automatic detection.

## Research questions
1. How can single-lead ECG signals and 50 Hz three-axis accelerometer data be fused on resource-constrained microcontrollers to suppress motion artifacts without introducing processing latency?
2. What adaptive threshold mechanisms can minimize false-positive atrial fibrillation rates during high-motion intervals across diverse patient populations?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Year 1 | Adapt and optimize the motion-aware filtering algorithm for offline processing using CardioTrack's existing patient recordings and benchmark datasets. | A validated signal processing pipeline implemented in Python that achieves a target reduction in false atrial fibrillation alerts on historical recordings. |
| Year 2 | Port the optimized filtering algorithms to embedded C for the Nordic nRF5340 SoC and integrate with TensorFlow Lite for on-device inference. | An embedded firmware prototype running on the physical patch hardware that processes simultaneous ECG and 50 Hz accelerometer streams in real time. |
| Year 3 | Conduct bench testing, validate performance against IEC 62304 standards, and complete the doctoral dissertation. | A fully tested firmware module ready for regulatory integration and a successfully defended industrial PhD thesis. |

## What each side brings
**Company**
- Access to a dataset of approximately 1,400 completed patient recordings tagged by reviewing cardiologists
- Hardware prototyping environment utilizing the Nordic nRF5340 SoC and three-axis accelerometer logging at 50 Hz
- Engineering support from two internal biomedical engineers for integration and IEC 62304 compliance

**Faculty**
- Published expertise in cutting false atrial fibrillation alarms in patch ECG with motion-aware filtering
- Direct supervision of an industrial PhD candidate through the University of Novi Sad
- Extensive academic background in biomedical signal processing and wearable sensing systems

## Why this pair (every line checked by the critic)
- Maja Popović published work specifically addressing the cutting of false atrial fibrillation alarms in patch ECG with motion-aware filtering. [SYN-PUB-09638]
- CardioTrack d.o.o. logs three-axis accelerometer data alongside ECG at 50 Hz on their patch, matching the framework proposed in the research. [C091-CH1, SYN-PUB-09638]
- Maja Popović is an Associate Professor at the Department of Biomedical Engineering at the Faculty of Technical Sciences, University of Novi Sad, focusing on biomedical signal processing and wearable sensing systems. [R0906]
- CardioTrack d.o.o. is a medical devices company dealing with too many false atrial fibrillation alarms when patients move. [C091, C091-CH1]

## Risks and rebuttals
- **CTO Shark and Professor Shark:** CardioTrack d.o.o. has an R&D capacity of only two biomedical engineers, which may strain their ability to integrate complex research code into an IEC 62304 compliant product and support an intensive industrial PhD collaboration.
  **Rebuttal:** The industrial PhD candidate will take primary ownership of algorithm development, translating academic Python prototypes into embedded C for the Nordic nRF5340 SoC, thereby minimizing the direct burden on CardioTrack's two internal engineers.

## The sharks' questions for the first meeting
- **CTO Shark:** Will Maja Popović provide a production-ready C implementation for the Nordic nRF5340 SoC, or is this academic Python code that our two biomedical engineers will have to rewrite from scratch?
- **Professor Shark:** Given that your company has an R&D capacity of only two engineers, how do you propose to support a rigorous three-year industrial doctoral thesis while maintaining your regulatory and product release cycles?

## Agreed up front
- All background intellectual property remains with the respective originating party.
- Foreground IP developed jointly during the industrial PhD will be co-owned or licensed according to standard commercial terms agreed prior to project launch.
- Both parties agree to support academic publication of research findings, subject to prior review for patent protection and trade secret preservation.

## First meeting agenda
1. Review technical specifications of the Nordic nRF5340 SoC and existing firmware architecture.
2. Define the precise scope and milestone deliverables for Year 1 of the industrial PhD.
3. Establish data sharing protocols for anonymized patient recordings while maintaining medical device compliance.

## Claims the critic removed on the way
- ~~Maja Popović has no industry experience on record and is open to industrial PhD supervision and joint projects.~~ (First Contact, cited K1): cites K1, which does not exist in the dataset

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
