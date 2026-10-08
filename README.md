# SE2-Office-Queue-Management
### Queue Selection and Service-Time Tie Breaker

The queue-selection logic selects the next service for a counter based on the following rules:

1. Select the compatible service with the longest waiting queue.
2. If queue lengths are equal, select the service with the shortest average service time.
3. If both values are equal, select the service with the lowest ID.
4. If all compatible queues are empty, return `null`.

The selection logic does not modify ticket statuses or assign tickets.

**Implementation Files:**
- `server/queueSelection.js`
- `server/queueService.js`

**Test Files:**
- `server/tests/queueSelection.test.js`
- `server/tests/queueSelection.integration.test.js`

**Running the Tests:**

```bash
node --test server/tests/queueSelection.test.js server/tests/queueSelection.integration.test.js
```

The tests verify queue selection, tie-breaking rules, empty queues, compatibility filtering, and integration with DAO data.