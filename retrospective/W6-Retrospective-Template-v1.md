TEMPLATE FOR RETROSPECTIVE (Team ##)
=====================================

The retrospective should include _at least_ the following
sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES 

### Macro statistics

- Number of stories committed vs done: **2 committed / 2 done** *(Story #1: Get Ticket, Story #2: Next Customer)*
- Total points committed vs done: **13 committed / 13 done**
- Nr of hours planned vs spent (as a team): **52.00 h planned / 51.42 h spent** *(52h 00m planned vs 51h 25m actual)*

**Remember**  a story is done ONLY if it fits the Definition of Done:
 
- Unit Tests passing: automated unit tests written and passing for DAO logic and API routes.
- Code review completed: PR reviewed and approved on GitHub by at least one teammate.
- Code present on Git: all feature commits merged into `main` with proper commit messages.
- End-to-End tests performed: manual integration flow verified (Customer UI -> API -> DB -> Officer UI).


> Please refine your DoD 

### Detailed statistics

| Story  | # Tasks | Points | Hours est. | Hours actual |
|--------|---------|--------|------------|--------------|
| _#0_   |   8     |    -   |      20.5  |      19.92   |
| _#1_   |   12    |    5   |      15.0  |      18.67   |
| _#2_   |   9     |    8   |      16.5  |      12.83   |
   

> place technical tasks corresponding to story `#0` and leave out story points (not applicable in this case)

- Hours per task average, standard deviation (estimate and actual)

|            | Mean | StDev |
|------------|------|-------|
| Estimation |   1.79 h   |    1.67 h   | 
| Actual     |   1.77 h   |    1.78 h   |



- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

    $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1 = \frac{51.4167}{52.0000} - 1 = \quad \mathbf{-1.12\%} $$
    
- Absolute relative task estimation error: sum( abs( spent-task-i / estimation-task-i - 1))/n

    $$\frac{1}{n}\sum_i^n \left\vert{} \frac{spent_{task_i}}{estimation\_task_i}-1 \right\vert{} = \frac{10.9861}{29} =  \quad \mathbf{37.86\%}$$

  
## QUALITY MEASURES 

- Unit Testing: *(OQM-15 Get Ticket, OQM-28 Next Customer)*
  - Total hours estimated: **3.00 h**
  - Total hours spent: **1.00 h**
  - Nr of automated unit test cases: **54** *(123 automated tests in total, all passing)*
  - Coverage: **80.56% statements / 73.85% branches / 91.04% functions / 81.15% lines** *(backend, Vitest + v8)*
- E2E testing: *(OQM-22 Get Ticket, OQM-29 Next Customer)*
  - Total hours estimated: **4.00 h** *
  - Total hours spent: **3.50 h**
  - Nr of test cases: **69 automated integration/API tests + 2 manual E2E flows** *(Customer UI -> API -> DB -> Officer UI, one per story)*
- Code review: *(OQM-16 Get Ticket, OQM-30 Next Customer, OQM-36 Setup)*
  - Total hours estimated: **3.50 h**
  - Total hours spent: **5.42 h**


## ASSESSMENT

- What caused your errors in estimation (if any)?

- What lessons did you learn (both positive and negative) in this sprint?

- Which improvement goals set in the previous retrospective were you able to achieve? 
  
- Which ones you were not able to achieve? Why?

- Improvement goals for the next sprint and how to achieve them (technical tasks, team coordination, etc.)

> Propose one or two

- One thing you are proud of as a Team!!