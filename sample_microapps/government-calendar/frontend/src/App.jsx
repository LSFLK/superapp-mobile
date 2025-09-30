/**
 * Government Calendar App 🇱🇰
 *
 * A simple React + Vite + TailwindCSS calendar that:
 * - Displays holidays from year-specific JSON files under /events/
 * - Highlights holidays in different colors depending on type
 * - Marks today's date with a neutral highlight
 * - Supports navigating between months and automatically loads events for the correct year
 */


import { useState, useEffect } from "react";
import CalendarGrid from "./components/CalendarGrid";
import Legend from "./components/Legend";
import HolidaySummary from "./components/HolidaySummary";

// Holiday type constants
const HOLIDAY_TYPES = {
  FULL: "holiday_type_1", // Public, Bank, Mercantile
  BANK: "holiday_type_2", // Public, Bank
};

export default function App() {

  const [currentDate, setCurrentDate] = useState(new Date()); // Default starting month → current date
  const [events, setEvents] = useState([]); // Holds holidays for the current year
  const [selectedDate, setSelectedDate] = useState(null); // Selected date for details

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  /**
   * Dynamically load holiday data JSON for the current year.
   * Files are expected at: /events/{year}.json
   */
  useEffect(() => {
    import(`../events/${year}.json`)
      .then((data) => setEvents(data.default))
      .catch(() => setEvents([])); // fallback if file missing
  }, [year]);

  
  // First weekday of the month (0 = Sunday, 6 = Saturday)
  const firstDay = new Date(year, month, 1).getDay();

  // Total number of days in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  // Navigate to previous / next month
  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));


  /**
   * Determine holiday type for a given date.
   * Returns either HOLIDAY_TYPES.FULL, HOLIDAY_TYPES.BANK, or null if no holiday.
   */
  const getHolidayType = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const holiday = events.find(
      (e) => dateStr >= e.start && dateStr < e.end
    );
    if (!holiday) return null;
    if (
      holiday.categories.includes("Public") &&
      holiday.categories.includes("Bank") &&
      holiday.categories.includes("Mercantile")
    )
      return HOLIDAY_TYPES.FULL;
    if (
      holiday.categories.includes("Public") &&
      holiday.categories.includes("Bank")
    )
      return HOLIDAY_TYPES.BANK;
    return null;
  };


  /**
   * Build the grid of days for the calendar.
   * Includes padding (nulls) for days before the first of the month.
   */
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }


  return (
    <div className=" items-center justify-center ">
      <div className=" px-1">

        <h2 className="text-center text-gray-500 mb-4">Sri Lankan Government Calendar 🇱🇰</h2>


        <div className="border rounded-lg p-4 shadow-lg">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
            <span
              onClick={prevMonth}
              className="cursor-pointer text-4xl text-stone-900 hover:text-stone-600"
            >
              ◀
            </span>

            <h3 className="font-semibold text-stone-950 text-lg">
              {currentDate.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </h3>

            <span
              onClick={nextMonth}
              className="cursor-pointer text-4xl text-stone-900 hover:text-stone-600"
            >
              ▶
            </span>
          </div>


          {/* Weekday names and Days */}
          <CalendarGrid calendarDays={calendarDays} getHolidayType={getHolidayType} selectedDate={selectedDate} setSelectedDate={setSelectedDate} />
        </div>

        {/* Legend */}
        <Legend />

        {/* Holiday Summary */}
        <HolidaySummary events={events} currentDate={currentDate} selectedDate={selectedDate} />
                  {/* Today Button */}
          <div className="flex mt-4 mb-4 justify-center ">
            <button
              onClick={() => setCurrentDate(new Date())}
              className="text-xs text-gray-500 hover:text-gray-700 border p-2 rounded-lg"
            >
              Go to today
            </button>
          </div>
      </div>
    </div>
  );
}



