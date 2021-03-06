/**
 * Name: Course Calendar
 * Type: Script for the Google Calendar App
 * Description: Generates calendar events for lectures, exams and assignments.
 * Author: Eirik Skogstad
 */

/* Globals */
var MON = CalendarApp.Weekday.MONDAY;
var TUE = CalendarApp.Weekday.TUESDAY;
var WED = CalendarApp.Weekday.WEDNESDAY;
var THU = CalendarApp.Weekday.THURSDAY;
var FRI = CalendarApp.Weekday.FRIDAY;

var SEMESTER_START = new Date("August 24, 2015 8:00:00 AM");
var SEMESTER_END = new Date("December 16, 2015 11:59:00 PM");

/**
 * Course class. Keeps all details about a course
 * along with its assignments and exams.
 */
function Course(options) {
  this.id = options.id
  this.name = options.name;
  this.location = options.location;
  this.start = options.start;
  this.end = options.end;
  this.days = options.days;
  this.until = options.until;
  
  this.assignments = [];
  this.exams = [];
}

/**
 * Add assignments to the course.
 * 
 * assignments: an array of assignment arrays in the following form: [str name, str due]
 * where due is the deadline of the assignment. Note that due MUST be a valid 
 * formatted datetime compatible with the Date() function.
 *
 * Returns: nothing.
 */
Course.prototype.addAssignments = function(assignments) {
  for (var i=0; i<assignments.length; i++) {
    var assignment = {
      name: assignments[i][0],
      start: new Date(assignments[i][1]),
      repeat: assignments[i][2] || null,
      interval: assignments[i][3] || null
    };
    this.assignments[this.assignments.length] = assignment;
  }
}

/**
 * Add exams to the course.
 * 
 * exams: an array of exam arrays in the following form: [str name, str start, str end].
 * Note that start and end MUST be valid formatted datetimes compatible with the Date() 
 * function.
 *
 * Returns: nothing.
 */
Course.prototype.addExams = function(exams) {
  for (var i=0; i<exams.length; i++) {
    var exam = {
      name: exams[i][0],
      start: new Date(exams[i][1]),
      end: new Date(exams[i][2])
    };
    this.exams[this.exams.length] = exam;
  }
}

/**
 * Create the course calendar.
 */
Course.prototype.createCalendar = function() {
  var calendar = CalendarApp.createCalendar(this.id);
  calendar.setTimeZone("America/Los_Angeles");
  
  // Create lecture series
  calendar.createEventSeries(this.id+" Lecture", this.start, this.end, CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekdays(this.days).until(this.until),{location: this.location});
  
  // Create assignments
  for (var i=0; i<this.assignments.length; i++) {
    var assignment = this.assignments[i];
    
    if (!assignment.repeat){
      // Create a single event
      calendar.createEvent(this.id+" "+assignment.name, assignment.start, assignment.start);
    } else {
      // Create a repeating event
      calendar.createEventSeries(this.id+" "+assignment.name, assignment.start, assignment.start, CalendarApp.newRecurrence().addWeeklyRule().onlyOnWeekdays(assignment.repeat).interval(assignment.interval));
    }
  }
  
  // Create exams
  for (var i=0; i<this.exams.length; i++) {
    var exam = this.exams[i];
    calendar.createEvent(this.id+" "+exam.name, exam.start, exam.end);
  }
}

/** MAIN */
function main() {

  // Example courses with assignments and exams:
  
  var cs561 = new Course({
    id: "CS561",
    name: "Foundations of Artificial Intelligence",
    location:"SGM123", 
    start: new Date('August 24, 2015 5:00:00 PM'), 
    end: new Date('August 24, 2015 6:20:00 PM'), 
    days: [MON, WED], 
    until: new Date('December 2, 2015 6:20:00 PM')
  });
  
  cs561.addAssignments([
    ["HW1", "September 23, 2015 11:59:59 PM"],
    ["HW2", "October 19, 2015 11:59:59 PM"],
    ["HW3", "November 23, 2015 11:59:59 PM"]
  ]);
  
  cs561.addExams([
    ["MIDTERM 1", "September 28, 2015 5:00:00 PM", "September 28, 2015 6:20:00 PM"],
    ["MIDTERM 2", "November 2, 2015 5:00:00 PM", "November 2, 2015 6:20:00 PM"],
    ["FINAL", "December 9, 2015 4:30:00 PM", "December 9, 2015 6:30:00 PM"]
  ]);
  
  cs561.createCalendar();
  
  var cs512 = new Course({
    id: "CS512",
    name: "Testing and Analysis of Software Systems",
    location: "VKC101", 
    start: new Date('August 24, 2015 10:00:00 AM'), 
    end: new Date('August 24, 2015 11:20:00 AM'), 
    days: [MON, WED],
    until: new Date('November 30, 2015 11:20:00 AM')
  });
  
  cs512.createCalendar();
}
