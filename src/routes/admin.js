const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { validateEvent, validateAdminToken } = require('../controllers/validators');

const router = express.Router();

// Admin token middleware
router.use(validateAdminToken);

// Create event
router.post('/events', validateEvent, async (req, res) => {
  try {
    console.log('Received event data:', req.body);
    const { college_name, title, type, description, start_time, end_time, capacity } = req.body;
    
    // Find existing college or create new one
    let college = await db('colleges').where('name', college_name).first();
    
    if (!college) {
      // Create new college
      const collegeId = uuidv4();
      college = {
        id: collegeId,
        name: college_name,
        created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
      };
      
      await db('colleges').insert(college);
      console.log(`Created new college: ${college_name}`);
    }
    
    const eventId = uuidv4();
    const event = {
      id: eventId,
      college_id: college.id,
      title,
      type,
      description,
      start_time: new Date(start_time).toISOString().slice(0, 19).replace('T', ' '),
      end_time: new Date(end_time).toISOString().slice(0, 19).replace('T', ' '),
      capacity: capacity || 100,
      status: 'scheduled',
      created_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    console.log('Attempting to insert event:', event);
    await db('events').insert(event);
    
    console.log('Event created successfully with ID:', eventId);
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Error creating event:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage,
      stack: error.stack
    });
    res.status(500).json({
      success: false,
      error: 'Failed to create event',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update event
router.put('/events/:id', validateEvent, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, description, start_time, end_time, capacity, status } = req.body;
    
    const existingEvent = await db('events').where('id', id).first();
    if (!existingEvent) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    const updateData = {
      title,
      type,
      description,
      capacity
    };

    if (start_time) updateData.start_time = new Date(start_time).toISOString().slice(0, 19).replace('T', ' ');
    if (end_time) updateData.end_time = new Date(end_time).toISOString().slice(0, 19).replace('T', ' ');
    if (status) updateData.status = status;

    await db('events').where('id', id).update(updateData);
    
    const updatedEvent = await db('events').where('id', id).first();
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      event: updatedEvent
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update event'
    });
  }
});

// Cancel event (soft delete)
router.delete('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await db('events').where('id', id).first();
    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    await db('events').where('id', id).update({ status: 'cancelled' });
    
    res.json({
      success: true,
      message: 'Event cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling event:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel event'
    });
  }
});

// Get events for a college (admin view)
router.get('/events', async (req, res) => {
  try {
    const { college_id, status, type, page = 1, limit = 20 } = req.query;
    
    let query = db('events')
      .select('events.*', 'colleges.name as college_name')
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .orderBy('events.created_at', 'desc');

    if (college_id) query = query.where('events.college_id', college_id);
    if (status) query = query.where('events.status', status);
    if (type) query = query.where('events.type', type);

    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);

    const events = await query;
    
    // Get registration counts for each event
    for (const event of events) {
      const registrationCount = await db('registrations')
        .where('event_id', event.id)
        .where('status', 'registered')
        .count('* as count')
        .first();
      
      event.registrations_count = registrationCount.count;
    }

    res.json({
      success: true,
      events,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch events'
    });
  }
});

// Get event details with registrations
router.get('/events/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const event = await db('events')
      .select('events.*', 'colleges.name as college_name')
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .where('events.id', id)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get registrations with student details
    const registrations = await db('registrations')
      .select('registrations.*', 'students.name', 'students.email', 'students.roll_no')
      .leftJoin('students', 'registrations.student_id', 'students.id')
      .where('registrations.event_id', id)
      .orderBy('registrations.registered_at', 'desc');

    // Get attendance status for each registration
    for (const registration of registrations) {
      const attendance = await db('attendance')
        .where('registration_id', registration.id)
        .first();
      
      registration.attendance = attendance || null;
    }

    event.registrations = registrations;

    res.json({
      success: true,
      event
    });
  } catch (error) {
    console.error('Error fetching event details:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event details'
    });
  }
});

// Get event registrations for attendance marking
router.get('/events/:eventId/registrations', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = await db('events')
      .select('events.*', 'colleges.name as college_name')
      .leftJoin('colleges', 'events.college_id', 'colleges.id')
      .where('events.id', eventId)
      .first();

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found'
      });
    }

    // Get registrations with student details and attendance status
    const registrations = await db('registrations')
      .select(
        'registrations.id as registration_id',
        'registrations.registered_at',
        'registrations.status as registration_status',
        'students.id as student_id',
        'students.name',
        'students.email',
        'students.roll_no',
        'students.phone',
        'attendance.id as attendance_id',
        'attendance.present',
        'attendance.checked_in_at'
      )
      .join('students', 'registrations.student_id', 'students.id')
      .leftJoin('attendance', 'attendance.registration_id', 'registrations.id')
      .where('registrations.event_id', eventId)
      .where('registrations.status', 'registered')
      .orderBy('students.name', 'asc');

    res.json({
      success: true,
      event,
      registrations: registrations.map(reg => ({
        registration_id: reg.registration_id,
        student_id: reg.student_id,
        name: reg.name,
        email: reg.email,
        roll_no: reg.roll_no,
        phone: reg.phone,
        registered_at: reg.registered_at,
        attendance_status: reg.attendance_id ? (reg.present ? 'present' : 'absent') : 'not_marked',
        checked_in_at: reg.checked_in_at
      }))
    });
  } catch (error) {
    console.error('Error fetching event registrations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event registrations'
    });
  }
});

// Mark student attendance
router.post('/registrations/:registrationId/attendance', async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { present } = req.body; // true for present, false for absent
    
    // Validate input
    if (typeof present !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'Present status must be true or false'
      });
    }

    // Check if registration exists
    const registration = await db('registrations')
      .where('id', registrationId)
      .first();

    if (!registration) {
      return res.status(404).json({
        success: false,
        error: 'Registration not found'
      });
    }

    // Check if attendance record already exists
    const existingAttendance = await db('attendance')
      .where('registration_id', registrationId)
      .first();

    const attendanceData = {
      present: present ? 1 : 0,
      checked_in_at: new Date().toISOString().slice(0, 19).replace('T', ' ')
    };

    let attendanceRecord;

    if (existingAttendance) {
      // Update existing attendance
      await db('attendance')
        .where('registration_id', registrationId)
        .update(attendanceData);
      
      attendanceRecord = {
        id: existingAttendance.id,
        registration_id: registrationId,
        ...attendanceData
      };
    } else {
      // Create new attendance record
      const attendanceId = uuidv4();
      attendanceRecord = {
        id: attendanceId,
        registration_id: registrationId,
        ...attendanceData
      };
      
      await db('attendance').insert(attendanceRecord);
    }

    res.json({
      success: true,
      message: `Student marked as ${present ? 'present' : 'absent'}`,
      attendance: attendanceRecord
    });
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark attendance'
    });
  }
});

module.exports = router;
