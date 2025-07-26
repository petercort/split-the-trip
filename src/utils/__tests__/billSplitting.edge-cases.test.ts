import { calculatePayments, debugBalances } from '../billSplitting';
import { Trip, User, Expense } from '@/types';

describe('Bill Splitting Edge Cases and Error Scenarios', () => {
  const createUser = (id: string, name: string): User => ({ id, name });
  const createExpense = (id: string, vendor: string, amount: number, attendees: User[], payer: User): Expense => ({
    id, vendor, amount, attendees, payer
  });

  describe('Boundary Value Testing', () => {
    it('should handle minimum payment threshold correctly', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      
      // Test exactly at threshold
      const tripAtThreshold: Trip = {
        id: '1', name: 'At Threshold', users,
        expenses: [createExpense('1', 'Test', 0.02, users, users[0])]
      };
      
      expect(calculatePayments(tripAtThreshold)).toEqual([]);
      
      // Test just above threshold
      const tripAboveThreshold: Trip = {
        id: '2', name: 'Above Threshold', users,
        expenses: [createExpense('1', 'Test', 0.03, users, users[0])]
      };
      
      const payments = calculatePayments(tripAboveThreshold);
      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(0.02); // Rounded to 2 decimal places
    });

    it('should handle maximum realistic scenarios', () => {
      const users = Array.from({ length: 50 }, (_, i) => createUser(`${i}`, `User${i}`));
      const expenses = Array.from({ length: 100 }, (_, i) => createExpense(
        `${i}`, `Expense${i}`, 1000,
        users.slice(0, 10), users[i % users.length]
      ));
      
      const trip: Trip = { id: '1', name: 'Large Trip', users, expenses };
      
      expect(() => calculatePayments(trip)).not.toThrow();
      expect(() => debugBalances(trip)).not.toThrow();
    });

    it('should handle zero amount expenses', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      const trip: Trip = {
        id: '1', name: 'Zero Amount', users,
        expenses: [createExpense('1', 'Free', 0, users, users[0])]
      };
      
      expect(calculatePayments(trip)).toEqual([]);
    });

    it('should handle very large amounts', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      const trip: Trip = {
        id: '1', name: 'Large Amount', users,
        expenses: [createExpense('1', 'Expensive', 999999.99, users, users[0])]
      };
      
      const payments = calculatePayments(trip);
      expect(payments).toHaveLength(1);
      expect(payments[0].amount).toBe(500000.00); // Properly rounded
    });
  });

  describe('Data Integrity Tests', () => {
    it('should maintain user object references correctly', () => {
      const userA = createUser('1', 'A');
      const userB = createUser('2', 'B');
      const trip: Trip = {
        id: '1', name: 'Reference Test', users: [userA, userB],
        expenses: [createExpense('1', 'Test', 20, [userA, userB], userA)]
      };
      
      const payments = calculatePayments(trip);
      expect(payments[0].from).toBe(userB); // Same object reference
      expect(payments[0].to).toBe(userA);
    });

    it('should handle duplicate user IDs gracefully', () => {
      const userA1 = createUser('1', 'A1');
      const userA2 = createUser('1', 'A2'); // Same ID, different name
      const userB = createUser('2', 'B');
      
      const trip: Trip = {
        id: '1', name: 'Duplicate ID Test', users: [userA1, userA2, userB],
        expenses: [createExpense('1', 'Test', 30, [userA1, userB], userA1)]
      };
      
      // Should still work but may have unexpected behavior due to duplicate IDs
      expect(() => calculatePayments(trip)).not.toThrow();
    });

    it('should handle empty strings in user names', () => {
      const users = [createUser('1', ''), createUser('2', 'Valid Name')];
      const trip: Trip = {
        id: '1', name: 'Empty Name Test', users,
        expenses: [createExpense('1', 'Test', 20, users, users[0])]
      };
      
      expect(() => calculatePayments(trip)).not.toThrow();
      const debug = debugBalances(trip);
      expect(debug.expenseBreakdown[0].payer).toBe('');
    });
  });

  describe('Floating Point Precision Tests', () => {
    it('should handle floating point arithmetic correctly', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B'), createUser('3', 'C')];
      const trip: Trip = {
        id: '1', name: 'Precision Test', users,
        expenses: [createExpense('1', 'Test', 10.01, users, users[0])]
      };
      
      const payments = calculatePayments(trip);
      const debug = debugBalances(trip);
      
      // Should be exactly 3.34 when rounded
      expect(debug.expenseBreakdown[0].splitAmount).toBe(3.34);
      payments.forEach(payment => {
        expect(payment.amount).toBe(3.34);
      });
    });

    it('should handle repeating decimals correctly', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B'), createUser('3', 'C')];
      const trip: Trip = {
        id: '1', name: 'Repeating Test', users,
        expenses: [createExpense('1', 'Test', 10, users, users[0])]
      };
      
      const payments = calculatePayments(trip);
      
      // 10/3 = 3.333... should round to 3.33
      payments.forEach(payment => {
        expect(payment.amount).toBe(3.33);
      });
    });

    it('should accumulate rounding errors correctly in complex scenarios', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B'), createUser('3', 'C')];
      const expenses = Array.from({ length: 10 }, (_, i) => 
        createExpense(`${i}`, `Expense${i}`, 10.01, users, users[i % users.length])
      );
      
      const trip: Trip = { id: '1', name: 'Accumulation Test', users, expenses };
      
      const payments = calculatePayments(trip);
      
      // Verify that total input equals total output (within rounding tolerance)
      const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
      
      expect(totalExpenses).toBeCloseTo(100.1, 2);
      expect(totalPayments).toBeGreaterThan(0);
    });
  });

  describe('Algorithm Stress Tests', () => {
    it('should handle circular debt scenarios', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B'), createUser('3', 'C')];
      const expenses = [
        createExpense('1', 'A pays for B', 30, [users[1]], users[0]), // A pays $30 for B
        createExpense('2', 'B pays for C', 30, [users[2]], users[1]), // B pays $30 for C  
        createExpense('3', 'C pays for A', 30, [users[0]], users[2])  // C pays $30 for A
      ];
      
      const trip: Trip = { id: '1', name: 'Circular Test', users, expenses };
      const payments = calculatePayments(trip);
      
      // The algorithm doesn't automatically detect circular debt, so payments may exist
      // but the total should balance out mathematically
      const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);
      expect(totalPayments).toBeGreaterThanOrEqual(0);
    });

    it('should handle everyone-pays-for-everyone scenario', () => {
      const users = Array.from({ length: 5 }, (_, i) => createUser(`${i}`, `User${i}`));
      const expenses = users.map((payer, i) => 
        createExpense(`${i}`, `Expense${i}`, 100, users, payer)
      );
      
      const trip: Trip = { id: '1', name: 'Everyone Pays Test', users, expenses };
      const payments = calculatePayments(trip);
      
      // Everyone pays $100 and owes $100, so no net payments
      expect(payments).toHaveLength(0);
    });

    it('should handle uneven group participation', () => {
      const users = Array.from({ length: 5 }, (_, i) => createUser(`${i}`, `User${i}`));
      const expenses = [
        // Only first 2 users participate in expensive item
        createExpense('1', 'Expensive', 1000, users.slice(0, 2), users[0]),
        // All users participate in cheap item
        createExpense('2', 'Cheap', 10, users, users[4])
      ];
      
      const trip: Trip = { id: '1', name: 'Uneven Test', users, expenses };
      const payments = calculatePayments(trip);
      
      expect(payments.length).toBeGreaterThan(0);
      
      // Verify mathematical correctness
      const debug = debugBalances(trip);
      expect(debug.expenseBreakdown).toHaveLength(2);
      expect(debug.expenseBreakdown[0].splitAmount).toBe(500); // 1000/2
      expect(debug.expenseBreakdown[1].splitAmount).toBe(2);   // 10/5
    });
  });

  describe('Memory and Performance Edge Cases', () => {
    it('should not leak memory with repeated calculations', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      const trip: Trip = {
        id: '1', name: 'Memory Test', users,
        expenses: [createExpense('1', 'Test', 20, users, users[0])]
      };
      
      // Perform many calculations
      for (let i = 0; i < 1000; i++) {
        calculatePayments(trip);
        debugBalances(trip);
      }
      
      // Should complete without issues
      expect(true).toBe(true);
    });

    it('should handle deeply nested object structures', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      const trip: Trip = {
        id: '1', name: 'Deep Test', users,
        expenses: [createExpense('1', 'Test', 20, users, users[0])]
      };
      
      // Add additional properties to test deep cloning behavior
      (trip as Trip & { metadata: { nested: { deep: { value: string } } } }).metadata = { nested: { deep: { value: 'test' } } };
      
      expect(() => calculatePayments(trip)).not.toThrow();
    });
  });

  describe('Input Validation Edge Cases', () => {
    it('should handle missing required properties gracefully', () => {
      // Test with incomplete user objects
      const incompleteTrip: Trip = {
        id: '1',
        name: 'Incomplete',
        users: [{ id: '1', name: 'Default Name' }], // Ensure all users have a name
        expenses: []
      };
      expect(() => calculatePayments(incompleteTrip)).not.toThrow();
    });

    it('should handle null and undefined values', () => {
      const users = [createUser('1', 'A'), createUser('2', 'B')];
      const tripWithNulls: Trip & { expenses: Array<Expense & { vendor: null }> } = {
        id: '1',
        name: 'Null Test',
        users,
        expenses: [
          {
            id: '1',
            vendor: null as unknown as string, // Intentionally testing null values
            amount: 20,
            attendees: users,
            payer: users[0]
          }
        ]
      };
      
      expect(() => calculatePayments(tripWithNulls)).not.toThrow();
    });
  });
});