import { Trip, Payment, User } from '@/types';

/**
 * Calculates the minimum payments needed to settle all debts in a trip.
 * 
 * This algorithm produces the most efficient solution with the minimum number
 * of transactions. Note that there can be multiple valid solutions to settle
 * the same debts - this algorithm prioritizes efficiency over other factors.
 */
export function calculatePayments(trip: Trip): Payment[] {
  // Calculate net balance for each user (what they paid - what they owe)
  const balances = new Map<string, number>();
  
  // Initialize balances
  trip.users.forEach(user => {
    balances.set(user.id, 0);
  });
  
  // Process each expense
  trip.expenses.forEach(expense => {
    const sharePerPerson = expense.amount / expense.attendees.length;
    
    // Add what the payer paid
    const currentPayerBalance = balances.get(expense.payer.id) || 0;
    balances.set(expense.payer.id, currentPayerBalance + expense.amount);
    
    // Subtract what each attendee owes
    expense.attendees.forEach(attendee => {
      const currentBalance = balances.get(attendee.id) || 0;
      balances.set(attendee.id, currentBalance - sharePerPerson);
    });
  });
  
  // Create lists of debtors and creditors
  const debtors: { user: User; amount: number }[] = [];
  const creditors: { user: User; amount: number }[] = [];
  
  balances.forEach((balance, userId) => {
    const user = trip.users.find(u => u.id === userId);
    if (!user) return;
    
    if (balance < -0.01) { // They owe money (small tolerance for floating point)
      debtors.push({ user, amount: Math.abs(balance) });
    } else if (balance > 0.01) { // They are owed money
      creditors.push({ user, amount: balance });
    }
  });
  
  // Generate payments from debtors to creditors
  const payments: Payment[] = [];
  
  // Sort to ensure consistent results
  debtors.sort((a, b) => b.amount - a.amount);
  creditors.sort((a, b) => b.amount - a.amount);
  
  let debtorIndex = 0;
  let creditorIndex = 0;
  
  while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    
    const paymentAmount = Math.min(debtor.amount, creditor.amount);
    
    if (paymentAmount > 0.01) { // Only create payments for significant amounts
      payments.push({
        from: debtor.user,
        to: creditor.user,
        amount: Math.round(paymentAmount * 100) / 100 // Round to 2 decimal places
      });
    }
    
    debtor.amount -= paymentAmount;
    creditor.amount -= paymentAmount;
    
    if (debtor.amount < 0.01) debtorIndex++;
    if (creditor.amount < 0.01) creditorIndex++;
  }
  
  return payments;
}