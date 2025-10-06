'use client';

import React, { useState } from 'react';
import { Trip, User, Expense, Payment } from '@/types';
import { calculatePayments, debugBalances, downloadPaymentSummary } from '@/utils/billSplitting';

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
  const [showBalanceDetails, setShowBalanceDetails] = useState(false);
  const [isEditingTripName, setIsEditingTripName] = useState(false);
  const [tempTripName, setTempTripName] = useState('');

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
    
    // Clear the expense form when loading example data
    setNewExpense({
      vendor: '',
      amount: '',
      attendeeIds: [],
      payerId: ''
    });
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

  const saveTripName = () => {
    if (tempTripName.trim()) {
      setTrip(prev => ({
        ...prev,
        name: tempTripName.trim()
      }));
    }
    setIsEditingTripName(false);
  };

  const cancelEditTripName = () => {
    setTempTripName('');
    setIsEditingTripName(false);
  };

  const startEditingTripName = () => {
    setTempTripName(trip.name);
    setIsEditingTripName(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <main className="max-w-5xl mx-auto p-6 sm:p-8">
        {/* Header */}
        <header className="text-center mb-10">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Split the Trip
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Easily split expenses and calculate payments for your group&apos;s trip
          </p>
        </header>
        
        {/* Trip Name and Demo Controls */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              {isEditingTripName ? (
                <div className="flex gap-3">
                  <label htmlFor="trip-name-edit" className="sr-only">
                    Edit trip name
                  </label>
                  <input
                    id="trip-name-edit"
                    type="text"
                    value={tempTripName}
                    onChange={(e) => setTempTripName(e.target.value)}
                    className="flex-1 p-4 border-2 border-blue-300 rounded-xl focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 text-lg font-medium transition-colors"
                    onKeyPress={(e) => e.key === 'Enter' && saveTripName()}
                    aria-label="Edit trip name"
                  />
                  <button
                    onClick={saveTripName}
                    className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditTripName}
                    className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl hover:from-red-600 hover:to-red-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button 
                  className="text-2xl font-bold text-slate-800 dark:text-white text-left bg-transparent border-none p-0 cursor-pointer hover:opacity-80 transition-opacity" 
                  onClick={startEditingTripName}
                  aria-label="Click to edit trip name"
                >
                  Trip: <span className="text-blue-600 dark:text-blue-400">{trip.name}</span>
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={loadExampleData}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Load Example Data
              </button>
              <button
                onClick={clearData}
                className="px-6 py-3 bg-gradient-to-r from-slate-500 to-slate-600 text-white font-semibold rounded-xl hover:from-slate-600 hover:to-slate-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Clear All
              </button>
            </div>
          </div>
        </div>

        {/* Add Users */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Participants</h2>
          </div>
          
          <div className="flex gap-3 mb-6">
            <label htmlFor="participant-name" className="sr-only">
              Enter participant name
            </label>
            <input
              id="participant-name"
              type="text"
              value={newUserName}
              onChange={(e) => setNewUserName(e.target.value)}
              placeholder="Enter participant name"
              className="flex-1 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-blue-500 focus:ring-0 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 text-lg font-medium transition-colors"
              onKeyPress={(e) => e.key === 'Enter' && addUser()}
            />
            <button
              onClick={addUser}
              className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-green-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Add
            </button>
          </div>
          
          <div className="flex flex-wrap gap-3">
            {trip.users.map(user => (
              <span key={user.id} className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-700 dark:to-slate-600 text-blue-700 dark:text-blue-300 rounded-full font-semibold border border-blue-200 dark:border-slate-500">
                {user.name}
              </span>
            ))}
            {trip.users.length === 0 && (
              <p className="text-slate-500 dark:text-slate-400 italic">No participants added yet</p>
            )}
          </div>
        </div>

        {/* Add Expenses */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Add Expense</h2>
          </div>
          
          <div className="grid gap-6">
            <div>
              <label htmlFor="expense-vendor" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Vendor
              </label>
              <input
                id="expense-vendor"
                type="text"
                value={newExpense.vendor}
                onChange={(e) => setNewExpense(prev => ({ ...prev, vendor: e.target.value }))}
                placeholder="Restaurant, store, etc."
                className="w-full p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 text-lg transition-colors"
              />
            </div>
            
            <div>
              <label htmlFor="expense-amount" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Amount ($)
              </label>
              <input
                id="expense-amount"
                type="number"
                step="0.01"
                value={newExpense.amount}
                onChange={(e) => setNewExpense(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.00"
                className="w-full p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-700 text-slate-800 dark:text-white placeholder-slate-500 text-lg transition-colors"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Who was present?
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const allUserIds = trip.users.map(u => u.id);
                    const allSelected = allUserIds.every(id => newExpense.attendeeIds.includes(id));
                    
                    setNewExpense(prev => ({
                      ...prev,
                      attendeeIds: allSelected ? [] : allUserIds
                    }));
                  }}
                  className="px-3 py-1 text-xs bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all duration-200"
                >
                  {trip.users.every(user => newExpense.attendeeIds.includes(user.id)) ? 'Deselect All' : 'Select All'}
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {trip.users.map(user => (
                  <label key={user.id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-600 transition-colors">
                    <input
                      type="checkbox"
                      checked={newExpense.attendeeIds.includes(user.id)}
                      onChange={() => toggleAttendee(user.id)}
                      className="w-5 h-5 text-purple-600 bg-gray-100 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                    />
                    <span className="text-slate-800 dark:text-white font-medium">{user.name}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div>
              <label htmlFor="expense-payer" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                Who paid?
              </label>
              <select
                id="expense-payer"
                value={newExpense.payerId}
                onChange={(e) => setNewExpense(prev => ({ ...prev, payerId: e.target.value }))}
                className="w-full p-4 border-2 border-slate-300 dark:border-slate-600 rounded-xl focus:border-purple-500 focus:ring-0 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-lg transition-colors"
              >
                <option value="">Select payer</option>
                {trip.users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
            
            <button
              onClick={addExpense}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:from-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl text-lg"
            >
              Add Expense
            </button>
          </div>
        </div>

        {/* Expenses List */}
        {trip.expenses.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 mb-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Expenses</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-slate-200 dark:border-slate-600">
                    <th className="text-left p-4 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-sm">Vendor</th>
                    <th className="text-left p-4 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-sm">Cost</th>
                    <th className="text-left p-4 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-sm">People Present</th>
                    <th className="text-left p-4 text-slate-700 dark:text-slate-300 font-bold uppercase tracking-wider text-sm">Who Paid</th>
                  </tr>
                </thead>
                <tbody>
                  {trip.expenses.map(expense => (
                    <tr key={expense.id} className="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="p-4 text-slate-800 dark:text-white font-semibold">{expense.vendor}</td>
                      <td className="p-4 text-green-600 dark:text-green-400 font-bold text-lg">${expense.amount.toFixed(2)}</td>
                      <td className="p-4 text-slate-600 dark:text-slate-400">{expense.attendees.map(u => u.name).join(', ')}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full font-semibold text-sm">
                          {expense.payer.name}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Generate Payments */}
        {trip.expenses.length > 0 && (
          <div className="text-center mb-8">
            <button
              onClick={generatePayments}
              className="px-10 py-5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-bold rounded-2xl hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-2xl hover:shadow-3xl text-xl"
            >
              🧮 Generate Payment Plan
            </button>
          </div>
        )}

        {/* Payment Results */}
        {payments.length > 0 && (
          <React.Fragment>
            {/* Payment Summary - Show First */}
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl shadow-2xl border-2 border-emerald-200 dark:border-slate-600 p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-emerald-800 dark:text-emerald-300">Payment Summary</h2>
              </div>
              
              <div className="overflow-x-auto mb-6">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-emerald-300 dark:border-slate-600">
                      <th className="text-left p-4 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-sm">From</th>
                      <th className="text-left p-4 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-sm">To</th>
                      <th className="text-left p-4 text-emerald-700 dark:text-emerald-300 font-bold uppercase tracking-wider text-sm">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment, index) => (
                      <tr key={index} className="border-b border-emerald-100 dark:border-slate-700 hover:bg-emerald-100 dark:hover:bg-slate-600 transition-colors">
                        <td className="p-4">
                          <span className="px-4 py-2 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded-full font-bold">
                            {payment.from.name}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full font-bold">
                            {payment.to.name}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-600 dark:text-emerald-400 font-bold text-xl">
                          ${payment.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Download Button */}
              <div className="flex justify-center mb-6">
                <button
                  onClick={() => downloadPaymentSummary(payments, trip.name)}
                  className="px-6 py-3 bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-semibold rounded-xl hover:from-teal-600 hover:to-emerald-600 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Payment Summary
                </button>
              </div>
            </div>

            {/* Balance Details - Expandable Section */}
            <div className="bg-yellow-50 dark:bg-yellow-900 rounded-2xl shadow-xl border-2 border-yellow-200 dark:border-yellow-700 mb-8">
              <button
                onClick={() => setShowBalanceDetails(!showBalanceDetails)}
                className="w-full p-6 flex items-center justify-between hover:bg-yellow-100 dark:hover:bg-yellow-800 transition-colors rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-300">Balance Details & Calculations</h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-yellow-700 dark:text-yellow-400 font-medium">
                    {showBalanceDetails ? 'Hide' : 'Show'} Details
                  </span>
                  <svg 
                    className={`w-5 h-5 text-yellow-700 dark:text-yellow-400 transition-transform duration-200 ${showBalanceDetails ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>
              
              {showBalanceDetails && (
                <div className="px-8 pb-8">
                  {(() => {
                    const debug = debugBalances(trip);
                    // Add null checks to prevent undefined errors
                    if (!debug || !debug.expenseBreakdown || !debug.directDebts || !debug.netPayments) {
                      return <div className="text-yellow-800 dark:text-yellow-300">No debug data available</div>;
                    }
                    
                    return (
                      <div className="grid gap-6">
                        {/* Expense Breakdown */}
                        <div>
                          <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3">Expense Breakdown</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-yellow-300 dark:border-yellow-600">
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Expense</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Payer</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Attendees</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Split Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {debug.expenseBreakdown.map((item, index) => (
                                  <tr key={index} className="border-b border-yellow-100 dark:border-yellow-800">
                                    <td className="p-3 text-yellow-800 dark:text-yellow-200 font-semibold">{item.expense}</td>
                                    <td className="p-3 text-green-600 dark:text-green-400 font-bold">{item.payer}</td>
                                    <td className="p-3 text-yellow-700 dark:text-yellow-300">{item.attendees.join(', ')}</td>
                                    <td className="p-3 text-blue-600 dark:text-blue-400 font-bold">${item.splitAmount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Direct Debts */}
                        <div>
                          <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3">Direct Debts (Before Netting)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-yellow-300 dark:border-yellow-600">
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">From</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">To</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {debug.directDebts.map((item, index) => (
                                  <tr key={index} className="border-b border-yellow-100 dark:border-yellow-800">
                                    <td className="p-3 text-red-600 dark:text-red-400 font-semibold">{item.from}</td>
                                    <td className="p-3 text-green-600 dark:text-green-400 font-semibold">{item.to}</td>
                                    <td className="p-3 text-yellow-800 dark:text-yellow-200 font-bold">${item.amount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>

                        {/* Net Payments */}
                        <div>
                          <h4 className="text-lg font-bold text-yellow-800 dark:text-yellow-300 mb-3">Net Payments (After Netting)</h4>
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="border-b-2 border-yellow-300 dark:border-yellow-600">
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">From</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">To</th>
                                  <th className="text-left p-3 text-yellow-700 dark:text-yellow-300 font-bold text-sm">Amount</th>
                                </tr>
                              </thead>
                              <tbody>
                                {debug.netPayments.map((item, index) => (
                                  <tr key={index} className="border-b border-yellow-100 dark:border-yellow-800">
                                    <td className="p-3 text-red-600 dark:text-red-400 font-bold">{item.from}</td>
                                    <td className="p-3 text-green-600 dark:text-green-400 font-bold">{item.to}</td>
                                    <td className="p-3 text-yellow-800 dark:text-yellow-200 font-bold text-lg">${item.amount.toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </React.Fragment>
        )}
      </main>
    </div>
  );
}
