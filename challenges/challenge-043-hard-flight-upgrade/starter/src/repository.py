class FlightRepository:
    def __init__(self, passengers=None, flights=None):
        self.passengers = passengers or {}
        self.flights = flights or {}

    def add_passenger(self, passenger):
        self.passengers[passenger.id] = passenger

    def add_flight(self, flight):
        self.flights[flight.id] = flight
