# Separating Macro and Micro Default Drivers in Retail Lending Portfolios

**Type:** Joint project
**Company:** KreditNova d.o.o. [C151], Fintech, alternative lending and credit scoring, 34 employees, Novi Sad
**Challenge:** [C151-CH3] We have three years of repayment data now, roughly 41,000 closed loans, but we still can't quantify how much of the default risk is explained by macroeconomic conditions versus individual borrower behaviour, and the regulator is asking us to separate the two.
**Researcher:** Emilija Ostojić [R0671], Assistant Professor, Department of Finance and Banking, Faculty of Economics in Subotica
**Found by:** Problem Hunter (lens: problems), seconded by Fresh Ink
**Room verdict:** CTO Shark invest 9/10, Professor Shark invest 9/10

KreditNova d.o.o. and Assistant Professor Emilija Ostojić will partner to separate macroeconomic default drivers from individual borrower behaviour across approximately 41,000 closed loans. The project will bridge traditional panel econometrics with a Python and XGBoost scoring pipeline to meet National Bank of Serbia regulatory requirements. This collaboration yields a robust risk decomposition framework that neither partner could build alone.

## The problem
KreditNova d.o.o. has accumulated three years of repayment data covering roughly 41,000 closed loans but cannot quantify how much default risk stems from macroeconomic conditions versus individual borrower behaviour. The National Bank of Serbia requires the company to separate systematic risk from idiosyncratic borrower risk in its next supervisory submission, a task for which the internal risk team lacks a formal two-component econometric model.

## Research questions
1. How can a latent factor econometric framework be integrated into KreditNova's PostgreSQL and Python feature pipeline without disrupting existing credit scoring workflows?
2. What proportion of cross-sectional default variation across the 41,000 closed loans is driven by systematic macroeconomic shocks versus individual borrower characteristics?
3. How can the hybrid credit scoring model satisfy National Bank of Serbia regulatory requirements for macroeconomic sensitivity testing?

## Plan
| Phase | Work | Result |
| --- | --- | --- |
| Phase 1 | Analyze the 41,000 closed loan dataset and specify the latent factor model to decompose historical default rates into macro-financial and borrower-specific components. | A validated econometric specification for risk decomposition tailored to alternative retail lending data. |
| Phase 2 | Translate the econometric latent factor methodology into modular Python code compatible with KreditNova's existing PostgreSQL database and machine learning pipeline. | An operational pipeline module that computes macroeconomic sensitivity metrics alongside existing XGBoost scores. |
| Phase 3 | Calibrate and test the integrated scoring framework against historical portfolio data and structure the documentation required for the National Bank of Serbia regulatory submission. | A fully tested risk decomposition reporting tool and regulatory submission package. |

## What each side brings
**Company**
- Three years of repayment data covering roughly 41,000 closed retail loans with full event histories.
- A senior data engineer and head of risk dedicated as working counterparts.
- A Python-based machine learning scoring infrastructure and PostgreSQL database environment.

**Faculty**
- Expertise in financial econometrics, panel data regression, and credit default risk modeling.
- Proven latent factor methodologies for separating macro and micro default drivers.
- Extensive academic and applied experience in banking stress testing and regulatory data requirements.

## Why this pair (every line checked by the critic)
- KreditNova d.o.o. operates in Novi Sad as a fintech company focusing on alternative lending and credit scoring. [C151]
- KreditNova d.o.o. struggles to separate how much default risk is explained by macroeconomic conditions versus individual borrower behaviour across roughly 41,000 closed loans. [C151-CH3]
- Emilija Ostojić is an Assistant Professor at the Faculty of Economics in Subotica specializing in financial econometrics and credit default risk. [R0671]
- Emilija Ostojić published research on separating macro and micro default drivers in retail lending using a latent factor approach. [SYN-PUB-07582]

## Risks and rebuttals
- **Professor Shark:** KreditNova d.o.o. relies on Python and machine learning pipelines, whereas the researcher's background is deeply rooted in traditional panel econometrics and latent factor models, which might create an integration friction.
  **Rebuttal:** The team will bridge this gap during Phase 2 by translating the econometric specifications into modular Python code that wraps cleanly around the existing PostgreSQL and scikit-learn infrastructure without altering core feature engineering.

## The sharks' questions for the first meeting
- **CTO Shark:** How quickly can Emilija integrate her latent factor methodology into our existing PostgreSQL and Python pipeline so we can pass the National Bank of Serbia regulatory submission without slowing down our core feature engineering?
- **Professor Shark:** How will you bridge the gap between KreditNova's operational Python and XGBoost scoring environment and your latent factor econometric framework to satisfy the National Bank of Serbia regulatory submission?

## Agreed up front
- All loan-level data will be accessed under a strict non-disclosure agreement protecting borrower anonymity.
- Background intellectual property remains with each respective party, while jointly developed pipeline modules will be licensed for commercial deployment at KreditNova.

## First meeting agenda
1. Review data access protocols and finalise the non-disclosure agreement parameters.
2. Inspect the schema of the PostgreSQL closed loan tables and verify variable availability.
3. Establish a weekly project sprint schedule and assign engineering counterparts.

## Claims the critic removed on the way
- ~~The company has limited R&D capacity and can only dedicate one senior data engineer and the head of risk to this project. [C151]~~ (CTO Shark, cited C151): C151 states the company has 34 people and does not state it has limited R&D capacity or can only dedicate one senior data engineer and the head of risk.

---
Records cited here are from the synthetic EINSTEIN hackathon dataset. The pitch room proposes a conversation; it does not rate people.
