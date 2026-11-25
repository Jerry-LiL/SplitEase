# SplitEase

SplitEase is a small web app for splitting group expenses. You create a group, add the people in it, write down who paid, and the app tells you who should pay whom so everyone ends up even.

It uses the MERN stack: MongoDB, Express, React and Node.js.

One account owns the groups. The people you split with are names on the group, not separate logins. That keeps the screens easy to demo: register once, then add Alice, Bob and Charlie by name.

## Features

- Register and log in. The password is hashed with bcrypt. Group routes check a JWT.
- Group screen: create a group and open it.
- Expense screen: add members, then add a bill with an equal split or a custom split.
- Settlement screen: each member's running balance, then a short who-pays-whom list.

Balances are not stored. `server/utils/balances.js` walks the expenses with a plain loop, then matches debtors and creditors. Refresh the page and it is calculated again.

## Worked example

Three friends: Alice, Bob and Charlie.

**1. Dinner, ₹300, paid by Alice, split equally.**

300 / 3 = ₹100 each.

| Person  | Paid | Their share | Balance |
| ------- | ---: | ----------: | ------: |
| Alice   |  300 |         100 |    +200 |
| Bob     |    0 |         100 |    -100 |
| Charlie |    0 |         100 |    -100 |

Positive means the group owes that person. Negative means that person owes the group.

**2. Cab, ₹150, paid by Bob.** Custom shares: Alice ₹50, Bob ₹0, Charlie ₹100.

Bob paid 150, so his balance goes up by 150, then each share is subtracted.

| Person  | After dinner | This bill        | Balance now |
| ------- | -----------: | ---------------- | ----------: |
| Alice   |         +200 | share 50         |        +150 |
| Bob     |         -100 | paid 150, share 0 |         +50 |
| Charlie |         -100 | share 100        |        -200 |

150 + 50 + (-200) = 0. If the balances do not add up to zero, a share was recorded wrong.

**Who pays whom**

The settlement function builds two lists from those balances:

- debtors: Charlie owes 200
- creditors: Alice is owed 150, Bob is owed 50

It then repeats three steps:

1. Take the debtor who owes the most and the creditor who is owed the most.
2. The payment is the smaller of the two amounts.
3. Subtract that payment from both. Anyone left at 0 drops out of the list.

Step 1. Charlie owes 200 and Alice is owed 150. The smaller amount is 150. Charlie pays Alice ₹150. Charlie still owes 50. Alice is finished.

Step 2. Charlie owes 50 and Bob is owed 50. Charlie pays Bob ₹50. Both drop out.

The list on the settlement screen is:

- Charlie pays Alice ₹150
- Charlie pays Bob ₹50

Same idea if only the dinner existed: Bob pays Alice ₹100, and Charlie pays Alice ₹100.

Equal splits that do not divide cleanly are done in paise (100 paise = ₹1), so the shares still add up. ₹100 across 3 people is ₹33.34, ₹33.33 and ₹33.33. The extra paisa goes to the first people in the list.

In the app, add Alice first, then Bob, then Charlie. For the cab, choose Custom and type 50, 0 and 100.

## Folder structure

```
server/                      Express API (CommonJS, require)
  index.js                   connects to MongoDB and mounts the routes
  middleware/auth.js         reads the JWT and sets req.user
  models/                    User, Group, Expense
  routes/                    auth and group URLs
  controllers/               validation and the database calls
  utils/balances.js          equal split, running balances, settlements
client/                      React app (Vite, import syntax)
  src/main.jsx               renders the app
  src/App.jsx                routes
  src/api.js                 axios, and where the token is saved
  src/AuthContext.jsx        login state for the screens
  src/pages/                 login, register, groups, expenses, settlements
  src/components/            navbar, expense form, tabs
```

The server uses `require` because that is the usual Express style. The React app uses `import` because Vite expects ES modules. There is no shared package at the repo root: install and start each folder on its own.

## API

Send the token on the locked routes:

```
Authorization: Bearer <token>
```

The token is a JWT signed with `JWT_SECRET` from `server/.env`. It expires after 7 days. The payload is `{ "id": "<user id>" }`.

| Method | Path | Auth | What it does |
| ------ | ---- | ---- | ------------ |
| POST | /api/auth/register | no | Create an account and return a token |
| POST | /api/auth/login | no | Check email and password, return a token |
| GET | /api/auth/me | yes | The logged-in user |
| POST | /api/groups | yes | Create a group |
| GET | /api/groups | yes | List my groups |
| GET | /api/groups/:id | yes | One group, including members |
| POST | /api/groups/:id/members | yes | Add a member by name |
| POST | /api/groups/:id/expenses | yes | Add an expense |
| GET | /api/groups/:id/expenses | yes | List expenses, with member names filled in |
| GET | /api/groups/:id/settlements | yes | Running balances and the payment list |

A group that is missing, or that belongs to someone else, returns 404. You only get rows where `owner` is your user id.

Equal expense:

```json
{
  "description": "Dinner",
  "amount": 300,
  "paidBy": "<alice member id>",
  "splitType": "equal",
  "memberIds": ["<alice>", "<bob>", "<charlie>"]
}
```

Custom expense. The shares must add up to `amount`. A share can be 0.

```json
{
  "description": "Cab",
  "amount": 150,
  "paidBy": "<bob member id>",
  "splitType": "custom",
  "splits": [
    { "member": "<alice>", "amount": 50 },
    { "member": "<bob>", "amount": 0 },
    { "member": "<charlie>", "amount": 100 }
  ]
}
```

Missing fields, a negative share, or a split that does not add up returns 400 and `{ "message": "..." }`. The checks are normal `if` statements in the controllers. There is no validation library.

`GET /api/groups/:id/settlements` looks like this for the example above:

```json
{
  "balances": [
    { "memberId": "...", "name": "Alice", "balance": 150 },
    { "memberId": "...", "name": "Bob", "balance": 50 },
    { "memberId": "...", "name": "Charlie", "balance": -200 }
  ],
  "settlements": [
    {
      "from": { "memberId": "...", "name": "Charlie" },
      "to": { "memberId": "...", "name": "Alice" },
      "amount": 150
    },
    {
      "from": { "memberId": "...", "name": "Charlie" },
      "to": { "memberId": "...", "name": "Bob" },
      "amount": 50
    }
  ]
}
```

## Run it locally

You need Node.js 18 or newer, and MongoDB on `mongodb://127.0.0.1:27017`.

Start MongoDB before the API. On a Mac with Homebrew: `brew services start mongodb-community`. On Linux, run `mongod`. On Windows, start the MongoDB service.

Terminal 1, the API:

```bash
cd server
cp .env.example .env
```

Open `server/.env` and change `JWT_SECRET` to a long random string. Then:

```bash
npm install
npm start
```

The API listens on port 5000. If it prints `Could not connect to MongoDB`, the database is not running.

Terminal 2, the website:

```bash
cd client
cp .env.example .env
npm install
npm start
```

Open http://localhost:5173. Register, create a group, add Alice, Bob and Charlie, then enter the dinner and the cab from the example. The Settlements tab should match the table above.

`.env` stays on your machine. Only `.env.example` is committed. Do not put a real `JWT_SECRET` in git.
