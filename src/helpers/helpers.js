export const sortCarsByDistance = (carsData) => {
  return carsData.sort((a, b) => a.distanceInKm - b.distanceInKm);
};
