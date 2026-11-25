// Money maths for one group.
// Amounts are converted to paise (1 rupee = 100 paise) so the loops add
// integers instead of binary fractions like 0.1 + 0.2.

function toPaise(rupees) {
  return Math.round(Number(rupees) * 100);
}

function fromPaise(paise) {
  return Number((paise / 100).toFixed(2));
}

function roundMoney(value) {
  return fromPaise(toPaise(value));
}

// 100 split 3 ways becomes 33.34, 33.33, 33.33. The extra paise go to
// the first people in the list so the shares still add up to the total.
function splitEqually(totalRupees, memberIds) {
  const totalPaise = toPaise(totalRupees);
  const count = memberIds.length;
  const base = Math.floor(totalPaise / count);
  let leftover = totalPaise - base * count;
  const shares = [];

  for (const memberId of memberIds) {
    let paise = base;
    if (leftover > 0) {
      paise += 1;
      leftover -= 1;
    }
    shares.push({ member: memberId, amount: fromPaise(paise) });
  }

  return shares;
}

// Running balance for each member.
// Paying increases your balance. Your share of a bill decreases it.
// Positive => the group owes this person. Negative => this person owes the group.
function calculateBalances(members, expenses) {
  const paiseById = {};

  for (const member of members) {
    paiseById[member._id.toString()] = 0;
  }

  for (const expense of expenses) {
    const payerId = expense.paidBy.toString();
    paiseById[payerId] = (paiseById[payerId] || 0) + toPaise(expense.amount);

    for (const split of expense.splits) {
      const memberId = split.member.toString();
      paiseById[memberId] = (paiseById[memberId] || 0) - toPaise(split.amount);
    }
  }

  const rows = [];
  for (const member of members) {
    const paise = paiseById[member._id.toString()] || 0;
    rows.push({
      memberId: member._id.toString(),
      name: member.name,
      balance: fromPaise(paise),
    });
  }

  return rows;
}

function indexOfLargest(people) {
  let index = 0;
  for (let i = 1; i < people.length; i++) {
    if (people[i].paise > people[index].paise) {
      index = i;
    }
  }
  return index;
}

// Greedy match: while anyone still owes money, pair the biggest debtor
// with the biggest creditor and settle the smaller of the two amounts.
function buildSettlements(balances) {
  const debtors = [];
  const creditors = [];

  for (const row of balances) {
    const paise = toPaise(row.balance);
    if (paise < 0) {
      debtors.push({ memberId: row.memberId, name: row.name, paise: -paise });
    } else if (paise > 0) {
      creditors.push({ memberId: row.memberId, name: row.name, paise });
    }
  }

  const settlements = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtorIndex = indexOfLargest(debtors);
    const creditorIndex = indexOfLargest(creditors);
    const debtor = debtors[debtorIndex];
    const creditor = creditors[creditorIndex];
    const paise = Math.min(debtor.paise, creditor.paise);

    if (paise === 0) {
      break;
    }

    settlements.push({
      from: { memberId: debtor.memberId, name: debtor.name },
      to: { memberId: creditor.memberId, name: creditor.name },
      amount: fromPaise(paise),
    });

    debtor.paise -= paise;
    creditor.paise -= paise;

    if (debtor.paise === 0) {
      debtors.splice(debtorIndex, 1);
    }
    if (creditor.paise === 0) {
      creditors.splice(creditorIndex, 1);
    }
  }

  return settlements;
}

module.exports = {
  roundMoney,
  splitEqually,
  calculateBalances,
  buildSettlements,
};
