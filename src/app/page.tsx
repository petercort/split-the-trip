'use client';

import { useState } from 'react';
import { Trip, User, Expense, Payment } from '@/types';
import { calculatePayments } from '@/utils/billSplitting';

export default function Home() {
  const [trip, setTrip] = useState<Trip>({
    id: '1',
    name: 'My Trip',
    users: [],
    expenses: []
  });
  
  const [newUserName, setNewUserName] = useState('');
  const [newExpense, setNewExpense] = useState({
    vendor: '',
    amount: '',
    attendeeIds: [] as string[],
    payerId: ''
  });
  
  const [payments, setPayments] = useState<Payment[]>([]);

  const addUser = () => {
    if (!newUserName.trim()) return;
    
    const newUser: User = {
      id: Date.now().toString(),
      name: newUserName.trim()
    };
    
    setTrip(prev => ({
      ...prev,
      users: [...prev.users, newUser]
    }));
    
    setNewUserName('');
  };

  const addExpense = () => {
    if (!newExpense.vendor.trim() || !newExpense.amount || !newExpense.payerId || newExpense.attendeeIds.length === 0) {
      alert('Please fill in all fields');
      return;
    }

    const attendees = trip.users.filter(user => newExpense.attendeeIds.includes(user.id));
    const payer = trip.users.find(user => user.id === newExpense.payerId);
    
    if (!payer) return;

    const expense: Expense = {
      id: Date.now().toString(),
      vendor: newExpense.vendor.trim(),
      amount: parseFloat(newExpense.amount),
      attendees,
      payer
    };

    setTrip(prev => ({
      ...prev,
      expenses: [...prev.expenses, expense]
    }));

    setNewExpense({
      vendor: '',
      amount: '',
      attendeeIds: [],
      payerId: ''
    });
  };

  const generatePayments = () => {
    const calculatedPayments = calculatePayments(trip);
    setPayments(calculatedPayments);
  };

  const loadExampleData = () => {
    // Create users
    const peter: User = { id: '1', name: 'peter' };
    const john: User = { id: '2', name: 'john' };
    const tim: User = { id: '3', name: 'tim' };

    // Create expenses from the problem statement
    const expenses: Expense[] = [
      {
        id: '1',
        vendor: 'Pizza party',
        amount: 20,
        attendees: [peter, john],
        payer: peter
      },
      {
        id: '2', 
        vendor: 'car rental',
        amount: 60,
        attendees: [peter, john, tim],
        payer: tim
      },
      {
        id: '3',
        vendor: 'beer',
        amount: 15,
        attendees: [peter, john, tim],
        payer: john
      }
    ];

    setTrip({
      id: '1',
      name: 'Example Trip',
      users: [peter, john, tim],
      expenses
    });

    setPayments([]);
  };

  const clearData = () => {
    setTrip({
      id: '1',
      name: 'My Trip',
      users: [],
      expenses: []
    });
    setPayments([]);
    setNewExpense({
      vendor: '',
      amount: '',
      attendeeIds: [],
      payerId: ''
    });
  };

  const toggleAttendee = (userId: string) => {
    setNewExpense(prev => ({
      ...prev,
      attendeeIds: prev.attendeeIds.includes(userId)
        ? prev.attendeeIds.filter(id => id !== userId)
        : [...prev.attendeeIds, userId]
    }));
  };

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Split the Bill</h1>
      
      {/* Trip Name and Demo Controls */}
      <div className="mb-8 flex justify-between items-center">
        <h2 className="text-xl font-semibold">Trip: {trip.name}</h2>
        <div className="flex gap-2">
          <button
            onClick={loadExampleData}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Load Example Data
          </button>
          <button
            onClick={clearData}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Clear All
          </button>
        </div>
      </div>

      {/* Add Users */}
      <div className="mb-8 p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add Participants</h3>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
            placeholder="Enter participant name"
            className="flex-1 p-2 border rounded"
            onKeyPress={(e) => e.key === 'Enter' && addUser()}
          />
          <button
            onClick={addUser}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Add
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {trip.users.map(user => (
            <span key={user.id} className="px-3 py-1 bg-gray-200 rounded-full">
              {user.name}
            </span>
          ))}
        </div>
      </div>

      {/* Add Expenses */}
      <div className="mb-8 p-6 border rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Add Expense</h3>
        
        <div className="grid gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Vendor</label>
            <input
              type="text"
              value={newExpense.vendor}
              onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
              placeholder="Restaurant, store, etc."
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Amount ($)</label>
            <input
              type="number"
              step="0.01"
              value={newExpense.amount}
              onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Who was present?</label>
            <div className="flex flex-wrap gap-2">
              {trip.users.map(user => (
                <label key={user.id} className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={newExpense.attendeeIds.includes(user.id)}
                    onChange={() => toggleAttendee(user.id)}
                  />
                  <span>{user.name}</span>
                </label>
              ))}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Who paid?</label>
            <select
              value={newExpense.payerId}
              onChange={(e) => setNewExpense(prev => ({ ...prev, payerId: e.target.value }))}
              className="w-full p-2 border rounded"
            >
              <option value="">Select payer</option>
              {trip.users.map(user => (
                <option key={user.id} value={user.id}>{user.name}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={addExpense}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Add Expense
          </button>
        </div>
      </div>

      {/* Expenses List */}
      {trip.expenses.length > 0 && (
        <div className="mb-8 p-6 border rounded-lg">
          <h3 className="text-lg font-semibold mb-4">Expenses</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Vendor</th>
                  <th className="text-left p-2">Cost</th>
                  <th className="text-left p-2">Users Present</th>
                  <th className="text-left p-2">Who Paid</th>
                </tr>
              </thead>
              <tbody>
                {trip.expenses.map(expense => (
                  <tr key={expense.id} className="border-b">
                    <td className="p-2">{expense.vendor}</td>
                    <td className="p-2">${expense.amount.toFixed(2)}</td>
                    <td className="p-2">{expense.attendees.map(u => u.name).join(', ')}</td>
                    <td className="p-2">{expense.payer.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Generate Payments */}
      {trip.expenses.length > 0 && (
        <div className="mb-8">
          <button
            onClick={generatePayments}
            className="px-6 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-lg font-semibold"
          >
            Generate Payments
          </button>
        </div>
      )}

      {/* Payment Results */}
      {payments.length > 0 && (
        <div className="p-6 border rounded-lg bg-gray-50">
          <h3 className="text-lg font-semibold mb-4">Payment Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Payer</th>
                  <th className="text-left p-2">Recipient</th>
                  <th className="text-left p-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment, index) => (
                  <tr key={index} className="border-b">
                    <td className="p-2">{payment.from.name}</td>
                    <td className="p-2">{payment.to.name}</td>
                    <td className="p-2">${payment.amount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Algorithm Note */}
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-400">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> This algorithm produces the most efficient solution with the minimum number of transactions. 
              Multiple valid solutions exist that achieve the same final balances.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
