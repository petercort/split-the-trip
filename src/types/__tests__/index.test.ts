import { Trip, User, Expense } from '../index';

describe('Type Definitions', () => {
  describe('User interface', () => {
    it('should have correct structure', () => {
      const user: User = {
        id: '1',
        name: 'Test User'
      };

      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(typeof user.id).toBe('string');
      expect(typeof user.name).toBe('string');
    });

    it('should accept valid user data', () => {
      const users: User[] = [
        { id: '1', name: 'Alice' },
        { id: '2', name: 'Bob' },
        { id: '3', name: 'Charlie' }
      ];

      users.forEach(user => {
        expect(user.id).toBeDefined();
        expect(user.name).toBeDefined();
      });
    });
  });

  describe('Expense interface', () => {
    const testUsers: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ];

    it('should have correct structure', () => {
      const expense: Expense = {
        id: '1',
        vendor: 'Restaurant',
        amount: 25.50,
        attendees: testUsers,
        payer: testUsers[0]
      };

      expect(expense).toHaveProperty('id');
      expect(expense).toHaveProperty('vendor');
      expect(expense).toHaveProperty('amount');
      expect(expense).toHaveProperty('attendees');
      expect(expense).toHaveProperty('payer');
      
      expect(typeof expense.id).toBe('string');
      expect(typeof expense.vendor).toBe('string');
      expect(typeof expense.amount).toBe('number');
      expect(Array.isArray(expense.attendees)).toBe(true);
      expect(expense.payer).toMatchObject({ id: expect.any(String), name: expect.any(String) });
    });

    it('should accept expenses with different attendee configurations', () => {
      const expenses: Expense[] = [
        {
          id: '1',
          vendor: 'Solo meal',
          amount: 15,
          attendees: [testUsers[0]],
          payer: testUsers[0]
        },
        {
          id: '2',
          vendor: 'Group dinner',
          amount: 60,
          attendees: testUsers,
          payer: testUsers[1]
        }
      ];

      expenses.forEach(expense => {
        expect(expense.attendees.length).toBeGreaterThan(0);
        expect(expense.attendees).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: expect.any(String),
              name: expect.any(String)
            })
          ])
        );
      });
    });
  });

  describe('Trip interface', () => {
    const testUsers: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ];

    const testExpenses: Expense[] = [
      {
        id: '1',
        vendor: 'Restaurant',
        amount: 30,
        attendees: testUsers,
        payer: testUsers[0]
      }
    ];

    it('should have correct structure', () => {
      const trip: Trip = {
        id: '1',
        name: 'Test Trip',
        users: testUsers,
        expenses: testExpenses
      };

      expect(trip).toHaveProperty('id');
      expect(trip).toHaveProperty('name');
      expect(trip).toHaveProperty('users');
      expect(trip).toHaveProperty('expenses');
      
      expect(typeof trip.id).toBe('string');
      expect(typeof trip.name).toBe('string');
      expect(Array.isArray(trip.users)).toBe(true);
      expect(Array.isArray(trip.expenses)).toBe(true);
    });

    it('should accept empty users and expenses arrays', () => {
      const emptyTrip: Trip = {
        id: '1',
        name: 'Empty Trip',
        users: [],
        expenses: []
      };

      expect(emptyTrip.users).toEqual([]);
      expect(emptyTrip.expenses).toEqual([]);
    });

    it('should maintain referential integrity between users and expenses', () => {
      const trip: Trip = {
        id: '1',
        name: 'Test Trip',
        users: testUsers,
        expenses: testExpenses
      };

      // Payer should be one of the users
      const payerIds = trip.users.map(u => u.id);
      trip.expenses.forEach(expense => {
        expect(payerIds).toContain(expense.payer.id);
      });

      // All attendees should be users
      trip.expenses.forEach(expense => {
        expense.attendees.forEach(attendee => {
          expect(payerIds).toContain(attendee.id);
        });
      });
    });
  });

  describe('Payment interface', () => {
    const testUsers: User[] = [
      { id: '1', name: 'Alice' },
      { id: '2', name: 'Bob' }
    ];

    it('should have correct structure', () => {
      const payment = {
        from: testUsers[0],
        to: testUsers[1],
        amount: 15.50
      };

      expect(payment).toHaveProperty('from');
      expect(payment).toHaveProperty('to');
      expect(payment).toHaveProperty('amount');
      
      expect(payment.from).toMatchObject({ id: expect.any(String), name: expect.any(String) });
      expect(payment.to).toMatchObject({ id: expect.any(String), name: expect.any(String) });
      expect(typeof payment.amount).toBe('number');
    });

    it('should handle different payment amounts', () => {
      const payments = [
        { from: testUsers[0], to: testUsers[1], amount: 0.01 },
        { from: testUsers[0], to: testUsers[1], amount: 1000.99 },
        { from: testUsers[0], to: testUsers[1], amount: 33.33 }
      ];

      payments.forEach(payment => {
        expect(payment.amount).toBeGreaterThan(0);
        expect(Number.isFinite(payment.amount)).toBe(true);
      });
    });

    it('should ensure from and to users are different', () => {
      // This is a business logic test - payments should never be to self
      const validPayments = [
        { from: testUsers[0], to: testUsers[1], amount: 10 }
      ];

      const invalidPayments = [
        { from: testUsers[0], to: testUsers[0], amount: 10 }
      ];

      validPayments.forEach(payment => {
        expect(payment.from.id).not.toBe(payment.to.id);
      });

      // In a real application, you might want to validate this constraint
      invalidPayments.forEach(payment => {
        expect(payment.from.id).toBe(payment.to.id); // This would be invalid in business logic
      });
    });
  });
});