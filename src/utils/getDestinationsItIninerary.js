export const getDestinationsInItinerary = async (itinerary) => {
    var destinations_data = [];
    for (var i = 0; i < itinerary.destinations.length; i++) {
        try {
            const id = itinerary.destinations[i];
            const destination_data = apiService.destinations.getById(id);
            destinations_data.push(destination_data);
        } catch (error) {
            console.error('获取行程目的地失败:', error);
            message.error('获取行程目的地失败');
        }
    }
    return { ...itinerary, destinations_data: destinations_data };
}

export const getDestinationsInItineraries = async (itineraries) => {
    var itineraries_with_destinations = [];
    for (var i = 0; i < itineraries.length; i++) {
        const itinerary_with_destinations = await getDestinationsInItinerary(itineraries[i]);
        itineraries_with_destinations.push(itinerary_with_destinations);
    }
    return itineraries_with_destinations;
}