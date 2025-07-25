export interface User {
  id: string;
  name: string;
}

export interface Expense {
  id: string;
  vendor: string;
  amount: number;
  attendees: User[];
  payer: User;
}

export interface Trip {
  id: string;
  name: string;
  users: User[];
  expenses: Expense[];
}

export interface Payment {
  from: User;
  to: User;
  amount: number;
}