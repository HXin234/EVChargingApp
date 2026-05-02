// Database.js
import SQLite from 'react-native-sqlite-storage';

// Open the database
const db = SQLite.openDatabase(
  {
    name: 'EVChargingDB.db',
    location: 'default',
  },
  () => console.log('Database opened successfully'),
  error => console.error('Error opening database: ', error)
);

// 1. INITIALIZE TABLE
export const createTable = () => {
  db.transaction((tx) => {
    tx.executeSql(
      `CREATE TABLE IF NOT EXISTS Bookings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        stationName TEXT,
        date TEXT,
        time TEXT,
        duration INTEGER
      );`,
      [],
      () => console.log('Table created successfully'),
      error => console.error('Error creating table: ', error)
    );
  });
};

// 2. CREATE (With Input Validation)
export const addBooking = (stationName, date, time, duration, onSuccess, onError) => {
  // Input Validation: Ensure no empty fields 
  if (!stationName || !date || !time || !duration) {
    onError('All fields are required. Please fill in the missing details.');
    return;
  }

  db.transaction((tx) => {
    tx.executeSql(
      'INSERT INTO Bookings (stationName, date, time, duration) VALUES (?, ?, ?, ?)',
      [stationName, date, time, duration],
      (tx, results) => {
        if (results.rowsAffected > 0) {
          onSuccess('Booking created successfully!');
        } else {
          onError('Failed to create booking.');
        }
      },
      error => onError('SQL Error: ' + error.message)
    );
  });
};

// 3. READ (Fetch all charging history)
export const getBookings = (setBookingsList) => {
  db.transaction((tx) => {
    tx.executeSql(
      'SELECT * FROM Bookings ORDER BY id DESC',
      [],
      (tx, results) => {
        let temp = [];
        for (let i = 0; i < results.rows.length; ++i) {
          temp.push(results.rows.item(i));
        }
        setBookingsList(temp); // Updates your UI state
      },
      error => console.error('Error fetching bookings: ', error)
    );
  });
};

// 4. UPDATE (Modify an existing booking)
export const updateBooking = (id, newTime, newDuration, onSuccess, onError) => {
   // Input Validation
   if (!newTime || !newDuration) {
    onError('Time and duration cannot be empty.');
    return;
  }

  db.transaction((tx) => {
    tx.executeSql(
      'UPDATE Bookings set time=?, duration=? where id=?',
      [newTime, newDuration, id],
      (tx, results) => {
        if (results.rowsAffected > 0) {
          onSuccess('Booking updated successfully!');
        } else {
          onError('Failed to update booking.');
        }
      },
      error => onError('SQL Error: ' + error.message)
    );
  });
};

// 5. DELETE (Cancel a booking)
export const deleteBooking = (id, onSuccess) => {
  db.transaction((tx) => {
    tx.executeSql(
      'DELETE FROM Bookings where id=?',
      [id],
      (tx, results) => {
        if (results.rowsAffected > 0) {
          onSuccess('Booking canceled.');
        }
      },
      error => console.error('Error deleting booking: ', error)
    );
  });
};