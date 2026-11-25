const express = require('express');
const auth = require('../middleware/auth');
const groupController = require('../controllers/groupController');
const expenseController = require('../controllers/expenseController');

const router = express.Router();

router.use(auth);

router.post('/', groupController.createGroup);
router.get('/', groupController.listGroups);
router.get('/:id', groupController.getGroup);
router.post('/:id/members', groupController.addMember);

router.post('/:id/expenses', expenseController.addExpense);
router.get('/:id/expenses', expenseController.listExpenses);
router.get('/:id/settlements', expenseController.getSettlements);

module.exports = router;
