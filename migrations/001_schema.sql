-- Campus Event Reporting System Database Schema
-- Using UUIDs (string) for prototype simplicity

CREATE TABLE colleges (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  college_id VARCHAR(36) NOT NULL,
  roll_no VARCHAR(50),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE TABLE events (
  id VARCHAR(36) PRIMARY KEY,
  college_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- e.g. Workshop, Hackathon, Seminar, Fest
  description TEXT,
  start_time DATETIME,
  end_time DATETIME,
  capacity INTEGER DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled', -- scheduled, cancelled, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (college_id) REFERENCES colleges(id) ON DELETE CASCADE
);

CREATE TABLE registrations (
  id VARCHAR(36) PRIMARY KEY,
  event_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'registered', -- registered, cancelled
  UNIQUE(event_id, student_id), -- prevents duplicate registrations
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE attendance (
  id VARCHAR(36) PRIMARY KEY,
  registration_id VARCHAR(36) NOT NULL,
  checked_in_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  present INTEGER DEFAULT 1, -- 1 or 0
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

CREATE TABLE feedback (
  id VARCHAR(36) PRIMARY KEY,
  registration_id VARCHAR(36) NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE
);

-- Indexes for better query performance
CREATE INDEX idx_events_college ON events(college_id);
CREATE INDEX idx_students_college ON students(college_id);
CREATE INDEX idx_reg_event ON registrations(event_id);
CREATE INDEX idx_reg_student ON registrations(student_id);
CREATE INDEX idx_attendance_reg ON attendance(registration_id);
CREATE INDEX idx_feedback_reg ON feedback(registration_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_type ON events(type);
CREATE INDEX idx_events_start_time ON events(start_time);
