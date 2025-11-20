<?php
require_once __DIR__ . '/../includes/functions.php';

function runTest() {
    echo "Running calculateLateFine tests...\n";

    // Case 1: Standard fine calculation
    $dueDate = date('Y-m-d', strtotime('-5 days'));
    $finePerDay = 10.00;
    $maxFine = 100.00;
    $fine = calculateLateFine($dueDate, $finePerDay, $maxFine);

    if ($fine != 50.00) {
        echo "FAIL: Standard calculation failed. Expected 50.00, got $fine\n";
        return false;
    } else {
        echo "PASS: Standard calculation\n";
    }

    // Case 2: Max fine cap
    $dueDate = date('Y-m-d', strtotime('-20 days'));
    $finePerDay = 10.00;
    $maxFine = 100.00;
    $fine = calculateLateFine($dueDate, $finePerDay, $maxFine);

    if ($fine != 100.00) {
        echo "FAIL: Max fine cap failed. Expected 100.00, got $fine\n";
        return false;
    } else {
        echo "PASS: Max fine cap\n";
    }

    // Case 3: No fine before due date
    $dueDate = date('Y-m-d', strtotime('+5 days'));
    $finePerDay = 10.00;
    $maxFine = 100.00;
    $fine = calculateLateFine($dueDate, $finePerDay, $maxFine);

    if ($fine != 0.00) {
        echo "FAIL: No fine check failed. Expected 0.00, got $fine\n";
        return false;
    } else {
        echo "PASS: No fine check\n";
    }

    // Case 4: Max fine 0 (Should be unlimited)
    // This is the bug fix verification case
    $dueDate = date('Y-m-d', strtotime('-5 days'));
    $finePerDay = 10.00;
    $maxFine = 0.00;
    $fine = calculateLateFine($dueDate, $finePerDay, $maxFine);

    // Before fix, this returns 0. After fix, it should return 50.
    if ($fine == 0.00) {
        echo "FAIL: Max fine 0 (unlimited) failed. Expected 50.00, got 0.00 (BUG REPRODUCED)\n";
        return false;
    } elseif ($fine == 50.00) {
        echo "PASS: Max fine 0 (unlimited)\n";
    } else {
        echo "FAIL: Max fine 0 (unlimited) returned unexpected value: $fine\n";
        return false;
    }

    return true;
}

if (runTest()) {
    echo "All tests passed!\n";
    exit(0);
} else {
    echo "Some tests failed.\n";
    exit(1);
}
