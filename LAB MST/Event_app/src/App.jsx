import React, { useState } from "react";

function EventCalendar() {
  const [events, setEvents] = useState([
    { id: 1, name: "Meeting", date: "2025-10-05" },
    { id: 2, name: "Birthday Party", date: "2025-10-10" },
  ]);

  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  // Add new event
  const handleAdd = (e) => {
    e.preventDefault();
    if (!name || !date) return;

    const newEvent = {
    id: events.length + 1,
    name,
    date,
  };

    setEvents([...events, newEvent]);
    setName("");
    setDate("");
  };

  return (
    <div>
      <h2>Event Calendar</h2>

      <form onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Event name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button type="submit">Add</button>
      </form>

      <table border="1" cellPadding="5" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>Event</th>
            <th>Date</th>
          </tr>
        </thead>
        <tbody>
          {events.map((ev) => (
            <tr key={ev.id}>
              <td>{ev.id}</td>
              <td>{ev.name}</td>
              <td>{ev.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EventCalendar;
