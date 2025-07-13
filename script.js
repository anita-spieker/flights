async function loadFlights() {
  const response = await fetch('data.json');
  const flightsData = await response.json();

  const container = document.getElementById('flights');
  const searchInput = document.getElementById('searchInput');
  const togglePast = document.getElementById('togglePast');
  const sortBy = document.getElementById('sortBy');

  const openCalendarBtn = document.getElementById('openCalendarBtn');
  const calendarModal = document.getElementById('calendarModal');
  const closeCalendarBtn = document.getElementById('closeCalendarBtn');
  const calendarEl = document.getElementById('calendar');

  const openAddFlightBtn = document.getElementById('openAddFlightBtn');
  const addFlightModal = document.getElementById('addFlightModal');
  const closeAddFlightBtn = document.getElementById('closeAddFlightBtn');
  const addFlightForm = document.getElementById('addFlightForm');

  const inputPersonName = document.getElementById('personName');
  const inputAirline = document.getElementById('airline');
  const inputFlightNumber = document.getElementById('flightNumber');
  const inputDeparture = document.getElementById('departure');
  const inputDestination = document.getElementById('destination');
  const inputDepartureDate = document.getElementById('departureDate');
  const inputDepartureTime = document.getElementById('departureTime');
  const inputArrivalDate = document.getElementById('arrivalDate');
  const inputArrivalTime = document.getElementById('arrivalTime');

  let calendar = null;

  function parseFlightDate(flight) {
    const [day, month] = flight.departure_date.split('-');
    const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"].indexOf(month);
    const nowYear = new Date().getFullYear();
    return new Date(nowYear, monthIndex, parseInt(day));
  }

  function isPastFlight(flight) {
    return parseFlightDate(flight) < new Date();
  }

  function buildCalendarEvents(flights) {
    const monthMap = {
      Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
      Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12'
    };

    return flights.map(({ people, flight }) => {
      const year = new Date().getFullYear();
      const [dDay, dMonth] = flight.departure_date.split('-');
      const [aDay, aMonth] = flight.arrival_date.split('-');

      return {
        title: `${flight.flight_number} ${flight.departure}→${flight.destination} (${people.join(', ')})`,
        start: `${year}-${monthMap[dMonth]}-${dDay.padStart(2, '0')}T${flight.departure_time}`,
        end: `${year}-${monthMap[aMonth]}-${aDay.padStart(2, '0')}T${flight.arrival_time}`,
        extendedProps: { flight, people }
      };
    });
  }

  function renderCalendar(flights) {
    if (calendar) calendar.destroy();

    calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 600,
      events: buildCalendarEvents(flights),
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridDay'
      },
      eventClick: ({ event }) => {
        const { flight, people } = event.extendedProps;
        alert(`✈️ ${flight.airline} ${flight.flight_number}
From: ${flight.departure} (${flight.departure_date} ${flight.departure_time})
To: ${flight.destination} (${flight.arrival_date} ${flight.arrival_time})
Passengers: ${people.join(', ')}`);
      }
    });

    calendar.render();
  }

  function renderList(filter = '', hidePast = false, sort = 'dateAsc') {
    container.innerHTML = '';

    let allFlights = [];
    flightsData.forEach(entry => {
      entry.flights.forEach(flight => {
        allFlights.push({ id: entry.id, people: entry.people, flight });
      });
    });

    if (filter) {
      allFlights = allFlights.filter(({ people, flight }) =>
        people.some(p => p.toLowerCase().includes(filter.toLowerCase())) ||
        flight.departure_date.toLowerCase().includes(filter.toLowerCase())
      );
    }

    if (hidePast) {
      allFlights = allFlights.filter(({ flight }) => !isPastFlight(flight));
    }

    switch (sort) {
      case 'dateAsc':
        allFlights.sort((a, b) => parseFlightDate(a.flight) - parseFlightDate(b.flight));
        break;
      case 'dateDesc':
        allFlights.sort((a, b) => parseFlightDate(b.flight) - parseFlightDate(a.flight));
        break;
      case 'airline':
        allFlights.sort((a, b) => a.flight.airline.localeCompare(b.flight.airline));
        break;
      case 'name':
        allFlights.sort((a, b) => a.people.join(', ').localeCompare(b.people.join(', ')));
        break;
    }

    for (const { people, flight } of allFlights) {
      container.innerHTML += `
        <div class="card">
          <h3>${people.join(', ')}</h3>
          <p>${flight.airline} ${flight.flight_number}</p>
          <p>${flight.departure} ➔ ${flight.destination}</p>
          <p>${flight.departure_date} ${flight.departure_time} → ${flight.arrival_date} ${flight.arrival_time}</p>
        </div>
      `;
    }

    return allFlights;
  }

  // Event bindings
  searchInput.addEventListener('input', () => renderList(searchInput.value, togglePast.checked, sortBy.value));
  togglePast.addEventListener('change', () => renderList(searchInput.value, togglePast.checked, sortBy.value));
  sortBy.addEventListener('change', () => renderList(searchInput.value, togglePast.checked, sortBy.value));

  openCalendarBtn.addEventListener('click', () => {
    const filtered = renderList(searchInput.value, togglePast.checked, sortBy.value);
    renderCalendar(filtered);
    calendarModal.style.display = 'block';
  });

  closeCalendarBtn.addEventListener('click', () => {
    calendarModal.style.display = 'none';
  });

  openAddFlightBtn.addEventListener('click', () => {
    addFlightModal.style.display = 'block';
  });

  closeAddFlightBtn.addEventListener('click', () => {
    addFlightModal.style.display = 'none';
  });

  window.addEventListener('click', (e) => {
    if (e.target === calendarModal) calendarModal.style.display = 'none';
    if (e.target === addFlightModal) addFlightModal.style.display = 'none';
  });

  addFlightForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const newFlight = {
      airline: inputAirline.value.trim(),
      flight_number: inputFlightNumber.value.trim(),
      departure: inputDeparture.value.trim(),
      destination: inputDestination.value.trim(),
      departure_date: inputDepartureDate.value.trim(),
      departure_time: inputDepartureTime.value.trim(),
      arrival_date: inputArrivalDate.value.trim(),
      arrival_time: inputArrivalTime.value.trim(),
    };

    const newPeople = inputPersonName.value.split(',').map(p => p.trim());
    flightsData.push({
      id: crypto.randomUUID(),
      people: newPeople,
      flights: [newFlight]
    });

    renderList(searchInput.value, togglePast.checked, sortBy.value);
    addFlightForm.reset();
    addFlightModal.style.display = 'none';
  });

  renderList(); // Initial
}

loadFlights();
