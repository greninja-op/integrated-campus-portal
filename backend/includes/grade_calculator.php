<?php
/**
 * Grade Calculator Helper Functions
 * Provides grade, GP, CP, GPA, and CGPA calculation functions
 */

/**
 * Calculate grade point and letter grade based on total marks
 * @param float $totalMarks Total marks obtained (0-100)
 * @return array Returns ['grade_point' => float, 'letter_grade' => string]
 */
function calculateGrade($totalMarks) {
    $totalMarks = (float) $totalMarks;
    
    // Grading scale based on requirements
    if ($totalMarks >= 90) {
        return ['grade_point' => 4.00, 'letter_grade' => 'A+'];
    } elseif ($totalMarks >= 85) {
        return ['grade_point' => 3.75, 'letter_grade' => 'A'];
    } elseif ($totalMarks >= 80) {
        return ['grade_point' => 3.50, 'letter_grade' => 'A-'];
    } elseif ($totalMarks >= 75) {
        return ['grade_point' => 3.25, 'letter_grade' => 'B+'];
    } elseif ($totalMarks >= 70) {
        return ['grade_point' => 3.00, 'letter_grade' => 'B'];
    } elseif ($totalMarks >= 65) {
        return ['grade_point' => 2.75, 'letter_grade' => 'B-'];
    } elseif ($totalMarks >= 60) {
        return ['grade_point' => 2.50, 'letter_grade' => 'C+'];
    } elseif ($totalMarks >= 55) {
        return ['grade_point' => 2.25, 'letter_grade' => 'C'];
    } elseif ($totalMarks >= 50) {
        return ['grade_point' => 2.00, 'letter_grade' => 'C-'];
    } elseif ($totalMarks >= 45) {
        return ['grade_point' => 1.75, 'letter_grade' => 'D'];
    } elseif ($totalMarks >= 40) {
        return ['grade_point' => 1.50, 'letter_grade' => 'E'];
    } else {
        return ['grade_point' => 0.00, 'letter_grade' => 'F'];
    }
}

/**
 * Calculate credit points for a subject
 * @param float $gradePoint Grade point obtained
 * @param int $creditHours Credit hours for the subject
 * @return float Credit points (GP × Credits)
 */
function calculateCP($gradePoint, $creditHours) {
    $gradePoint = (float) $gradePoint;
    $creditHours = (int) $creditHours;
    
    return round($gradePoint * $creditHours, 2);
}

/**
 * Calculate GPA for a semester
 * @param array $marks Array of marks with grade_point and credit_hours
 * @return float Semester GPA
 * 
 * Example $marks format:
 * [
 *   ['grade_point' => 4.00, 'credit_hours' => 4],
 *   ['grade_point' => 3.75, 'credit_hours' => 3],
 *   ...
 * ]
 */
function calculateGPA($marks) {
    if (empty($marks)) {
        return 0.00;
    }
    
    $totalCreditPoints = 0.0;
    $totalCreditHours = 0;
    
    foreach ($marks as $mark) {
        $gradePoint = (float) $mark['grade_point'];
        $creditHours = (int) $mark['credit_hours'];
        
        // Use higher precision for intermediate calculations
        $totalCreditPoints += ($gradePoint * $creditHours);
        $totalCreditHours += $creditHours;
    }
    
    // Avoid division by zero
    if ($totalCreditHours == 0) {
        return 0.00;
    }
    
    // Calculate with higher precision then round
    $gpa = $totalCreditPoints / $totalCreditHours;
    return round($gpa, 2);
}

/**
 * Calculate CGPA across multiple semesters
 * @param array $semesterGPAs Array of semester data with GPA and total credits
 * @return float Cumulative GPA
 * 
 * Example $semesterGPAs format:
 * [
 *   ['gpa' => 3.75, 'total_credits' => 20],
 *   ['gpa' => 3.50, 'total_credits' => 22],
 *   ...
 * ]
 */
function calculateCGPA($semesterGPAs) {
    if (empty($semesterGPAs)) {
        return 0.00;
    }
    
    $totalWeightedGPA = 0;
    $totalCredits = 0;
    
    foreach ($semesterGPAs as $semester) {
        $gpa = (float) $semester['gpa'];
        $credits = (int) $semester['total_credits'];
        
        $totalWeightedGPA += $gpa * $credits;
        $totalCredits += $credits;
    }
    
    // Avoid division by zero
    if ($totalCredits == 0) {
        return 0.00;
    }
    
    $cgpa = $totalWeightedGPA / $totalCredits;
    return round($cgpa, 2);
}

/**
 * Calculate GPA from database marks records
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @param int $semester Semester number
 * @param int $sessionId Session ID
 * @return array Returns ['gpa' => float, 'total_credits' => int, 'total_credit_points' => float]
 */
function calculateGPAFromDB($db, $studentId, $semester, $sessionId) {
    try {
        $query = "SELECT m.grade_point, s.credit_hours
                  FROM marks m
                  JOIN subjects s ON m.subject_id = s.id
                  WHERE m.student_id = :student_id
                  AND m.semester = :semester
                  AND m.session_id = :session_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':semester', $semester, PDO::PARAM_INT);
        $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
        $stmt->execute();
        
        $marks = $stmt->fetchAll(PDO::FETCH_ASSOC);
        
        if (empty($marks)) {
            return ['gpa' => 0.00, 'total_credits' => 0, 'total_credit_points' => 0.00];
        }
        
        $totalCreditPoints = 0;
        $totalCredits = 0;
        
        foreach ($marks as $mark) {
            $cp = calculateCP($mark['grade_point'], $mark['credit_hours']);
            $totalCreditPoints += $cp;
            $totalCredits += (int) $mark['credit_hours'];
        }
        
        $gpa = $totalCredits > 0 ? round($totalCreditPoints / $totalCredits, 2) : 0.00;
        
        return [
            'gpa' => $gpa,
            'total_credits' => $totalCredits,
            'total_credit_points' => round($totalCreditPoints, 2)
        ];
    } catch (PDOException $e) {
        error_log("Error calculating GPA from DB: " . $e->getMessage());
        return ['gpa' => 0.00, 'total_credits' => 0, 'total_credit_points' => 0.00];
    }
}

/**
 * Calculate CGPA from database for all completed semesters
 * @param PDO $db Database connection
 * @param int $studentId Student ID
 * @param int $sessionId Session ID
 * @return float Cumulative GPA
 */
function calculateCGPAFromDB($db, $studentId, $sessionId) {
    try {
        // Optimized single query to calculate CGPA
        // Sum(GradePoint * CreditHours) / Sum(CreditHours)
        $query = "SELECT 
                    SUM(m.grade_point * s.credit_hours) as total_points,
                    SUM(s.credit_hours) as total_credits
                  FROM marks m
                  JOIN subjects s ON m.subject_id = s.id
                  WHERE m.student_id = :student_id
                  AND m.session_id = :session_id";
        
        $stmt = $db->prepare($query);
        $stmt->bindParam(':student_id', $studentId, PDO::PARAM_INT);
        $stmt->bindParam(':session_id', $sessionId, PDO::PARAM_INT);
        $stmt->execute();
        
        $result = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if (!$result || $result['total_credits'] == 0) {
            return 0.00;
        }
        
        $cgpa = $result['total_points'] / $result['total_credits'];
        return round($cgpa, 2);
        
    } catch (PDOException $e) {
        error_log("Error calculating CGPA from DB: " . $e->getMessage());
        return 0.00;
    }
}

/**
 * Get grade statistics for a subject
 * @param array $marks Array of marks for multiple students
 * @return array Returns statistics including average, highest, lowest
 */
function getGradeStatistics($marks) {
    if (empty($marks)) {
        return [
            'average' => 0.00,
            'highest' => 0.00,
            'lowest' => 0.00,
            'pass_count' => 0,
            'fail_count' => 0,
            'pass_percentage' => 0.00
        ];
    }
    
    $total = 0;
    $highest = 0;
    $lowest = 100;
    $passCount = 0;
    $failCount = 0;
    
    foreach ($marks as $mark) {
        $totalMarks = (float) $mark;
        $total += $totalMarks;
        
        if ($totalMarks > $highest) {
            $highest = $totalMarks;
        }
        
        if ($totalMarks < $lowest) {
            $lowest = $totalMarks;
        }
        
        if ($totalMarks >= 40) {
            $passCount++;
        } else {
            $failCount++;
        }
    }
    
    $count = count($marks);
    $average = $total / $count;
    $passPercentage = ($passCount / $count) * 100;
    
    return [
        'average' => round($average, 2),
        'highest' => round($highest, 2),
        'lowest' => round($lowest, 2),
        'pass_count' => $passCount,
        'fail_count' => $failCount,
        'pass_percentage' => round($passPercentage, 2)
    ];
}

/**
 * Check if student passed the subject
 * @param float $totalMarks Total marks obtained
 * @param float $passingMarks Minimum passing marks (default 40)
 * @return bool True if passed, false otherwise
 */
function isPassed($totalMarks, $passingMarks = 40) {
    return (float) $totalMarks >= (float) $passingMarks;
}

/**
 * Get grade description
 * @param string $letterGrade Letter grade (A+, A, B+, etc.)
 * @return string Description of the grade
 */
function getGradeDescription($letterGrade) {
    $descriptions = [
        'A+' => 'Outstanding',
        'A'  => 'Excellent',
        'A-' => 'Very Good',
        'B+' => 'Good',
        'B'  => 'Above Average',
        'B-' => 'Average',
        'C+' => 'Below Average',
        'C'  => 'Satisfactory',
        'C-' => 'Poor',
        'D'  => 'Very Poor',
        'E'  => 'Extremely Poor',
        'F'  => 'Fail'
    ];
    
    return $descriptions[$letterGrade] ?? 'Unknown';
}

/**
 * Calculate percentage from marks
 * @param float $obtained Marks obtained
 * @param float $total Total marks
 * @return float Percentage
 */
function calculatePercentage($obtained, $total = 100) {
    if ($total == 0) {
        return 0.00;
    }
    
    $percentage = ($obtained / $total) * 100;
    return round($percentage, 2);
}
