import { Trip, Payment } from '@/types';

/**
 * Calculates payments needed to settle all debts in a trip.
 * 
 * This algorithm works by:
 * 1. For each expense, calculating what each attendee owes the payer
 * 2. Creating a running balance between each pair of users
 * 3. Settling the net amounts between users
 */
export function calculatePayments(trip: Trip): Payment[] {
  // Track what each person owes to each other person
  const owesMatrix = new Map<string, Map<string, number>>();
  
  // Initialize the matrix
  trip.users.forEach(user => {
    owesMatrix.set(user.id, new Map());
    trip.users.forEach(otherUser => {
      if (user.id !== otherUser.id) {
        owesMatrix.get(user.id)!.set(otherUser.id, 0);
      }
    });
  });
  
  // Process each expense
  trip.expenses.forEach(expense => {
    const splitAmount = expense.amount / expense.attendees.length;
    
    // Each attendee (except the payer) owes the payer their share
    expense.attendees.forEach(attendee => {
      if (attendee.id !== expense.payer.id) {
        const currentOwed = owesMatrix.get(attendee.id)!.get(expense.payer.id) || 0;
        owesMatrix.get(attendee.id)!.set(expense.payer.id, currentOwed + splitAmount);
      }
    });
  });
  
  // Calculate net amounts between each pair of users
  const payments: Payment[] = [];
  
  trip.users.forEach(userA => {
    trip.users.forEach(userB => {
      if (userA.id !== userB.id) {
        const aOwesB = owesMatrix.get(userA.id)!.get(userB.id) || 0;
        const bOwesA = owesMatrix.get(userB.id)!.get(userA.id) || 0;
        
        // Calculate the net amount
        const netAmount = aOwesB - bOwesA;
        
        // If userA owes userB money (net positive), create a payment
        if (netAmount > 0.01) {
          payments.push({
            from: userA,
            to: userB,
            amount: Math.round(netAmount * 100) / 100
          });
          
          // Clear both directions to avoid duplicate payments
          owesMatrix.get(userA.id)!.set(userB.id, 0);
          owesMatrix.get(userB.id)!.set(userA.id, 0);
        }
      }
    });
  });
  
  return payments;
}

/**
 * Debug function to show detailed balance calculations
 * This helps verify that the algorithm is working correctly
 */
export function debugBalances(trip: Trip): {
  expenseBreakdown: { expense: string; payer: string; attendees: string[]; splitAmount: number }[];
  directDebts: { from: string; to: string; amount: number }[];
  netPayments: { from: string; to: string; amount: number }[];
} {
  const expenseBreakdown: { expense: string; payer: string; attendees: string[]; splitAmount: number }[] = [];
  const directDebts: { from: string; to: string; amount: number }[] = [];
  
  // Track what each person owes to each other person
  const owesMatrix = new Map<string, Map<string, number>>();
  
  // Initialize the matrix
  trip.users.forEach(user => {
    owesMatrix.set(user.id, new Map());
    trip.users.forEach(otherUser => {
      if (user.id !== otherUser.id) {
        owesMatrix.get(user.id)!.set(otherUser.id, 0);
      }
    });
  });
  
  // Process each expense and track the breakdown
  trip.expenses.forEach(expense => {
    const splitAmount = expense.amount / expense.attendees.length;
    
    expenseBreakdown.push({
      expense: expense.vendor,
      payer: expense.payer.name,
      attendees: expense.attendees.map(a => a.name),
      splitAmount: Math.round(splitAmount * 100) / 100
    });
    
    // Each attendee (except the payer) owes the payer their share
    expense.attendees.forEach(attendee => {
      if (attendee.id !== expense.payer.id) {
        const currentOwed = owesMatrix.get(attendee.id)!.get(expense.payer.id) || 0;
        owesMatrix.get(attendee.id)!.set(expense.payer.id, currentOwed + splitAmount);
      }
    });
  });
  
  // Record all direct debts before netting
  trip.users.forEach(userA => {
    trip.users.forEach(userB => {
      if (userA.id !== userB.id) {
        const amount = owesMatrix.get(userA.id)!.get(userB.id) || 0;
        if (amount > 0.01) {
          directDebts.push({
            from: userA.name,
            to: userB.name,
            amount: Math.round(amount * 100) / 100
          });
        }
      }
    });
  });
  
  // Calculate net payments
  const netPayments: { from: string; to: string; amount: number }[] = [];
  
  trip.users.forEach(userA => {
    trip.users.forEach(userB => {
      if (userA.id !== userB.id) {
        const aOwesB = owesMatrix.get(userA.id)!.get(userB.id) || 0;
        const bOwesA = owesMatrix.get(userB.id)!.get(userA.id) || 0;
        
        // Calculate the net amount
        const netAmount = aOwesB - bOwesA;
        
        // If userA owes userB money (net positive), record it
        if (netAmount > 0.01) {
          netPayments.push({
            from: userA.name,
            to: userB.name,
            amount: Math.round(netAmount * 100) / 100
          });
        }
      }
    });
  });
  
  return {
    expenseBreakdown,
    directDebts,
    netPayments
  };
}

/**
 * Generates CSV content for payment summary download
 */
export function generatePaymentSummaryCSV(payments: Payment[], tripName: string): string {
  const headers = ['From', 'To', 'Amount'];
  const rows = payments.map(payment => [
    payment.from.name,
    payment.to.name,
    `$${payment.amount.toFixed(2)}`
  ]);
  
  const csvContent = [
    `Payment Summary for ${tripName}`,
    `Generated on ${new Date().toLocaleDateString()}`,
    '',
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');
  
  return csvContent;
}

/**
 * Triggers download of payment summary as CSV file
 */
export function downloadPaymentSummary(payments: Payment[], tripName: string): void {
  const csvContent = generatePaymentSummaryCSV(payments, tripName);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${tripName.replace(/\s+/g, '_')}_payment_summary.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}