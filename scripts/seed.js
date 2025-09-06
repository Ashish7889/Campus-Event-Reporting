const { v4: uuidv4 } = require('uuid');
const db = require('../src/db');

// Helper function to generate random date within a range
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime())).toISOString();
}

// Helper function to get random items from array
function randomItems(array, count) {
  const shuffled = [...array].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await db('feedback').del();
    await db('attendance').del(); 
    await db('registrations').del();
    await db('events').del();
    await db('students').del();
    await db('colleges').del();

    // Create colleges
    const colleges = [
      { id: 'COL_A', name: 'Tech University of Delhi' },
      { id: 'COL_B', name: 'Engineering Institute of Mumbai' }
    ];

    for (const college of colleges) {
      await db('colleges').insert({
        ...college,
        created_at: new Date().toISOString()
      });
    }

    console.log('✓ Colleges created');

    // Create students (10 per college = 20 total)
    const students = [];
    const firstNames = ['Arjun', 'Priya', 'Rahul', 'Sneha', 'Amit', 'Kavya', 'Ravi', 'Pooja', 'Karan', 'Divya'];
    const lastNames = ['Sharma', 'Patel', 'Kumar', 'Singh', 'Gupta', 'Agarwal', 'Jain', 'Shah', 'Mehta', 'Verma'];

    let studentIndex = 0;
    for (const college of colleges) {
      for (let i = 0; i < 10; i++) {
        const firstName = firstNames[i];
        const lastName = lastNames[i];
        const student = {
          id: `STUD_${studentIndex + 1}`,
          college_id: college.id,
          roll_no: `${college.id === 'COL_A' ? '21' : '22'}CS${(i + 1).toString().padStart(3, '0')}`,
          name: `${firstName} ${lastName}`,
          email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${college.id === 'COL_A' ? 'techuniv' : 'engcollege'}.edu.in`,
          phone: `9${Math.floor(100000000 + Math.random() * 900000000)}`,
          created_at: new Date().toISOString()
        };
        students.push(student);
        await db('students').insert(student);
        studentIndex++;
      }
    }

    console.log('✓ Students created');

    // Create events (4 per college = 8 total)
    const eventTypes = ['Workshop', 'Hackathon', 'Seminar', 'Fest'];
    const events = [];
    const eventTitles = {
      'Workshop': ['AI/ML Workshop', 'Web Development Bootcamp', 'Mobile App Development', 'Data Science Workshop'],
      'Hackathon': ['Code Sprint 2024', 'Innovation Challenge', 'Tech Hackathon', 'Smart City Hackathon'],
      'Seminar': ['Industry Expert Talk', 'Career Guidance Session', 'Research Symposium', 'Technology Trends'],
      'Fest': ['Tech Fest 2024', 'Cultural Festival', 'Annual Sports Meet', 'Innovation Showcase']
    };

    let eventIndex = 0;
    for (const college of colleges) {
      for (let i = 0; i < 4; i++) {
        const type = eventTypes[i];
        const baseDate = new Date();
        baseDate.setDate(baseDate.getDate() + (i * 7) - 14); // Some past, some future events

        const event = {
          id: `EVENT_${eventIndex + 1}`,
          college_id: college.id,
          title: eventTitles[type][i % eventTitles[type].length],
          type: type,
          description: `${type} organized by ${college.name}. Join us for an exciting learning experience!`,
          start_time: randomDate(baseDate, new Date(baseDate.getTime() + 4 * 60 * 60 * 1000)),
          end_time: randomDate(new Date(baseDate.getTime() + 4 * 60 * 60 * 1000), new Date(baseDate.getTime() + 8 * 60 * 60 * 1000)),
          capacity: 50 + Math.floor(Math.random() * 150),
          status: i === 3 ? 'completed' : (i === 2 ? 'scheduled' : 'scheduled'),
          created_at: new Date().toISOString()
        };
        events.push(event);
        await db('events').insert(event);
        eventIndex++;
      }
    }

    console.log('✓ Events created');

    // Create registrations (random registrations for each event)
    const registrations = [];
    for (const event of events) {
      const collegeStudents = students.filter(s => s.college_id === event.college_id);
      const numRegistrations = Math.floor(Math.random() * collegeStudents.length * 0.8) + 3; // 3 to 80% of students
      const selectedStudents = randomItems(collegeStudents, numRegistrations);

      for (const student of selectedStudents) {
        const registration = {
          id: `REG_${registrations.length + 1}`,
          event_id: event.id,
          student_id: student.id,
          registered_at: randomDate(new Date(event.created_at), new Date(event.start_time)),
          status: 'registered'
        };
        registrations.push(registration);
        await db('registrations').insert(registration);
      }
    }

    console.log('✓ Registrations created');

    // Create attendance (70-90% of registrations have attendance)
    const attendanceRecords = [];
    for (const registration of registrations) {
      const event = events.find(e => e.id === registration.event_id);
      
      // Only create attendance for past events and some current ones
      if (new Date(event.start_time) <= new Date() && Math.random() > 0.2) {
        const attendance = {
          id: `ATT_${attendanceRecords.length + 1}`,
          registration_id: registration.id,
          checked_in_at: randomDate(new Date(event.start_time), new Date(event.end_time)),
          present: Math.random() > 0.1 ? 1 : 0 // 90% attendance rate
        };
        attendanceRecords.push(attendance);
        await db('attendance').insert(attendance);
      }
    }

    console.log('✓ Attendance records created');

    // Create feedback (60% of attendees provide feedback)
    const feedbackRecords = [];
    for (const attendance of attendanceRecords) {
      if (attendance.present === 1 && Math.random() > 0.4) {
        const comments = [
          'Great session! Learned a lot.',
          'Very informative and well organized.',
          'Could have been better with more hands-on activities.',
          'Excellent speaker and content.',
          'Good event but venue was too crowded.',
          'Amazing experience, would love more such events.',
          null, null // Some feedback without comments
        ];

        const feedback = {
          id: `FB_${feedbackRecords.length + 1}`,
          registration_id: attendance.registration_id,
          rating: Math.floor(Math.random() * 3) + 3, // Rating between 3-5
          comment: comments[Math.floor(Math.random() * comments.length)],
          submitted_at: new Date().toISOString()
        };
        feedbackRecords.push(feedback);
        await db('feedback').insert(feedback);
      }
    }

    console.log('✓ Feedback records created');

    console.log(`\n🎉 Database seeding completed successfully!`);
    console.log(`📊 Summary:`);
    console.log(`   - Colleges: ${colleges.length}`);
    console.log(`   - Students: ${students.length}`);
    console.log(`   - Events: ${events.length}`);
    console.log(`   - Registrations: ${registrations.length}`);
    console.log(`   - Attendance: ${attendanceRecords.length}`);
    console.log(`   - Feedback: ${feedbackRecords.length}\n`);

  } catch (error) {
    console.error('Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await db.destroy();
  }
}

seedDatabase();
