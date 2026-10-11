/** Register the Next Customer endpoint without duplicating selection/assignment logic. */
export function registerNextCustomerRoute(app, { db, assignNextTicket }) {
  app.post('/api/counters/:counterId/next', async (req, res) => {
    const rawId = req.params.counterId;
    if (typeof rawId !== 'string' || !/^[1-9]\d*$/.test(rawId)) {
      return res.status(400).json({ error: 'Invalid counter ID' });
    }
    const counterId = Number(rawId);
    if (!Number.isSafeInteger(counterId)) {
      return res.status(400).json({ error: 'Invalid counter ID' });
    }
    try {
      const counter = await new Promise((resolve, reject) => {
        db.get('SELECT id FROM Counter WHERE id = ?', [counterId], (error, row) => {
          if (error) reject(error);
          else resolve(row);
        });
      });
      if (!counter) {
        return res.status(404).json({ error: 'Counter not found' });
      }
      const ticket = await assignNextTicket(counterId);
      return res.status(200).json(ticket ?? null);
    } catch (error) {
      console.error('Next-customer API error:', error);
      return res.status(500).json({ error: 'Unable to retrieve next customer' });
    }
  });
}
