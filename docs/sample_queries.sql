-- Campus Event Reporting System - Sample SQL Queries
-- These queries demonstrate the core reporting functionality

-- 1. Total registrations per event
-- Shows how popular each event is by counting registrations
SELECT 
    e.id,
    e.title,
    e.type,
    c.name as college_name,
    COUNT(r.id) AS registrations
FROM events e
LEFT JOIN colleges c ON e.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
WHERE e.college_id = 'COL_A'  -- Filter by college (optional)
GROUP BY e.id, e.title, e.type, c.name
ORDER BY registrations DESC;

-- 2. Attendance percentage for an event
-- Calculates what percentage of registered students actually attended
SELECT
    e.id,
    e.title,
    COUNT(r.id) AS registrations,
    COUNT(a.id) AS attended,
    CASE 
        WHEN COUNT(r.id) = 0 THEN 0 
        ELSE (CAST(COUNT(a.id) AS FLOAT) / COUNT(r.id)) * 100 
    END AS attendance_percentage
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN attendance a ON a.registration_id = r.id
WHERE e.id = 'EVENT_1'  -- Specific event
GROUP BY e.id, e.title;

-- 3. Average feedback score per event
-- Shows student satisfaction ratings for events
SELECT 
    e.id,
    e.title,
    AVG(f.rating) AS avg_rating,
    COUNT(f.id) AS rating_count,
    MIN(f.rating) AS min_rating,
    MAX(f.rating) AS max_rating
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id
LEFT JOIN feedback f ON f.registration_id = r.id
WHERE e.id = 'EVENT_1'  -- Specific event
GROUP BY e.id, e.title;

-- 4. Event Popularity Report (sorted by registrations desc)
-- Shows most popular events across all colleges or filtered by college
SELECT 
    e.id,
    e.title,
    e.type,
    c.name as college_name,
    e.start_time,
    e.capacity,
    COUNT(r.id) AS registrations_count
FROM events e
LEFT JOIN colleges c ON e.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
-- WHERE e.college_id = 'COL_A'  -- Optional college filter
-- WHERE e.type = 'Workshop'     -- Optional type filter
GROUP BY e.id, e.title, e.type, c.name, e.start_time, e.capacity
ORDER BY registrations_count DESC
LIMIT 10;

-- 5. Student Participation Report
-- Shows how active a specific student has been
SELECT 
    s.id,
    s.name,
    s.email,
    s.roll_no,
    COUNT(DISTINCT r.event_id) AS events_registered,
    COUNT(a.id) AS events_attended,
    CASE 
        WHEN COUNT(DISTINCT r.event_id) = 0 THEN 0
        ELSE (CAST(COUNT(a.id) AS FLOAT) / COUNT(DISTINCT r.event_id)) * 100 
    END AS attendance_rate
FROM students s
LEFT JOIN registrations r ON r.student_id = s.id
LEFT JOIN attendance a ON a.registration_id = r.id
WHERE s.id = 'STUD_1'  -- Specific student
GROUP BY s.id, s.name, s.email, s.roll_no;

-- 6. Top 3 Most Active Students (by events attended)
-- Shows which students attend the most events
SELECT 
    s.id,
    s.name,
    s.email,
    s.roll_no,
    c.name as college_name,
    COUNT(a.id) AS events_attended
FROM students s
JOIN colleges c ON s.college_id = c.id
JOIN registrations r ON r.student_id = s.id
JOIN attendance a ON a.registration_id = r.id
WHERE s.college_id = 'COL_A'  -- Optional college filter
GROUP BY s.id, s.name, s.email, s.roll_no, c.name
ORDER BY events_attended DESC
LIMIT 3;

-- 7. Events with low attendance (less than 50%)
-- Helps identify events that might need improvement
SELECT 
    e.id,
    e.title,
    e.type,
    c.name as college_name,
    COUNT(r.id) AS registrations,
    COUNT(a.id) AS attended,
    CASE 
        WHEN COUNT(r.id) = 0 THEN 0 
        ELSE (CAST(COUNT(a.id) AS FLOAT) / COUNT(r.id)) * 100 
    END AS attendance_percentage
FROM events e
LEFT JOIN colleges c ON e.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN attendance a ON a.registration_id = r.id
GROUP BY e.id, e.title, e.type, c.name
HAVING attendance_percentage < 50 AND COUNT(r.id) > 0
ORDER BY attendance_percentage ASC;

-- 8. Most popular event types by college
-- Shows which types of events are most popular at each college
SELECT 
    c.name as college_name,
    e.type,
    COUNT(r.id) AS total_registrations,
    COUNT(DISTINCT e.id) AS events_count,
    CAST(COUNT(r.id) AS FLOAT) / COUNT(DISTINCT e.id) AS avg_registrations_per_event
FROM colleges c
JOIN events e ON e.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
GROUP BY c.name, e.type
ORDER BY c.name, total_registrations DESC;

-- 9. Student feedback summary by event type
-- Shows satisfaction levels for different types of events
SELECT 
    e.type,
    COUNT(f.id) AS feedback_count,
    AVG(f.rating) AS avg_rating,
    COUNT(CASE WHEN f.rating >= 4 THEN 1 END) AS positive_feedback,
    COUNT(CASE WHEN f.rating <= 2 THEN 1 END) AS negative_feedback
FROM events e
JOIN registrations r ON r.event_id = e.id
JOIN feedback f ON f.registration_id = r.id
GROUP BY e.type
ORDER BY avg_rating DESC;

-- 10. Events capacity utilization
-- Shows how well events are utilizing their capacity
SELECT 
    e.id,
    e.title,
    e.capacity,
    COUNT(r.id) AS registrations,
    CASE 
        WHEN e.capacity = 0 THEN 'Unlimited'
        ELSE CAST((CAST(COUNT(r.id) AS FLOAT) / e.capacity) * 100 AS TEXT) || '%'
    END AS capacity_utilization,
    CASE
        WHEN e.capacity = 0 THEN 'N/A'
        WHEN COUNT(r.id) >= e.capacity THEN 'Full'
        WHEN COUNT(r.id) >= e.capacity * 0.8 THEN 'Nearly Full'
        WHEN COUNT(r.id) >= e.capacity * 0.5 THEN 'Half Full'
        ELSE 'Low Utilization'
    END AS utilization_status
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
WHERE e.capacity > 0  -- Only events with defined capacity
GROUP BY e.id, e.title, e.capacity
ORDER BY capacity_utilization DESC;

-- 11. Monthly event statistics
-- Shows event activity trends by month
SELECT 
    strftime('%Y-%m', e.start_time) AS month,
    COUNT(DISTINCT e.id) AS events_count,
    COUNT(r.id) AS total_registrations,
    COUNT(a.id) AS total_attendance,
    CAST(AVG(f.rating) AS DECIMAL(3,2)) AS avg_feedback_rating
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN attendance a ON a.registration_id = r.id
LEFT JOIN feedback f ON f.registration_id = r.id
WHERE e.start_time >= date('now', '-12 months')
GROUP BY strftime('%Y-%m', e.start_time)
ORDER BY month DESC;

-- 12. Cross-college event comparison
-- Compares performance metrics between colleges
SELECT 
    c.name as college_name,
    COUNT(DISTINCT e.id) AS total_events,
    COUNT(DISTINCT s.id) AS total_students,
    COUNT(r.id) AS total_registrations,
    COUNT(a.id) AS total_attendance,
    CASE 
        WHEN COUNT(r.id) = 0 THEN 0 
        ELSE (CAST(COUNT(a.id) AS FLOAT) / COUNT(r.id)) * 100 
    END AS overall_attendance_rate,
    AVG(f.rating) AS avg_feedback_rating
FROM colleges c
LEFT JOIN events e ON e.college_id = c.id
LEFT JOIN students s ON s.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN attendance a ON a.registration_id = r.id
LEFT JOIN feedback f ON f.registration_id = r.id
GROUP BY c.id, c.name
ORDER BY total_registrations DESC;

-- 13. Students who registered but never attended any event
-- Helps identify students who might need engagement
SELECT 
    s.id,
    s.name,
    s.email,
    c.name as college_name,
    COUNT(r.id) AS registrations,
    COUNT(a.id) AS attendances
FROM students s
JOIN colleges c ON s.college_id = c.id
LEFT JOIN registrations r ON r.student_id = s.id
LEFT JOIN attendance a ON a.registration_id = r.id
GROUP BY s.id, s.name, s.email, c.name
HAVING COUNT(r.id) > 0 AND COUNT(a.id) = 0
ORDER BY registrations DESC;

-- 14. Events with highest satisfaction (rating >= 4.5)
-- Shows the most successful events based on student feedback
SELECT 
    e.id,
    e.title,
    e.type,
    c.name as college_name,
    COUNT(f.id) AS feedback_count,
    AVG(f.rating) AS avg_rating,
    COUNT(r.id) AS registrations,
    COUNT(a.id) AS attendance
FROM events e
JOIN colleges c ON e.college_id = c.id
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
LEFT JOIN attendance a ON a.registration_id = r.id
LEFT JOIN feedback f ON f.registration_id = r.id
GROUP BY e.id, e.title, e.type, c.name
HAVING AVG(f.rating) >= 4.5 AND COUNT(f.id) >= 3  -- At least 3 feedback entries
ORDER BY avg_rating DESC;

-- 15. Event timing analysis
-- Shows which days and times are most popular for events
SELECT 
    CASE strftime('%w', e.start_time)
        WHEN '0' THEN 'Sunday'
        WHEN '1' THEN 'Monday'  
        WHEN '2' THEN 'Tuesday'
        WHEN '3' THEN 'Wednesday'
        WHEN '4' THEN 'Thursday'
        WHEN '5' THEN 'Friday'
        WHEN '6' THEN 'Saturday'
    END AS day_of_week,
    strftime('%H', e.start_time) AS hour_of_day,
    COUNT(e.id) AS event_count,
    COUNT(r.id) AS total_registrations,
    AVG(CAST(COUNT(r.id) AS FLOAT)) OVER (PARTITION BY strftime('%w', e.start_time)) AS avg_registrations_by_day
FROM events e
LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'registered'
GROUP BY strftime('%w', e.start_time), strftime('%H', e.start_time)
ORDER BY event_count DESC, total_registrations DESC;
