# Sprint 1 Retrospective — Team 4

The retrospective includes the following sections:

- [Sprint context](#sprint-context)
- [Process measures](#process-measures)
- [Quality measures](#quality-measures)
- [Assessment](#assessment)

## SPRINT CONTEXT

- **Sprint:** Sprint 1
- **Dates:** October 5–11, 2026
- **Sprint goal:** Enable customers to obtain a ticket for a service and officers to select the next customer according to the queue-selection rules.
- **Team members:**
  - Lorenzo Bosso — s349410
  - Jessica Barroero — s353204
  - Masha Dolati — s356826
  - Shoya Alimi — s358411
  - Alessandro Michele Berardi — s362713

## PROCESS MEASURES

### Macro statistics

**Table 1.** Sprint commitment and completion summary, including stories, story points, and total team effort.

| Measure | Committed / planned | Done / spent |
|---|---:|---:|
| Stories | 2 | 2 marked Done in YouTrack |
| Story points | 13 | 13 marked Done in YouTrack |
| Team effort | 53.00 h estimated | 52 h 25 min spent |

The stories marked Done satisfy the Definition of Done below.

>**Definition of Done**
>- The story requirements are satisfied.
>- The relevant unit tests pass.
>- Integration and End-to-End tests pass.
>- The code has been reviewed by another team member.
>- The code is on GitHub and integrated according to the agreed workflow.
>- The relevant documentation is up to date.

### Detailed statistics

**Table 2.** Sprint statistics by story: number of tasks, story points, estimated hours, and actual hours. Technical tasks are grouped under Story #0.

| Story | # Tasks | Points | Hours est. | Hours actual |
|-------|--------:|-------:|-----------|--------------|
| #0    | 8       | -      | 20 h 30 min | 19 h 55 min |
| #1    | 12      | 5      | 15 h        | 18 h 40 min |
| #2    | 10      | 8      | 17 h 30 min | 13 h 50 min |
| **Total** | **30** | **13** | **53 h** | **52 h 25 min** |

**Table 3.** Estimated and actual time for each sprint task, including total, mean, and standard deviation.

| Issue | Task | Estimated | Spent |
|-------|------|----------:|------:|
| OQM-8 | Create selection UI | 2 h | 3 h |
| OQM-9 | Sprint Planning | 10 h | 10 h |
| OQM-10 | Technology selection, architecture and repository setup | 2 h 30 min | 2 h 30 min |
| OQM-13 | Implement ticket-generation API | 2 h | 1 h 30 min |
| OQM-14 | Implement available-services API and retrieval | 30 min | 30 min |
| OQM-15 | Unit Testing - Get Ticket | 1 h | 45 min |
| OQM-16 | Code Review - Get Ticket | 1 h | 2 h 40 min |
| OQM-17 | Frontend project setup | 1 h | 40 min |
| OQM-18 | Backend project setup | 1 h 30 min | 1 h 30 min |
| OQM-19 | Database initialization and initial schema | 2 h | 1 h 30 min |
| OQM-20 | Automated testing environment setup | 1 h 30 min | 1 h 45 min |
| OQM-21 | README and setup documentation | 1 h | 1 h 30 min |
| OQM-22 | Integration and E2E Testing - Get Ticket | 2 h | 2 h 30 min |
| OQM-23 | Create officer next-customer UI | 1 h 30 min | 1 h 20 min |
| OQM-24 | Retrieve counter services and waiting-queue lengths | 2 h | 30 min |
| OQM-25 | Implement queue selection and service-time tie breaker | 2 h | 3 h |
| OQM-26 | Select and assign the first waiting ticket atomically | 2 h | 2 h 30 min |
| OQM-27 | Connect officer UI to next-customer API | 1 h 30 min | 1 h |
| OQM-28 | Unit Testing - Next Customer | 2 h | 15 min |
| OQM-29 | Integration and E2E Testing - Next Customer | 2 h | 1 h |
| OQM-30 | Code Review - Next Customer | 1 h 30 min | 2 h 15 min |
| OQM-31 | Persist ticket with unique code in the selected service queue | 2 h | 2 h |
| OQM-32 | Create digital ticket confirmation UI | 1 h | 2 h |
| OQM-33 | Connect customer UI to ticket-generation API | 1 h | 1 h 30 min |
| OQM-34 | Handle empty compatible queues | 30 min | 35 min |
| OQM-35 | Implement next-customer API | 2 h | 1 h |
| OQM-36 | Code Review - Setup | 1 h | 30 min |
| OQM-37 | Refactor ticket code generation to service-specific format | 1 h | 40 min |
| OQM-38 | Connect customer UI to available-services API | 1 h | 1 h |
| OQM-39 | Implement officer login | 1 h | 1 h |
| **Total** | | **53 h** | **52 h 25 min** |
| **Mean hours per task** | | **1.77 h** | **1.75 h** |
| **Standard deviation** | | **1.64 h** | **1.75 h** |
| **Total excluding Sprint Planning** | | **43 h** | **42 h 25 min** |
| **Mean hours per task excluding Sprint Planning** | | **1.48 h** | **1.46 h** |
| **Standard deviation excluding Sprint Planning** | | **0.54 h** | **0.81 h** |

**Overall Sprint Estimation Errors**

- Total estimation error ratio: sum of total hours spent / sum of total hours effort - 1

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{52.4167}{53.0000} - 1
  = \mathbf{-1.10\%}$$

- Absolute relative task estimation error:

  $$\frac{1}{n}\sum_{i=1}^{n}
  \left|\frac{spent_{task_i}}{estimation_{task_i}}-1\right|
  = \frac{10.9861}{30}
  = \mathbf{36.62\%}$$

**Observation:** The overall effort was 35 minutes below the estimate. Get Ticket took about 3 h 40 min more than estimated, while Next Customer took about 3 h 40 min less, so the story-level differences largely offset each other. Some members implemented their tasks and also checked details and links with other tasks. Others focused mainly on their assigned tasks. These different ways of working contributed to the difference in time spent on the two stories.

**Action:** In the next sprint, review the tasks with the largest estimate differences and use their actual times to improve future estimates. At the start of the next sprint, agree on a shared way of working, including when to check related tasks and how much time to plan for these checks. This should make task times more consistent.

**Technical Task Group #0**

- Total estimation error ratio:

  $$\frac{19.9167}{20.5000}-1
  = \mathbf{-2.85\%}$$

- Average absolute relative task estimation error:

  $$\frac{1}{8}\sum_{i=1}^{8}
  \left|\frac{spent_{task_i}}{estimation_{task_i}}-1\right|
  = \frac{1.7500}{8}
  = \mathbf{21.88\%}$$

**Observation:** Technical tasks took about 35 minutes less than estimated overall. The small total difference reflects task times that were both above and below their estimates.

**Action:** Use the actual times for setup, planning, and documentation tasks as a reference when estimating similar work in the next sprint.

**Story #1 - Get Ticket**

- Total estimation error ratio:

  $$\frac{18.6667}{15.0000}-1=\mathbf{+24.44\%}$$

- Average absolute relative task estimation error:

  $$\frac{4.9167}{12}=\mathbf{40.97\%}$$

**Observation:** Get Ticket took about 3 h 40 min more than estimated. The selection UI, confirmation UI, code review, and integration/E2E testing took longer than planned. Shorter times on other tasks partly offset these overruns.

**Action:** Use the actual times from these UI, review, and testing tasks as a reference when estimating similar work in the next sprint.

**Story #2 - Next Customer**

- Total estimation error ratio:

  $$\frac{13.8333}{17.5000}-1=\mathbf{-20.95\%}$$

- Average absolute relative task estimation error:

  $$\frac{4.3194}{10}=\mathbf{43.19\%}$$

**Observation:** Next Customer required about 3 h 40 min less than estimated. Queue retrieval and unit testing took less time than planned, while queue selection and code review took longer. The shorter times on some tasks partly offset the overruns on others.

**Action:** Use the actual times from these queue retrieval, testing, selection, and review tasks as a reference when estimating similar work in the next sprint.

## QUALITY MEASURES

| Activity | YouTrack tasks | Hours estimated | Hours spent | Test cases | Coverage |
|---|---|---:|---:|---|---|
| Unit testing | OQM-15 Get Ticket; OQM-28 Next Customer | 3 h | 1 h | 54 automated unit tests | 62.55% statements / 59.80% branches / 64.28% functions / 63.72% lines |
| Integration/API and E2E testing | OQM-22 Get Ticket; OQM-29 Next Customer | 4 h | 3 h 30 min | 69 automated integration/API tests + 2 manual E2E flows: Get Ticket (Customer UI → API → DB) and Next Customer (Officer UI → API → DB) | 79.81% statements / 71.09% branches / 93.67% functions / 80.86% lines |
| **Total testing effort** | — | **7 h** | **4 h 30 min** | **123 automated tests, all passing** | **81.62% statements / 75.14% branches / 93.67% functions / 82.40% lines** |
| Code review | OQM-16 Get Ticket; OQM-30 Next Customer; OQM-36 Setup | 3 h 30 min | 5 h 25 min | — | — |

*Coverage was measured with Vitest and v8 on backend application files, excluding the test database helper. The overall figures are based on all 123 automated tests. The two manual E2E flows are not included in the coverage calculation.*

## ASSESSMENT

- **Causes of estimation errors:** The total effort was close to the estimate, but task-level estimates varied. UI, code review, and integration/testing tasks took longer than planned, while some queue-related and unit-testing tasks took less time. These differences partly offset each other. Team members also spent different amounts of time checking details and links with other tasks.

- **Lessons learned:** We completed both committed stories within the academic prototype scope, and all 123 automated tests passed. A close total effort does not necessarily mean that individual task estimates were accurate. Reviewing estimates and actual times at task level gives us more useful information for the next sprint. Although Get Ticket was completed for the academic prototype and met the sprint’s Definition of Done, it would not be considered complete for real-world use. The ticket is not printed: its code appears in a confirmation window for 20 seconds, so the customer must note it down. The Vitest coverage results also showed that some code branches were not exercised. We can use these results to identify areas that may need additional tests.

- **Current sprint goals achieved:** We completed both committed stories and all 13 story points within the academic prototype scope. Customers can request a ticket and view its code, and officers can call the next customer.

- **Current sprint goals not achieved:** The ticket flow is not yet complete for real-world use. No physical ticket printing was implemented, and the code is displayed only for 20 seconds. Get Ticket would need further work before it could be considered complete for deployment.

- **Improvement goals for the next sprint:**
  1. **Plan a more realistic sprint:** Use actual task times from this sprint as a reference, include time for implementation, testing, integration, and review, and commit to a smaller amount of work that fits the team’s capacity. Clarify whether real-world requirements, such as printing or otherwise issuing a physical ticket, are in scope.
  2. **Agree on a shared way of working and balance the workload:** Some members checked details and links with related tasks, while others focused mainly on their assigned tasks. At the start of the next sprint, agree on how to handle these cross-task checks. Check in regularly to compare workloads, discuss blockers, and redistribute tasks early when needed.

- **One thing we are proud of as a team:** We delivered both committed stories within the academic prototype scope, connecting the customer ticket flow with the officer workflow, including officer login. The work was supported by 123 passing automated tests, and we performed two manual E2E flows.