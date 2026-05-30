const express = require('express');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));

const spendingBreakdown = [];
let nextSpendingId = 1;
let totalBudget = 0;
let budgetStartDate = null;
let budgetEndDate = null;

const defaultColors = ['#2563eb', '#16a34a', '#f97316'];

function getTodayDateString() {
    return new Date().toISOString().slice(0, 10);
}

function resetBudgetIfExpired() {
    if (!budgetEndDate) {
        return;
    }

    const today = getTodayDateString();

    if (today > budgetEndDate) {
        spendingBreakdown.length = 0;
        totalBudget = 0;
        budgetStartDate = null;
        budgetEndDate = null;
    }
}

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
    resetBudgetIfExpired();

    return res.render('BudgetHome', {
        budgetTotal: totalBudget,
        spendingBreakdown: buildBudgetHomeRows(),
        allocatePortionUrl: '/AllocatePortion'
    });
}

function renderSetBudget(res) {
    resetBudgetIfExpired();

    return res.render('SetBudget', {
        totalBudget,
        budgetStartDate,
        budgetEndDate,
        setBudgetUrl: '/set'
    });
}

function renderEditBudget(res) {
    resetBudgetIfExpired();

    return res.render('EditBudget', {
        totalBudget,
        editBudgetUrl: '/EditBudget'
    });
}

function renderDeletePortion(res) {
    const rows = spendingBreakdown.map((entry) => ({
        id: entry.id,
        reason: entry.reason,
        amount: entry.amountSpent
    }));

    const totalAllocated = rows.reduce((sum, row) => sum + row.amount, 0);

    return res.render('DeletePortion', {
        spendingBreakdown: rows,
        totalAllocated,
        deletePortionUrl: '/DeletePortion'
    });
}

function renderEditPortion(res) {
    const rows = spendingBreakdown.map((entry) => ({
        id: entry.id,
        reason: entry.reason,
        amount: entry.amountSpent,
        color: entry.assignedColor
    }));

    const totalAllocated = rows.reduce((sum, row) => sum + row.amount, 0);

    return res.render('EditPortion', {
        spendingBreakdown: rows,
        totalAllocated,
        editPortionUrl: '/EditPortion'
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

app.get('/DeletePortion', (_req, res) => {
    renderDeletePortion(res);
});

app.get('/delete-portion', (_req, res) => {
    renderDeletePortion(res);
});

app.get('/set', (_req, res) => {
    renderSetBudget(res);
});

app.get('/SetBudget', (_req, res) => {
    renderSetBudget(res);
});

app.get('/EditBudget', (_req, res) => {
    renderEditBudget(res);
});

app.get('/EditPortion', (_req, res) => {
    renderEditPortion(res);
});

app.get('/edit-portion', (_req, res) => {
    renderEditPortion(res);
});

app.post(['/set', '/SetBudget'], (req, res) => {
    const budgetAmount = Number(req.body.amountOfBudget ?? req.body.amount ?? 0) || 0;
    const startDate = String(req.body.startDate ?? '').trim() || null;
    const endDate = String(req.body.endDate ?? '').trim() || null;

    totalBudget = budgetAmount;
    budgetStartDate = startDate;
    budgetEndDate = endDate;

    if (budgetEndDate && getTodayDateString() > budgetEndDate) {
        spendingBreakdown.length = 0;
        totalBudget = 0;
        budgetStartDate = null;
        budgetEndDate = null;
    }

    res.redirect('/BudgetHome');
});

app.post('/EditBudget', (req, res) => {
    resetBudgetIfExpired();

    const amount = Math.abs(Number(req.body.amount ?? req.body.adjustmentAmount ?? 0) || 0);
    const operation = String(req.body.operation ?? 'add').toLowerCase();

    if (operation === 'subtract') {
        totalBudget -= amount;
    } else {
        totalBudget += amount;
    }

    res.redirect('/BudgetHome');
});

app.post(['/AllocatePortion', '/allocate-portion'], (req, res) => {
    resetBudgetIfExpired();
    spendingBreakdown.push(createSpendingEntry(req.body));
    res.redirect('/BudgetHome');
});

app.post('/EditPortion/:id', (req, res) => {
    resetBudgetIfExpired();

    const portionId = Number(req.params.id);
    const portion = spendingBreakdown.find((entry) => entry.id === portionId);
    const updatedAmount = Number(req.body.amount ?? req.body.amountSpent ?? req.body.newAmount ?? 0) || 0;

    if (portion) {
        portion.amountSpent = updatedAmount;
    }

    res.redirect('/EditPortion');
});

app.post('/DeletePortion/:id', (req, res) => {
    resetBudgetIfExpired();

    const portionId = Number(req.params.id);
    const portionIndex = spendingBreakdown.findIndex((entry) => entry.id === portionId);

    if (portionIndex !== -1) {
        spendingBreakdown.splice(portionIndex, 1);
    }

    res.redirect('/DeletePortion');
});


const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});