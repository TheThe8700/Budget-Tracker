const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

const spendingBreakdown = [];
let nextSpendingId = 1;
let totalBudget = 0;

const defaultColors = ['#2563eb', '#16a34a', '#f97316'];

function buildBudgetHomeRows() {
    return spendingBreakdown.map((entry) => ({
        id: entry.id,
        reason: entry.reason,
        amount: entry.amountSpent,
        color: entry.assignedColor,
        date: entry.date
    }));
}

function createSpendingEntry(body) {
    const reason = String(body.reason ?? body.reasonForSpending ?? body.spendingReason ?? 'Uncategorized').trim() || 'Uncategorized';
    const amountSpent = Number(body.amountSpent ?? body.amount ?? body.spentAmount ?? 0) || 0;
    const dateValue = String(body.date ?? body.spendingDate ?? '').trim();
    const assignedColor = String(body.assignedColor ?? body.color ?? body.spendingColor ?? '').trim() || defaultColors[spendingBreakdown.length % defaultColors.length];

    return {
        id: nextSpendingId++,
        reason,
        amountSpent,
        date: dateValue || null,
        assignedColor
    };
}

function renderBudgetHome(res) {
    return res.render('BudgetHome', {
        budgetTotal: totalBudget,
        spendingBreakdown: buildBudgetHomeRows()
    });
}

app.get('/', (_req, res) => {
    renderBudgetHome(res);
});

app.get('/BudgetHome', (_req, res) => {
    renderBudgetHome(res);
});

app.get('/AllocatePortion', (_req, res) => {
    res.render('AllocatePortion');
});

app.get('/allocate-portion', (_req, res) => {
    res.render('AllocatePortion');
});

app.post(['/AllocatePortion', '/allocate-portion'], (req, res) => {
    spendingBreakdown.push(createSpendingEntry(req.body));
    res.redirect('/BudgetHome');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});