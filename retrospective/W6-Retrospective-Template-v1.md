# Sprint 1 Retrospective — Team 4

The retrospective includes the following sections:

- [process measures](#process-measures)
- [quality measures](#quality-measures)
- [general assessment](#assessment)

## PROCESS MEASURES

### Macro statistics

- Number of stories committed vs. done: 2 vs. 2
- Total points committed vs. done: 13 vs. 13
- Team hours planned vs. spent: 53 h vs. 52 h 25 min

The stories marked Done satisfy the Definition of Done below.

>**Definition of Done**
>- The story requirements are satisfied.
>- The relevant unit tests pass.
>- Integration and End-to-End tests pass.
>- The code has been reviewed by another team member.
>- The code is on GitHub and integrated according to the agreed workflow.
>- The relevant documentation is up to date.

### Detailed statistics

| Story | # Tasks | Points | Hours est. | Hours actual |
|-------|--------:|-------:|------------|--------------|
| *#0*  | 8       | -      | 20 h 30 min | 19 h 55 min |
| #1    | 12      | 5      | 15 h        | 18 h 40 min |
| #2    | 10      | 8      | 17 h 30 min | 13 h 50 min |
| **Total** | **30** | **13** | **53 h** | **52 h 25 min** |

> Technical tasks are grouped under Story #0. Story points are not applicable.

- Hours per task average and standard deviation:

  |            | Mean | StDev |
  |------------|------|-------|
  | Estimation | 1.77 h | 1.64 h |
  | Actual     | 1.75 h | 1.75 h |

- Total estimation error ratio:

  $$\frac{\sum_i spent_{task_i}}{\sum_i estimation_{task_i}} - 1
  = \frac{52.4167}{53.0000} - 1
  = \mathbf{-1.10\%}$$

- Absolute relative task estimation error:

  $$\frac{1}{n}\sum_{i=1}^{n}
  \left|\frac{spent_{task_i}}{estimation_{task_i}}-1\right|
  = \frac{10.9861}{30}
  = \mathbf{36.62\%}$$

## QUALITY MEASURES

- Unit Testing:
  - Total hours estimated: 3 h
  - Total hours spent: 1 h
  - Number of automated unit test cases: 54
  - Coverage: 62.55% statements / 59.80% branches / 64.28% functions / 63.72% lines

- Integration/API and E2E testing:
  - Total hours estimated: 4 h
  - Total hours spent: 3 h 30 min
  - Number of test cases: 69 automated integration/API tests and 2 manual E2E flows

- Code review:
  - Total hours estimated: 3 h 30 min
  - Total hours spent: 5 h 25 min

Coverage was measured with Vitest and v8 on backend application files, excluding the test database helper. The two manual E2E flows are not included in the coverage calculation.

## ASSESSMENT

- **Causes of estimation errors:** The total effort was close to the estimate, but task-level estimates varied. UI, code review, and integration/testing tasks took longer than planned, while some queue-related and unit-testing tasks took less time. These differences partly offset each other. Team members also spent different amounts of time checking details and links with other tasks.

- **Lessons learned:** We completed both committed stories within the academic prototype scope, and all 123 automated tests passed. A close total effort does not necessarily mean that individual task estimates were accurate. Reviewing estimates and actual times at task level gives us more useful information for the next sprint. Although Get Ticket was completed for the academic prototype and met the sprint’s Definition of Done, it would not be considered complete for real-world use. The ticket is not printed: its code appears in a confirmation window for 20 seconds, so the customer must note it down. The Vitest coverage results also showed that some code branches were not exercised. We can use these results to identify areas that may need additional tests.

- **Current sprint goals achieved:** We completed both committed stories and all 13 story points within the academic prototype scope. Customers can request a ticket and view its code, and officers can call the next customer.

- **Current sprint goals not achieved:** The ticket flow is not yet complete for real-world use. No physical ticket printing was implemented, and the code is displayed only for 20 seconds. Get Ticket would need further work before it could be considered complete for deployment.

- **Improvement goals for the next sprint:**
  1. **Plan a more realistic sprint:** Use actual task times from this sprint as a reference, include time for implementation, testing, integration, and review, and commit to a smaller amount of work that fits the team’s capacity. Clarify whether real-world requirements, such as printing or otherwise issuing a physical ticket, are in scope.
  2. **Agree on a shared way of working and balance the workload:** Some members checked details and links with related tasks, while others focused mainly on their assigned tasks. At the start of the next sprint, agree on how to handle these cross-task checks. Check in regularly to compare workloads, discuss blockers, and redistribute tasks early when needed.

- **One thing we are proud of as a team:** We delivered both committed stories within the academic prototype scope, connecting the customer ticket flow with the officer workflow, including officer login. The work was supported by 123 passing automated tests, and we performed two manual E2E flows.