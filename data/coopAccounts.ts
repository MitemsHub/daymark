export interface CoopAccount {
  id: string;
  /** the co-op's own account code, e.g. 2416 */
  code: string;
  name: string;
  accountNo: string;
  purpose: string;
}

// The co-op's bank accounts, as printed in the reference sheet.
export const coopAccounts: CoopAccount[] = [
  { id: "acct-2416", code: "2416", name: "GTB", accountNo: "0023723318", purpose: "Savings, Loan Liquidation" },
  { id: "acct-2426", code: "2426", name: "Zenith Bank Asokoro (Dutse)", accountNo: "1016220684", purpose: "Investment" },
  { id: "acct-2452", code: "2452", name: "UBA Subscription (Shares)", accountNo: "2344374232", purpose: "Shares Contribution" },
  { id: "acct-2435", code: "2435", name: "Zenith Bank Ops", accountNo: "1016577436", purpose: "Payment" },
  { id: "acct-2436", code: "2436", name: "First Bank", accountNo: "2035633079", purpose: "Payment" },
  { id: "acct-2431", code: "2431", name: "UBA Project", accountNo: "1028637603", purpose: "For Guzape Project" },
  { id: "acct-2420", code: "2420", name: "Zenith Bank Wuse", accountNo: "1012176312", purpose: "Payment" },
  { id: "acct-2419", code: "2419", name: "Fidelity Bank", accountNo: "5080056982", purpose: "Payment" },
];
