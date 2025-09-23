import { useState, useEffect } from "react";
import holidays from "./2025.json";

const dayNames = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function App() {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 0)); // default: January 2025
  const [events, setEvents] = useState([]);

  useEffect(() => {
    setEvents(holidays);
  }, []);

  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  // check if a date has a holiday
  const getHolidayType = (date) => {
    const dateStr = date.toISOString().split("T")[0];
    const holiday = events.find(
      (e) => dateStr >= e.start && dateStr < e.end
    );
    if (!holiday) return null;
    if (holiday.categories.includes("Public") && holiday.categories.includes("Bank") && holiday.categories.includes("Mercantile")) return "public";
    if (holiday.categories.includes("Public") && holiday.categories.includes("Bank")) return "bank";
    return null;
  };

  // build calendar grid
  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarDays.push(new Date(year, month, d));
  }

  return (
    <div className="flex items-start justify-center min-h-screen bg-gray-50 pt-20">
      <div className="p-6 max-w-md w-full bg-gray-50">
        <h2 className="text-lg text-center text-stone-950">Welcome to</h2>
        <h2 className="text-xl font-semibold text-center text-stone-950">Government Calendar</h2>
        <p className="text-center text-gray-500">Sri Lanka</p>

        <div className="mt-20 border rounded-lg p-4 shadow-md">
          {/* Month Header */}
          <div className="flex items-center justify-between mb-4">
          <span
            onClick={prevMonth}
            className="cursor-pointer text-lg text-stone-900 hover:text-stone-600"
          >
            ◀
          </span>

          <h3 className="font-semibold text-stone-950">
            {currentDate.toLocaleString("default", {
              month: "long",
              year: "numeric",
            })}
          </h3>

          <span
            onClick={nextMonth}
            className="cursor-pointer text-lg text-stone-900 hover:text-stone-600"
          >
            ▶
          </span>
        </div>

          {/* Weekday names */}
          <div className="grid grid-cols-7 text-center text-sm font-medium text-gray-500">
            {dayNames.map((d) => (
              <div key={d}>{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 text-center mt-2">
            {calendarDays.map((date, idx) => {
              if (!date) return <div key={idx} className="p-2"></div>;

              const type = getHolidayType(date);
              const dayNum = date.getDate();
              const todayStr = new Date().toDateString();
              const isToday = date.toDateString() === todayStr;

              let className =
                "w-7 text-stone-950 h-7 flex items-center justify-center mx-auto rounded-lg text-xs";
              if (isToday) {
                className += " bg-neutral-300 shadow-sm font-semibold";
              }
              if (type === "public") className += " bg-blue-500 text-white";
              else if (type === "bank") className += " bg-yellow-200";

              return (
                <div key={idx} className="p-1">
                  <div className={className}>{dayNum}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-2 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-neutral-300 inline-block rounded"></span>
            <span className="text-xs text-slate-400">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-yellow-200 inline-block rounded"></span>
            <span className="text-xs text-slate-400">Public, Bank Holidays</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 inline-block rounded"></span>
            <span className="text-xs text-slate-400">Public, Bank, Mercantile Holidays</span>
          </div>
        </div>

      </div>
    </div>
  );
}


